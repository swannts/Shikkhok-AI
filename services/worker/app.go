package main

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"time"

	firebase "firebase.google.com/go/v4"
	"firebase.google.com/go/v4/messaging"
	"github.com/redis/go-redis/v9"
	"google.golang.org/api/option"
)

const notificationIdempotencyPrefix = "idemp:worker:notif:"

type app struct {
	cfg   Config
	redis *redis.Client
	http  *http.Client
	fcm   *messaging.Client
}

func newApp(cfg Config, rdb *redis.Client) *app {
	a := &app{cfg: cfg, redis: rdb, http: &http.Client{Timeout: 30 * time.Second}}
	return a
}

func decodeObject(raw json.RawMessage) map[string]any {
	var result map[string]any
	_ = json.Unmarshal(raw, &result)
	if result == nil {
		result = map[string]any{}
	}
	if nested, ok := result["data"].(map[string]any); ok {
		return nested
	}
	return result
}
func stringValue(m map[string]any, k string) string { s, _ := m[k].(string); return s }
func numberValue(m map[string]any, k string, fallback float64) float64 {
	n, ok := m[k].(float64)
	if !ok {
		return fallback
	}
	return n
}
func boolValue(m map[string]any, k string) bool { b, _ := m[k].(bool); return b }
func jsonBytes(value any) []byte                { b, _ := json.Marshal(value); return b }

func (a *app) signedHeaders(method, path string, body []byte, requestID string) http.Header {
	timestamp := fmt.Sprint(time.Now().Unix())
	sum := sha256.Sum256(body)
	canonical := fmt.Sprintf("%s\n%s\n%s\n%x", timestamp, strings.ToUpper(method), path, sum)
	mac := hmac.New(sha256.New, []byte(a.cfg.HMACSecret))
	_, _ = mac.Write([]byte(canonical))
	headers := make(http.Header)
	headers.Set("Content-Type", "application/json")
	headers.Set("X-Service-Name", "shikkhok-worker")
	headers.Set("X-Service-Timestamp", timestamp)
	headers.Set("X-Service-Signature", hex.EncodeToString(mac.Sum(nil)))
	if requestID != "" {
		headers.Set("X-Request-Id", requestID)
	}
	return headers
}

func (a *app) request(ctx context.Context, method, base, path string, body []byte, contentType string, timeout time.Duration) ([]byte, int, error) {
	reqCtx, cancel := context.WithTimeout(ctx, timeout)
	defer cancel()
	req, err := http.NewRequestWithContext(reqCtx, method, base+path, bytes.NewReader(body))
	if err != nil {
		return nil, 0, err
	}
	req.Header.Set("Content-Type", contentType)
	if a.cfg.HMACSecret != "" {
		for k, vs := range a.signedHeaders(method, path, body, fmt.Sprintf("worker_%d", time.Now().UnixNano())) {
			req.Header[k] = vs
		}
	}
	client := *a.http
	client.Timeout = timeout
	resp, err := client.Do(req)
	if err != nil {
		return nil, 0, err
	}
	defer resp.Body.Close()
	b, _ := io.ReadAll(io.LimitReader(resp.Body, 16<<20))
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return b, resp.StatusCode, fmt.Errorf("%s %s returned %d: %s", method, path, resp.StatusCode, string(b))
	}
	return b, resp.StatusCode, nil
}

func (a *app) notification(ctx context.Context, job Job) error {
	data := decodeObject(job.Data)
	switch job.Name {
	case "PUSH_NOTIFICATION", "NOTIFICATIONS":
		return a.pushNotification(ctx, job, data)
	case "EMAIL":
		return a.sendEmail(ctx, data)
	case "SMS":
		return a.sendSMS(ctx, data)
	default:
		fmt.Printf("unhandled notification job: %s\n", job.Name)
		return nil
	}
}

