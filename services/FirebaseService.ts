import { Platform, DeviceEventEmitter } from 'react-native';
import { router } from 'expo-router';
import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance, AndroidVisibility, AndroidCategory, EventType } from '@notifee/react-native';

const CHANNEL_ID = 'urgent-orders-live-v1';

export const FirebaseService = {
  async init() {
    if (Platform.OS !== 'android') return;

    try {
      await this.createChannel();
      await messaging().requestPermission();

      const token = await messaging().getToken();
      console.log('⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐');
      console.log('FCM TOKEN IS:', token);
      console.log('⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐');

      messaging().onMessage(async (remoteMessage) => {
        console.log('A new FCM message arrived in foreground!', remoteMessage);
        await this.displayNotification(remoteMessage);
      });

      this.setupInteractions();
    } catch (error) {
      console.log('Firebase Init Error:', error);
    }
  },

  async createChannel() {
    await notifee.createChannel({
      id: CHANNEL_ID,
      name: 'New Orders Alarm',
      importance: AndroidImportance.HIGH,
      visibility: AndroidVisibility.PUBLIC,
      sound: 'default',
      vibration: true,
    });
  },

  async displayNotification(message: any) {
    try {
      await this.createChannel(); // Ensure channel exists even in headless JS

      const title = message.notification?.title || message.data?.title || '🚨 NEW URGENT ORDER!';
      const body = message.notification?.body || message.data?.body || 'Tap to view the order immediately.';
      await notifee.displayNotification({
        title,
        body,
        data: message.data,
        android: {
          channelId: CHANNEL_ID,
          importance: AndroidImportance.HIGH,
          category: AndroidCategory.MESSAGE,
          pressAction: {
            id: 'default',
            launchActivity: 'default',
          },
        },
      });
      console.log('Notifee displayed successfully!');

      // 🔥 WAKE UP THE APP AND PLAY RINGTONE
      DeviceEventEmitter.emit('REFRESH_ORDERS');
      DeviceEventEmitter.emit('FORCE_PLAY_ALARM');
    } catch (err) {
      console.log('Notifee Display Error:', err);
    }
  },

  setupInteractions() {
    notifee.onForegroundEvent(({ type, detail }) => {
      if (type === EventType.PRESS) {
        this.handleNotificationClick(detail.notification);
      }
    });

    messaging().onNotificationOpenedApp((remoteMessage) => {
      this.handleNotificationClick(remoteMessage);
    });

    messaging().getInitialNotification().then((remoteMessage) => {
      if (remoteMessage) {
        this.handleNotificationClick(remoteMessage);
      }
    });
  },

  handleNotificationClick(notification: any) {
    if (!notification) return;
    console.log('Notification clicked', notification);
    router.push('/(tabs)/orders');
  }
};

try {
  messaging().setBackgroundMessageHandler(async (remoteMessage) => {
    console.log('Message handled in the background!', remoteMessage);
    await FirebaseService.displayNotification(remoteMessage);
  });

  notifee.onBackgroundEvent(async ({ type, detail }) => {
    if (type === EventType.PRESS) {
      FirebaseService.handleNotificationClick(detail.notification);
    }
  });
} catch (e) {
  console.log('Error setting background message handler', e);
}
