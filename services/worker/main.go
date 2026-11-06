package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strconv"
	"strings"
	"syscall"
	"time"

	amqp "github.com/rabbitmq/amqp091-go"
	"github.com/redis/go-redis/v9"
)

const maxAttempts = 3

type Config struct {
	RabbitURL, RedisURL, AIServiceURL, APIServiceURL, HMACSecret                           string
	HealthPort, Concurrency                                                                int
	FirebaseProjectID, FirebaseClientEmail, FirebasePrivateKey, FirebaseServiceAccountPath string
	ResendAPIKey, SendGridAPIKey, DefaultFromEmail                                         string
	SSLWirelessToken, SSLWirelessSID, SSLWirelessDomain                                    string
	TwilioAccountSID, TwilioAuthToken, TwilioFromNumber                                    string
	Environment                                                                            string
}

type Job struct {
	ID           string          `json:"id"`
	Name         string          `json:"name"`
	Data         json.RawMessage `json:"data"`
	AttemptsMade int             `json:"attemptsMade,omitempty"`
}

func env(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
func loadConfig() Config {
	port, _ := strconv.Atoi(env("WORKER_HEALTH_PORT", "3100"))
	concurrency, _ := strconv.Atoi(env("WORKER_CONCURRENCY", "5"))
	return Config{
		RabbitURL: env("RABBITMQ_URL", "amqp://guest:guest@localhost:5672/"), RedisURL: env("REDIS_URL", "redis://localhost:6379"),
		AIServiceURL: strings.TrimRight(env("AI_SERVICE_URL", "http://localhost:8000"), "/"), APIServiceURL: strings.TrimRight(env("API_SERVICE_URL", "http://localhost:4000"), "/"),
		HMACSecret: env("AI_SERVICE_SECRET", env("AI_HMAC_SECRET", env("AI_GATEWAY_HMAC_SECRET", ""))), HealthPort: port, Concurrency: concurrency,
		FirebaseProjectID: os.Getenv("FIREBASE_PROJECT_ID"), FirebaseClientEmail: os.Getenv("FIREBASE_CLIENT_EMAIL"), FirebasePrivateKey: strings.ReplaceAll(os.Getenv("FIREBASE_PRIVATE_KEY"), `\n`, "\n"), FirebaseServiceAccountPath: os.Getenv("FIREBASE_SERVICE_ACCOUNT_PATH"),
		ResendAPIKey: os.Getenv("RESEND_API_KEY"), SendGridAPIKey: os.Getenv("SENDGRID_API_KEY"), DefaultFromEmail: env("DEFAULT_FROM_EMAIL", "support@shikkhok.ai"),
		SSLWirelessToken: os.Getenv("SSL_WIRELESS_API_TOKEN"), SSLWirelessSID: os.Getenv("SSL_WIRELESS_SID"), SSLWirelessDomain: env("SSL_WIRELESS_DOMAIN", "https://smsplus.sslwireless.com"),
		TwilioAccountSID: os.Getenv("TWILIO_ACCOUNT_SID"), TwilioAuthToken: os.Getenv("TWILIO_AUTH_TOKEN"), TwilioFromNumber: os.Getenv("TWILIO_FROM_NUMBER"), Environment: env("NODE_ENV", "development"),
	}
}

func ensureQueue(ch *amqp.Channel, name string) error {
	if _, err := ch.QueueDeclare(name, true, false, false, false, nil); err != nil {
		return err
	}
	if _, err := ch.QueueDeclare(name+"-dlq", true, false, false, false, nil); err != nil {
		return err
	}
	delays := []int32{2000, 4000}
	if name == "curriculum" {
		delays = []int32{5000, 10000}
	}
	for i, ttl := range delays {
		args := amqp.Table{"x-message-ttl": ttl, "x-dead-letter-exchange": "", "x-dead-letter-routing-key": name}
		if _, err := ch.QueueDeclare(fmt.Sprintf("%s.retry.%d", name, i+1), true, false, false, false, args); err != nil {
			return err
		}
	}
	return nil
}

func attempts(header amqp.Table) int {
	switch n := header["x-attempts"].(type) {
	case int32:
		return int(n)
	case int64:
		return int(n)
	case int:
		return n
	case float64:
		return int(n)
	}
	return 0
}

func consumeQueue(ctx context.Context, conn *amqp.Connection, queue string, concurrency int, process func(context.Context, Job) error, cache *redis.Client) error {
	ch, err := conn.Channel()
	if err != nil {
		return err
	}
	defer ch.Close()
	if err = ensureQueue(ch, queue); err != nil {
		return err
	}
	if err = ch.Qos(concurrency, 0, false); err != nil {
		return err
	}
	deliveries, err := ch.Consume(queue, "", false, false, false, false, nil)
	if err != nil {
		return err
	}
	log.Printf("consumer online queue=%s concurrency=%d", queue, concurrency)
	for {
		select {
		case <-ctx.Done():
			return nil
		case delivery, ok := <-deliveries:
			if !ok {
				return errors.New("rabbitmq consumer channel closed")
			}
			go handleDelivery(ctx, ch, queue, delivery, process, cache)
		}
	}
}

func handleDelivery(ctx context.Context, ch *amqp.Channel, queue string, d amqp.Delivery, process func(context.Context, Job) error, cache *redis.Client) {
	var job Job
	err := json.Unmarshal(d.Body, &job)
	if err == nil && (job.ID == "" || job.Name == "") {
		err = errors.New("malformed job: id and name are required")
	}
	if err == nil {
		err = process(ctx, job)
	}
	if err == nil {
		_ = d.Ack(false)
		if job.ID != "" && cache != nil {
			_ = cache.Del(ctx, fmt.Sprintf("idemp:rabbitmq:%s:%s", queue, job.ID)).Err()
		}
		log.Printf("job completed queue=%s id=%s", queue, job.ID)
		return
	}

	n := attempts(d.Headers) + 1
	target := queue + "-dlq"
	body := d.Body
	if n < maxAttempts {
		target = fmt.Sprintf("%s.retry.%d", queue, n)
	} else {
		var original Job
		if json.Unmarshal(d.Body, &original) != nil {
			original = Job{ID: d.MessageId, Name: "INVALID", Data: json.RawMessage(d.Body)}
		}
		original.AttemptsMade = n
		failed := map[string]any{"id": original.ID, "name": original.Name, "data": original.Data, "attemptsMade": n, "error": err.Error(), "failedAt": time.Now().UTC().Format(time.RFC3339Nano)}
		body, _ = json.Marshal(failed)
	}
	if qErr := ch.PublishWithContext(ctx, "", target, false, false, amqp.Publishing{ContentType: "application/json", DeliveryMode: amqp.Persistent, MessageId: d.MessageId, Headers: amqp.Table{"x-attempts": int32(n)}, Body: body}); qErr != nil {
		log.Printf("failed to route queue=%s id=%s: %v; requeueing", queue, d.MessageId, qErr)
		_ = d.Nack(false, true)
		return
	}
	_ = d.Ack(false)
	log.Printf("job failed queue=%s id=%s attempts=%d/%d err=%v", queue, d.MessageId, n, maxAttempts, err)
}

func main() {
	cfg := loadConfig()
	if cfg.Environment == "production" && len(cfg.HMACSecret) < 32 {
		log.Fatal("AI_SERVICE_SECRET must be at least 32 characters in production")
	}
	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()
	conn, err := amqp.Dial(cfg.RabbitURL)
	if err != nil {
		log.Fatalf("connect RabbitMQ: %v", err)
	}
	defer conn.Close()
	redisOpts, err := redis.ParseURL(cfg.RedisURL)
	if err != nil {
		log.Fatalf("parse REDIS_URL: %v", err)
	}
	rdb := redis.NewClient(redisOpts)
	defer rdb.Close()
	app := newApp(cfg, rdb)
	ready := false
	httpSrv := &http.Server{Addr: fmt.Sprintf(":%d", cfg.HealthPort), Handler: healthHandler(func() bool { return ready && conn.IsClosed() == false && rdb.Ping(context.Background()).Err() == nil })}
	go func() {
		if e := httpSrv.ListenAndServe(); e != nil && e != http.ErrServerClosed {
			log.Printf("health server: %v", e)
		}
	}()

	queues := []struct {
		name        string
		concurrency int
		fn          func(context.Context, Job) error
	}{
		{"notifications", max(1, cfg.Concurrency), app.notification}, {"curriculum", 1, app.curriculum}, {"analytics", max(1, cfg.Concurrency), app.analytics},
	}
	errs := make(chan error, len(queues))
	for _, q := range queues {
		q := q
		go func() {
			if e := consumeQueue(ctx, conn, q.name, q.concurrency, q.fn, rdb); e != nil {
				errs <- fmt.Errorf("%s consumer: %w", q.name, e)
			}
		}()
	}
	// Wait until queue declarations and consumers are established before reporting readiness.
	time.Sleep(500 * time.Millisecond)
	ready = true
	select {
	case <-ctx.Done():
	case e := <-errs:
		log.Printf("worker consumer exited: %v", e)
		stop()
	}
	ready = false
	shutdown, cancel := context.WithTimeout(context.Background(), 20*time.Second)
	defer cancel()
	_ = httpSrv.Shutdown(shutdown)
}

func healthHandler(ready func() bool) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch r.URL.Path {
		case "/health":
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write([]byte(`{"status":"ok","service":"shikkhok-worker"}`))
		case "/ready":
			if ready() {
				w.WriteHeader(http.StatusOK)
				_, _ = w.Write([]byte(`{"status":"ready","service":"shikkhok-worker","checks":{"rabbitmq":"up","redis":"up"}}`))
			} else {
				w.WriteHeader(http.StatusServiceUnavailable)
				_, _ = w.Write([]byte(`{"status":"not_ready","service":"shikkhok-worker"}`))
			}
		default:
			http.NotFound(w, r)
		}
	})
}

func max(a, b int) int {
	if a > b {
		return a
	}
	return b
}