func (a *app) pushNotification(ctx context.Context, job Job, data map[string]any) error {
	notificationID := stringValue(data, "notificationId")
	if notificationID == "" {
		notificationID = stringValue(data, "requestId")
	}
	idempotencyKey := ""
	if notificationID != "" {
		idempotencyKey = notificationIdempotencyPrefix + notificationID
		if a.redis != nil {
			cached, e := a.redis.Get(ctx, idempotencyKey).Result()
			if e == nil && cached != "" {
				fmt.Printf("notification %s already delivered\n", notificationID)
				return nil
			}
		}
	}
	var tokens []string
	if list, ok := data["tokens"].([]any); ok {
		for _, item := range list {
			if token, ok := item.(string); ok && token != "" {
				tokens = append(tokens, token)
			}
		}
	}
	userID := stringValue(data, "userId")
	if len(tokens) == 0 && userID != "" {
		fmt.Printf("notification has no active device tokens user=%s\n", userID)
		return nil
	}
	if len(tokens) == 0 {
		return nil
	}
	client, err := a.firebaseMessaging(ctx)
	if err != nil {
		if a.cfg.Environment == "development" || a.cfg.Environment == "test" || len(tokens) == 0 {
			fmt.Printf("[FCM sandbox] sent %q to %d token(s)\n", stringValue(data, "title"), len(tokens))
			return a.cacheNotification(ctx, idempotencyKey, `{"status":"DELIVERED","provider":"FCM-Sandbox"}`)
		}
		return err
	}
	payload := map[string]string{}
	if obj, ok := data["payload"].(map[string]any); ok {
		for k, v := range obj {
			if v != nil {
				payload[k] = fmt.Sprint(v)
			}
		}
	}
	var delivered, failed, invalid []string
	for _, token := range tokens {
		msg := &messaging.Message{Token: token, Notification: &messaging.Notification{Title: stringValue(data, "title"), Body: stringValue(data, "body")}, Data: payload}
		if stringValue(data, "type") == "PRACTICE" {
			msg.Android = &messaging.AndroidConfig{Notification: &messaging.AndroidNotification{ChannelID: "practice_results"}}
		}
		_, sendErr := client.Send(ctx, msg)
		if sendErr == nil {
			delivered = append(delivered, token)
			continue
		}
		lower := strings.ToLower(sendErr.Error())
		if strings.Contains(lower, "registration-token-not-registered") || strings.Contains(lower, "invalid-registration-token") || strings.Contains(lower, "invalid argument") {
			invalid = append(invalid, token)
		} else {
			failed = append(failed, token)
		}
	}
	if len(invalid) > 0 {
		a.deactivateTokens(ctx, invalid)
	}
	result := map[string]any{"status": "DELIVERED", "provider": "FCM-HTTP-v1", "deliveredAt": time.Now().UTC().Format(time.RFC3339Nano), "deliveredCount": len(delivered), "failedCount": len(failed), "invalidCount": len(invalid), "invalidTokens": invalid, "requestId": data["requestId"]}
	if len(failed) > 0 {
		result["status"] = "PARTIAL"
	}
	return a.cacheNotification(ctx, idempotencyKey, string(jsonBytes(result)))
}

func (a *app) cacheNotification(ctx context.Context, key, value string) error {
	if key != "" && a.redis != nil {
		return a.redis.Set(ctx, key, value, 24*time.Hour).Err()
	}
	return nil
}

func (a *app) firebaseMessaging(ctx context.Context) (*messaging.Client, error) {
	if a.fcm != nil {
		return a.fcm, nil
	}
	var opts []option.ClientOption
	if a.cfg.FirebaseServiceAccountPath != "" {
		opts = append(opts, option.WithCredentialsFile(a.cfg.FirebaseServiceAccountPath))
	} else if a.cfg.FirebasePrivateKey != "" {
		creds := map[string]string{"type": "service_account", "project_id": a.cfg.FirebaseProjectID, "client_email": a.cfg.FirebaseClientEmail, "private_key": a.cfg.FirebasePrivateKey, "token_uri": "https://oauth2.googleapis.com/token"}
		opts = append(opts, option.WithCredentialsJSON(jsonBytes(creds)))
	} else {
		return nil, errors.New("Firebase credentials not configured")
	}
	app, err := firebase.NewApp(ctx, &firebase.Config{ProjectID: a.cfg.FirebaseProjectID}, opts...)
	if err != nil {
		return nil, err
	}
	client, err := app.Messaging(ctx)
	if err == nil {
		a.fcm = client
	}
	return client, err
}

