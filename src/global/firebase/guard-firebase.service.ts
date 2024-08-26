import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { NotificationPayload } from './firebase.types';

@Injectable()
export class GuardFirebaseService {
  private readonly fcm: admin.messaging.Messaging;

  constructor() {
    const firebaseConfigGuard = {
      credential: admin.credential.cert({
        projectId: process.env.GUARD_FIREBASE_PROJECT_ID,
        clientEmail: process.env.GUARD_FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.GUARD_FIREBASE_PRIVATE_KEY.replace(
          /\\n/g,
          '\n',
        ),
      }),
    };

    const app = admin.initializeApp(firebaseConfigGuard, 'guard-firebase-app');
    this.fcm = app.messaging();
  }

  async sendMultiplePushNotificationGuard(
    tokens: string[],
    payload: NotificationPayload,
  ) {
    try {
      const response = await this.fcm.sendToDevice(tokens, payload);
      console.log('Notifications sent successfully:', response.successCount);
      if (response.failureCount > 0) {
        console.warn('Some notifications failed to send:', response.results);
      }
    } catch (error) {
      console.error('Error sending notifications:', error);
    }
  }
}
