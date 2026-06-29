import notifee, {
    AndroidImportance,
    AuthorizationStatus,
    EventType
} from '@notifee/react-native';
import messaging, {
    FirebaseMessagingTypes
} from '@react-native-firebase/messaging';
import { Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import HttpClient from './HttpClient';
import { getEldPermissionStatus, requestEldPermissions } from './EldPermissions';

const DEFAULT_CHANNEL_ID = 'truxy_default';

export type PushNotificationHandlers = {
    onForegroundMessage?: (message: FirebaseMessagingTypes.RemoteMessage) => void;
    onNotificationOpened?: (
        message?: FirebaseMessagingTypes.RemoteMessage
    ) => void;
};

async function createDefaultChannel(): Promise<string> {
    if (Platform.OS !== 'android') {
        return DEFAULT_CHANNEL_ID;
    }

    return notifee.createChannel({
        id: DEFAULT_CHANNEL_ID,
        name: 'Truxy Notifications',
        importance: AndroidImportance.HIGH
    });
}

async function requestPermission(): Promise<boolean> {
    if (Platform.OS === 'ios') {
        const notifeeSettings = await notifee.requestPermission();
        const fcmAuthStatus = await messaging().requestPermission();

        const notifeeGranted =
            notifeeSettings.authorizationStatus === AuthorizationStatus.AUTHORIZED ||
            notifeeSettings.authorizationStatus === AuthorizationStatus.PROVISIONAL;
        const fcmGranted =
            fcmAuthStatus === messaging.AuthorizationStatus.AUTHORIZED ||
            fcmAuthStatus === messaging.AuthorizationStatus.PROVISIONAL;

        return notifeeGranted && fcmGranted;
    }

    const status = await getEldPermissionStatus();
    if (status.notifications) {
        return true;
    }

    const updated = await requestEldPermissions();
    return updated.notifications;
}

async function getFcmToken(): Promise<string | null> {
    try {
        const token = await messaging().getToken();
        return token || null;
    } catch (error) {
        console.warn('Failed to get FCM token:', error);
        return null;
    }
}

async function registerTokenWithBackend(token: string): Promise<void> {
    try {
        await HttpClient.post('user/mobile/fcm-token', {
            fcm_token: token,
            platform: Platform.OS,
            device_id: await DeviceInfo.getUniqueId()
        });
    } catch (error) {
        console.warn('Failed to register FCM token with backend:', error);
    }
}

async function syncFcmToken(): Promise<string | null> {
    await createDefaultChannel();

    const hasPermission = await requestPermission();
    if (!hasPermission) {
        return null;
    }

    const token = await getFcmToken();
    if (token) {
        await registerTokenWithBackend(token);
    }

    return token;
}

async function displayRemoteMessage(
    message: FirebaseMessagingTypes.RemoteMessage
): Promise<void> {
    const channelId = await createDefaultChannel();
    const title =
        message.notification?.title || message.data?.title || 'New notification';
    const body =
        message.notification?.body ||
        message.data?.body ||
        'You have a new message.';

    await notifee.displayNotification({
        id: message.messageId,
        title: String(title),
        body: String(body),
        data: message.data,
        android: {
            channelId,
            pressAction: { id: 'default' },
            smallIcon: 'ic_launcher'
        }
    });
}

function setupPushNotificationListeners(
    handlers: PushNotificationHandlers = {}
): () => void {
    const handleOpened = (
        message?: FirebaseMessagingTypes.RemoteMessage
    ) => {
        if (handlers.onNotificationOpened) {
            handlers.onNotificationOpened(message);
        }
    };

    const unsubscribeForeground = messaging().onMessage(async (remoteMessage) => {
        if (handlers.onForegroundMessage) {
            handlers.onForegroundMessage(remoteMessage);
        } else {
            await displayRemoteMessage(remoteMessage);
        }
    });

    const unsubscribeOpened = messaging().onNotificationOpenedApp((remoteMessage) => {
        if (remoteMessage) {
            handleOpened(remoteMessage);
        }
    });

    messaging()
        .getInitialNotification()
        .then((remoteMessage) => {
            if (remoteMessage) {
                handleOpened(remoteMessage);
            }
        })
        .catch(() => {});

    notifee
        .getInitialNotification()
        .then((initialNotification) => {
            if (initialNotification?.pressAction?.id === 'default') {
                handleOpened();
            }
        })
        .catch(() => {});

    const unsubscribeNotifeeForeground = notifee.onForegroundEvent(
        ({ type, detail }) => {
            if (type === EventType.PRESS) {
                handleOpened();
            }
        }
    );

    const unsubscribeTokenRefresh = messaging().onTokenRefresh(async (token) => {
        await registerTokenWithBackend(token);
    });

    return () => {
        unsubscribeForeground();
        unsubscribeOpened();
        unsubscribeNotifeeForeground();
        unsubscribeTokenRefresh();
    };
}

async function deleteFcmToken(): Promise<void> {
    try {
        await messaging().deleteToken();
    } catch (error) {
        console.warn('Failed to delete FCM token:', error);
    }
}

const PushNotification = {
    requestPermission,
    getFcmToken,
    syncFcmToken,
    displayRemoteMessage,
    setupPushNotificationListeners,
    deleteFcmToken
};

export default PushNotification;