func (a *app) deactivateTokens(ctx context.Context, tokens []string) {
	path := "/api/v1/notifications/device-tokens/deactivate"
	body := jsonBytes(map[string]any{"tokens": tokens})
	if _, _, err := a.request(ctx, http.MethodPost, a.cfg.APIServiceURL, path, body, "application/json", 10*time.Second); err != nil {
		fmt.Printf("could not deactivate invalid FCM tokens: %v\n", err)
	}
}

func (a *app) sendEmail(ctx context.Context, d map[string]any) error {
	recipient, subject, html := stringValue(d, "recipient"), stringValue(d, "subject"), stringValue(d, "htmlContent")
	if a.cfg.ResendAPIKey != "" {
		payload := map[string]any{"from": a.cfg.DefaultFromEmail, "to": []string{recipient}, "subject": subject, "html": html}
		if err := a.providerRequest(ctx, "https://api.resend.com/emails", a.cfg.ResendAPIKey, "Bearer", payload); err == nil {
			return nil
		} else {
			fmt.Printf("resend failed: %v\n", err)
		}
	}
	if a.cfg.SendGridAPIKey != "" {
		payload := map[string]any{"personalizations": []any{map[string]any{"to": []any{map[string]string{"email": recipient}}}}, "from": map[string]string{"email": a.cfg.DefaultFromEmail, "name": "Shikkhok AI"}, "subject": subject, "content": []any{map[string]string{"type": "text/html", "value": html}}}
		if err := a.providerRequest(ctx, "https://api.sendgrid.com/v3/mail/send", a.cfg.SendGridAPIKey, "Bearer", payload); err == nil {
			return nil
		} else {
			fmt.Printf("sendgrid failed: %v\n", err)
		}
	}
	fmt.Printf("[sandbox email] to=<%s> subject=%q\n", recipient, subject)
	return nil
}

func (a *app) providerRequest(ctx context.Context, endpoint, key, prefix string, payload any) error {
	ctx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, bytes.NewReader(jsonBytes(payload)))
	if err != nil {
		return err
	}
	req.Header.Set("Authorization", prefix+" "+key)
	req.Header.Set("Content-Type", "application/json")
	resp, err := a.http.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		b, _ := io.ReadAll(io.LimitReader(resp.Body, 4096))
		return fmt.Errorf("provider status %d: %s", resp.StatusCode, string(b))
	}
	return nil
}

func (a *app) sendSMS(ctx context.Context, d map[string]any) error {
	recipient := regexp.MustCompile(`[^0-9+]`).ReplaceAllString(stringValue(d, "recipient"), "")
	message := stringValue(d, "message")
	if a.cfg.SSLWirelessToken != "" && a.cfg.SSLWirelessSID != "" {
		number := strings.TrimPrefix(recipient, "+88")
		payload := map[string]any{"api_token": a.cfg.SSLWirelessToken, "sid": a.cfg.SSLWirelessSID, "msisdn": number, "sms": message, "csms_id": fmt.Sprintf("shikkhok_%d", time.Now().UnixNano())}
		if err := a.providerRequest(ctx, strings.TrimRight(a.cfg.SSLWirelessDomain, "/")+"/api/v3/send-sms", "", "", payload); err == nil {
			return nil
		} else {
			fmt.Printf("SSL Wireless failed: %v\n", err)
		}
	}
	if a.cfg.TwilioAccountSID != "" && a.cfg.TwilioAuthToken != "" && a.cfg.TwilioFromNumber != "" {
		form := url.Values{"To": {recipient}, "From": {a.cfg.TwilioFromNumber}, "Body": {message}}
		ctx, cancel := context.WithTimeout(ctx, 10*time.Second)
		defer cancel()
		endpoint := "https://api.twilio.com/2010-04-01/Accounts/" + a.cfg.TwilioAccountSID + "/Messages.json"
		req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, strings.NewReader(form.Encode()))
		if err != nil {
			return err
		}
		req.SetBasicAuth(a.cfg.TwilioAccountSID, a.cfg.TwilioAuthToken)
		req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
		resp, err := a.http.Do(req)
		if err == nil {
			defer resp.Body.Close()
			if resp.StatusCode >= 200 && resp.StatusCode < 300 {
				return nil
			}
			b, _ := io.ReadAll(io.LimitReader(resp.Body, 4096))
			fmt.Printf("twilio failed: %d %s\n", resp.StatusCode, b)
		} else {
			fmt.Printf("twilio failed: %v\n", err)
		}
	}
	fmt.Printf("[sandbox sms] to=%s\n", recipient)
	return nil
}

