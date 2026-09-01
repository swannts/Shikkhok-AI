import { Job } from 'bullmq';
import axios from 'axios';
import { config } from '../config';
import { deliverPushNotifications } from './fcm-delivery';
import { generateSignedHeaders } from '../utils/hmac';

export interface PushNotificationJobData {
  notificationId?: string;
  userId?: string;
  tokens?: string[];
  title: string;
  body: string;
  payload?: Record<string, any>;
  type?: string;
  requestId?: string;
}

export interface EmailJobData {
  recipient: string;
  subject: string;
  htmlContent: string;
  templateId?: string;
}

export interface SmsJobData {
  recipient: string;
  message: string;
  isOtp?: boolean;
}

function buildHmacSignature(payload: string, secret: string): { signature: string; timestamp: string } {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = require('crypto')
    .createHmac('sha256', secret)
    .update(`${timestamp}.${payload}`)
    .digest('hex');
  return { signature, timestamp };
}

async function dispatchEmail(emailData: EmailJobData): Promise<Record<string, any>> {
  if (config.resendApiKey) {
    try {
      const res = await axios.post(
        'https://api.resend.com/emails',
        {
          from: config.defaultFromEmail,
          to: [emailData.recipient],
          subject: emailData.subject,
          html: emailData.htmlContent,
        },
        {
          headers: {
            Authorization: `Bearer ${config.resendApiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        },
      );
      return {
        status: 'SENT',
        provider: 'Resend',
        id: res.data?.id,
        recipient: emailData.recipient,
        sentAt: new Date().toISOString(),
      };
    } catch (err: any) {
      console.warn(`[NotificationProcessor] Resend failed: ${err.message}. Trying SendGrid or fallback.`);
    }
  }

  if (config.sendgridApiKey) {
    try {
      await axios.post(
        'https://api.sendgrid.com/v3/mail/send',
        {
          personalizations: [{ to: [{ email: emailData.recipient }] }],
          from: { email: config.defaultFromEmail, name: 'Shikkhok AI' },
          subject: emailData.subject,
          content: [{ type: 'text/html', value: emailData.htmlContent }],
        },
        {
          headers: {
            Authorization: `Bearer ${config.sendgridApiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        },
      );
      return {
        status: 'SENT',
        provider: 'SendGrid',
        recipient: emailData.recipient,
        sentAt: new Date().toISOString(),
      };
    } catch (err: any) {
      console.warn(`[NotificationProcessor] SendGrid failed: ${err.message}.`);
    }
  }

  console.log(`[NotificationProcessor] [SANDBOX EMAIL] To: <${emailData.recipient}> Subject: "${emailData.subject}"`);
  return {
    status: 'SENT',
    provider: 'Sandbox-Email',
    recipient: emailData.recipient,
    sentAt: new Date().toISOString(),
  };
}

async function dispatchSms(smsData: SmsJobData): Promise<Record<string, any>> {
  const sanitizedRecipient = smsData.recipient.replace(/[^\d+]/g, '');

  if (config.sslWirelessApiToken && config.sslWirelessSid) {
    try {
      const res = await axios.post(
        `${config.sslWirelessDomain}/api/v3/send-sms`,
        {
          api_token: config.sslWirelessApiToken,
          sid: config.sslWirelessSid,
          msisdn: sanitizedRecipient.startsWith('+88') ? sanitizedRecipient.slice(3) : sanitizedRecipient,
          sms: smsData.message,
          csms_id: `shikkhok_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
        },
        { timeout: 10000 },
      );
      return {
        status: 'SENT',
        provider: 'SSL-Wireless-BD',
        recipient: sanitizedRecipient,
        csmsId: res.data?.csms_id,
        sentAt: new Date().toISOString(),
      };
    } catch (err: any) {
      console.warn(`[NotificationProcessor] SSL Wireless BD failed: ${err.message}. Trying Twilio or fallback.`);
    }
  }

  if (config.twilioAccountSid && config.twilioAuthToken && config.twilioFromNumber) {
    try {
      const authHeader = Buffer.from(`${config.twilioAccountSid}:${config.twilioAuthToken}`).toString('base64');
      const params = new URLSearchParams();
      params.append('To', sanitizedRecipient);
      params.append('From', config.twilioFromNumber);
      params.append('Body', smsData.message);

      const res = await axios.post(
        `https://api.twilio.com/2010-04-01/Accounts/${config.twilioAccountSid}/Messages.json`,
        params.toString(),
        {
          headers: {
            Authorization: `Basic ${authHeader}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          timeout: 10000,
        },
      );
      return {
        status: 'SENT',
        provider: 'Twilio',
        sid: res.data?.sid,
        recipient: sanitizedRecipient,
        sentAt: new Date().toISOString(),
      };
    } catch (err: any) {
      console.warn(`[NotificationProcessor] Twilio SMS failed: ${err.message}.`);
    }
  }

  console.log(`[NotificationProcessor] [SANDBOX SMS] To: ${sanitizedRecipient} Text: "${smsData.message}"`);
  return {
    status: 'SENT',
    provider: 'Sandbox-SMS',
    recipient: sanitizedRecipient,
    sentAt: new Date().toISOString(),
  };
}

async function deactivateInvalidTokens(tokens: string[]): Promise<void> {
  if (!tokens.length) return;
  try {
    const payload = JSON.stringify({ tokens });
    const bodyHash = require('crypto').createHash('sha256').update(payload).digest('hex');
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const canonical = `${timestamp}\nPOST\n/api/v1/notifications/device-tokens/deactivate\n${bodyHash}`;
    const signature = require('crypto')
      .createHmac('sha256', config.aiHmacSecret)
      .update(canonical)
      .digest('hex');
    await axios.post(
      `${config.aiServiceUrl.replace('/api/v1', '')}/api/v1/notifications/device-tokens/deactivate`,
      { tokens },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Service-Name': 'shikkhok-worker',
          'X-Service-Timestamp': timestamp,
          'X-Service-Signature': signature,
          'X-Request-Id': `worker_deactivate_${Date.now()}`,
        },
        timeout: 10000,
      },
    );
  } catch (err: any) {
    console.warn(`[NotificationProcessor] Failed to deactivate invalid tokens: ${err.message}`);
  }
}

export async function processNotificationJob(job: Job): Promise<Record<string, any>> {
  const jobName = job.name || job.data?.jobType || 'PUSH_NOTIFICATION';
  const data = job.data?.data || job.data;

  console.log(`[NotificationProcessor] Executing job #${job.id} (${jobName})`);

  switch (jobName) {
    case 'PUSH_NOTIFICATION':
    case 'NOTIFICATIONS': {
      const pushData = data as PushNotificationJobData;

      if (pushData.tokens && pushData.tokens.length === 0) {
        pushData.tokens = undefined;
      }

      if (!pushData.tokens && pushData.userId) {
        console.warn(
          `[NotificationProcessor] No device tokens for user ${pushData.userId}. Skipping push delivery.`,
        );
        return {
          status: 'SKIPPED',
          provider: 'NoTokens',
          deliveredCount: 0,
          failedCount: 0,
          invalidCount: 0,
          reason: `No active device tokens for user ${pushData.userId}`,
        };
      }

      const tokens: string[] = pushData.tokens || [];

      if (
        !config.fcmConfigured &&
        (config.nodeEnv === 'development' || config.nodeEnv === 'test' || !tokens.length)
      ) {
        console.log(
          `[NotificationProcessor] [SANDBOX PUSH] Sent "${pushData.title}" to ${tokens.length} token(s) (User: ${pushData.userId || 'N/A'})`,
        );
        return {
          status: 'DELIVERED',
          provider: 'FCM-Sandbox',
          deliveredAt: new Date().toISOString(),
          recipientCount: tokens.length,
          tokens,
        };
      }

      if (!config.fcmConfigured && config.isProduction) {
        return {
          status: 'FAILED',
          provider: 'FCM-NotConfigured',
          error: 'Firebase credentials not configured in production',
          deliveredCount: 0,
          failedCount: tokens.length,
          invalidCount: 0,
        };
      }

      const result = await deliverPushNotifications(
        tokens,
        pushData.title,
        pushData.body,
        pushData.payload,
        pushData.type === 'PRACTICE' ? 'practice_results' : undefined,
      );

      if (result.invalid.length > 0) {
        await deactivateInvalidTokens(result.invalid);
      }

      return {
        status: result.failed.length === 0 ? 'DELIVERED' : 'PARTIAL',
        provider: 'FCM-HTTP-v1',
        deliveredAt: new Date().toISOString(),
        deliveredCount: result.delivered.length,
        failedCount: result.failed.length,
        invalidCount: result.invalid.length,
        invalidTokens: result.invalid,
        requestId: pushData.requestId,
      };
    }

    case 'EMAIL':
      return dispatchEmail(data as EmailJobData);

    case 'SMS':
      return dispatchSms(data as SmsJobData);

    default:
      console.warn(`[NotificationProcessor] Unhandled notification job type: ${jobName}`);
      return { status: 'IGNORED', jobName };
  }
}
