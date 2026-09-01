import { Job } from 'bullmq';
import { config } from '../config';
import admin from 'firebase-admin';

let firebaseApp: admin.app.App | null = null;

function initFirebase(): admin.app.App {
  if (firebaseApp) return firebaseApp;

  if (config.firebaseServiceAccountPath) {
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(config.firebaseServiceAccountPath),
    });
    return firebaseApp;
  }

  if (config.fcmConfigured) {
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: config.firebaseProjectId,
        clientEmail: config.firebaseClientEmail,
        privateKey: config.firebasePrivateKey,
      }),
    });
    return firebaseApp;
  }

  throw new Error('Firebase credentials not configured');
}

export interface FcmDeliveryResult {
  delivered: string[];
  failed: string[];
  invalid: string[];
  errors: { token: string; error: string }[];
}

export async function deliverPushNotifications(
  tokens: string[],
  title: string,
  body: string,
  payload?: Record<string, any>,
  androidChannelId?: string,
): Promise<FcmDeliveryResult> {
  const app = initFirebase();
  const messaging = admin.messaging(app);

  const result: FcmDeliveryResult = {
    delivered: [],
    failed: [],
    invalid: [],
    errors: [],
  };

  const messages: { token: string; message: admin.messaging.Message }[] = [];

  for (const token of tokens) {
    if (!token || typeof token !== 'string') {
      result.invalid.push(token);
      continue;
    }

    const message: admin.messaging.Message = {
      token,
      notification: {
        title,
        body,
      },
      data: payload ? stripNonStringValues(payload) : undefined,
      android: androidChannelId
        ? {
            notification: {
              channel_id: androidChannelId,
            },
          }
        : undefined,
    };
    messages.push({ token, message });
  }

  const batchSize = 500;
  for (let i = 0; i < messages.length; i += batchSize) {
    const batch = messages.slice(i, i + batchSize);

    const response = await messaging.sendEach(
      batch.map((m) => m.message),
      true,
    );

    response.responses.forEach((resp, idx) => {
      const token = batch[idx].token;
      if (resp.success) {
        result.delivered.push(token);
      } else {
        const error = resp.error;
        if (error) {
          const errorCode = error.code;
          if (
            errorCode === 'messaging/invalid-argument' ||
            errorCode === 'messaging/registration-token-not-registered' ||
            errorCode === 'messaging/invalid-registration-token'
          ) {
            result.invalid.push(token);
          } else if (
            errorCode === 'messaging/server-unavailable' ||
            errorCode === 'messaging/unavailable' ||
            (errorCode === 'messaging/internal-error' && resp.responses[idx]?.error?.message?.includes('retry'))
          ) {
            result.failed.push(token);
          } else {
            result.failed.push(token);
          }
          result.errors.push({ token, error: `${errorCode}: ${error.message}` });
        } else {
          result.failed.push(token);
        }
      }
    });
  }

  return result;
}

function stripNonStringValues(obj: Record<string, any>): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      result[key] = value;
    } else if (value !== null && value !== undefined) {
      result[key] = String(value);
    }
  }
  return result;
}

export type { FcmDeliveryResult };