type CurriculumJob struct {
	Text              string `json:"text"`
	SourceBook        string `json:"sourceBook"`
	BookID            string `json:"bookId"`
	ClassLevel        int    `json:"classLevel"`
	Medium            string `json:"medium"`
	SubjectID         string `json:"subjectId"`
	SubjectTitle      string `json:"subjectTitle"`
	ChapterID         string `json:"chapterId"`
	ChapterTitle      string `json:"chapterTitle"`
	CurriculumVersion string `json:"curriculumVersion"`
	AcademicYear      int    `json:"academicYear"`
	PageStart         int    `json:"pageStart"`
	PageEnd           int    `json:"pageEnd"`
	ChunkSize         int    `json:"chunkSize"`
	ChunkOverlap      int    `json:"chunkOverlap"`
	FilePath          string `json:"filePath"`
	StructureOnly     bool   `json:"structureOnly"`
}

func (a *app) curriculum(ctx context.Context, job Job) error {
	var data CurriculumJob
	raw := decodeObject(job.Data)
	b, _ := json.Marshal(raw)
	if err := json.Unmarshal(b, &data); err != nil {
		return err
	}
	if data.BookID == "" || data.SubjectID == "" || data.CurriculumVersion == "" || data.AcademicYear == 0 {
		return errors.New("missing required curriculum job fields: bookId, subjectId, curriculumVersion, academicYear")
	}
	if data.FilePath != "" {
		return a.curriculumPDF(ctx, job, data)
	}
	if data.Text == "" {
		return errors.New("missing required curriculum job field: text")
	}
	_ = a.reportProgress(ctx, data.BookID, "processing", nil)
	path := "/api/v1/ingestion/text"
	payload := map[string]any{"text": data.Text, "source_book": data.SourceBook, "book_id": data.BookID, "class_level": data.ClassLevel, "subject_id": data.SubjectID, "subject_title": first(data.SubjectTitle, data.SubjectID), "chapter_id": first(data.ChapterID, "intro"), "chapter_title": first(data.ChapterTitle, data.ChapterID), "curriculum_version": data.CurriculumVersion, "academic_year": data.AcademicYear, "page_start": defaultInt(data.PageStart, 1), "page_end": defaultInt(data.PageEnd, 1), "chunk_size": defaultInt(data.ChunkSize, 300), "chunk_overlap": defaultInt(data.ChunkOverlap, 50)}
	body := jsonBytes(payload)
	resp, _, err := a.request(ctx, http.MethodPost, a.cfg.AIServiceURL, path, body, "application/json", 30*time.Second)
	if err != nil {
		_ = a.reportProgress(ctx, data.BookID, "failed", map[string]any{"error": err.Error()})
		return err
	}
	var result map[string]any
	_ = json.Unmarshal(resp, &result)
	count := int(numberValue(result, "vectors_generated", numberValue(result, "chunk_count", 0)))
	status := "indexed"
	failed := 0
	if count == 0 {
		status = "partially_failed"
		failed = 1
	}
	_ = a.reportProgress(ctx, data.BookID, status, map[string]any{"indexedChunkCount": count, "failedChunkCount": failed})
	return nil
}

func (a *app) curriculumPDF(ctx context.Context, job Job, d CurriculumJob) error {
	if d.Medium == "" {
		return errors.New("missing required curriculum job field: medium")
	}
	_ = a.reportProgress(ctx, d.BookID, "processing", nil)
	file, err := os.Open(d.FilePath)
	if err != nil {
		_ = a.reportProgress(ctx, d.BookID, "failed", map[string]any{"error": err.Error()})
		return err
	}
	defer file.Close()
	var body bytes.Buffer
	form := multipart.NewWriter(&body)
	part, err := form.CreateFormFile("file", filepath.Base(first(d.SourceBook, "textbook.pdf")))
	if err != nil {
		return err
	}
	if _, err = io.Copy(part, file); err != nil {
		return err
	}
	fields := map[string]string{"class_level": fmt.Sprint(d.ClassLevel), "subject_id": d.SubjectID, "subject_title": first(d.SubjectTitle, d.SubjectID), "source_book": first(d.SourceBook, d.BookID), "medium": d.Medium, "curriculum_year": fmt.Sprint(d.AcademicYear), "curriculum_version": d.CurriculumVersion, "book_id": d.BookID, "structure_only": fmt.Sprint(d.StructureOnly)}
	for k, v := range fields {
		if err = form.WriteField(k, v); err != nil {
			return err
		}
	}
	_ = form.Close()
	path := "/api/v1/ingestion/pdf"
	ctxPDF, cancel := context.WithTimeout(ctx, 15*time.Minute)
	defer cancel()
	req, err := http.NewRequestWithContext(ctxPDF, http.MethodPost, a.cfg.AIServiceURL+path, &body)
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", form.FormDataContentType())
	for k, vs := range a.signedHeaders(http.MethodPost, path, body.Bytes(), fmt.Sprintf("worker_pdf_%s", job.ID)) {
		req.Header[k] = vs
	}
	client := *a.http
	client.Timeout = 15 * time.Minute
	resp, err := client.Do(req)
	if err != nil {
		_ = a.reportProgress(ctx, d.BookID, "failed", map[string]any{"error": err.Error()})
		return err
	}
	defer resp.Body.Close()
	respBody, _ := io.ReadAll(io.LimitReader(resp.Body, 16<<20))
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		err = fmt.Errorf("AI PDF ingestion returned %d: %s", resp.StatusCode, respBody)
		_ = a.reportProgress(ctx, d.BookID, "failed", map[string]any{"error": err.Error()})
		return err
	}
	var result map[string]any
	_ = json.Unmarshal(respBody, &result)
	sections, _ := result["sections"].([]any)
	if len(sections) > 0 {
		structurePath := "/api/v1/internal/curriculum/" + url.PathEscape(d.BookID) + "/structure"
		body2 := jsonBytes(map[string]any{"sections": sections})
		_, _, err = a.request(ctx, http.MethodPost, a.cfg.APIServiceURL, structurePath, body2, "application/json", 30*time.Second)
		if err != nil {
			_ = a.reportProgress(ctx, d.BookID, "failed", map[string]any{"error": err.Error()})
			return err
		}
	}
	status := "indexed"
	failed := 0
	if len(sections) == 0 {
		status = "partially_failed"
		failed = 1
	}
	_ = a.reportProgress(ctx, d.BookID, status, map[string]any{"indexedChunkCount": int(numberValue(result, "vectors_generated", 0)), "failedChunkCount": failed})
	return nil
}

func (a *app) reportProgress(ctx context.Context, bookID, status string, fields map[string]any) error {
	path := "/api/v1/internal/curriculum/" + url.PathEscape(bookID) + "/progress"
	payload := map[string]any{"status": status}
	for k, v := range fields {
		payload[k] = v
	}
	_, _, err := a.request(ctx, http.MethodPost, a.cfg.APIServiceURL, path, jsonBytes(payload), "application/json", 5*time.Second)
	return err
}

func (a *app) analytics(_ context.Context, job Job) error {
	data := decodeObject(job.Data)
	student := stringValue(data, "studentId")
	if student == "" {
		return errors.New("missing required analytics studentId")
	}
	attempted := numberValue(data, "practiceQuestionsAttempted", 0)
	correct := numberValue(data, "practiceQuestionsCorrect", 0)
	accuracy := 100.0
	if attempted > 0 {
		accuracy = float64(int(correct/attempted*100 + 0.5))
	}
	date := stringValue(data, "date")
	if date == "" {
		date = time.Now().Format("2006-01-02")
	}
	duration := numberValue(data, "studyDurationMinutes", 15)
	fmt.Printf("analytics aggregated student=%s date=%s duration=%g accuracy=%g\n", student, date, duration, accuracy)
	return nil
}

func first(values ...string) string {
	for _, v := range values {
		if strings.TrimSpace(v) != "" {
			return v
		}
	}
	return ""
}
func defaultInt(v, fallback int) int {
	if v == 0 {
		return fallback
	}
	return v
}
