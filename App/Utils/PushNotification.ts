import AsyncStorage from '@react-native-async-storage/async-storage';
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
import { authApi } from '../core/api/services/authApi';
import { isSuccess } from '../core/api/types/common';
import {
    getEldPermissionStatus,
    requestNotificationPermission
} from './EldPermissions';

const DEFAULT_CHANNEL_ID = 'truxy_default';
const FCM_REGISTERED_KEY = '@truxy/fcm_registered';

type FcmRegisteredRecord = {
    token: string;
    userId: string | number | null;
    platform: string;
};

type AuthState = {
    isLoggedIn: boolean;
    userId: string | number | null;
};

export type PushNotificationHandlers = {
    onForegroundMessage?: (message: FirebaseMessagingTypes.RemoteMessage) => void;
    onNotificationOpened?: (
        message?: FirebaseMessagingTypes.RemoteMessage
    ) => void;
};

const authRef: AuthState = {
    isLoggedIn: false,
    userId: null
};

let handlersRef: PushNotificationHandlers = {};
let cleanupListeners: (() => void) | null = null;

async function getRegisteredRecord(): Promise<FcmRegisteredRecord | null> {
    try {
        const raw = await AsyncStorage.getItem(FCM_REGISTERED_KEY);
        if (!raw) {
            return null;
        }
        return JSON.parse(raw) as FcmRegisteredRecord;
    } catch {
        return null;
    }
}

async function saveRegisteredRecord(record: FcmRegisteredRecord): Promise<void> {
    await AsyncStorage.setItem(FCM_REGISTERED_KEY, JSON.stringify(record));
}

async function clearRegisteredRecord(): Promise<void> {
    await AsyncStorage.removeItem(FCM_REGISTERED_KEY);
}

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

async function ensureNotificationPermission(): Promise<boolean> {
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

    return requestNotificationPermission();
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

async function registerTokenWithBackend(token: string): Promise<boolean> {
    try {
        const result = await authApi.registerFcmToken({
            fcm_token: token,
            platform: Platform.OS,
            device_id: await DeviceInfo.getUniqueId()
        });
        return isSuccess(result);
    } catch (error) {
        console.warn('Failed to register FCM token with backend:', error);
        return false;
    }
}

async function registerIfNeeded(forcedToken?: string): Promise<string | null> {
    if (!authRef.isLoggedIn) {
        return null;
    }

    await createDefaultChannel();

    const hasPermission = await ensureNotificationPermission();
    if (!hasPermission) {
        if (__DEV__) {
            console.warn('FCM registration skipped: notification permission not granted');
        }
        return null;
    }

    const token = forcedToken ?? (await getFcmToken());
    if (!token) {
        return null;
    }

    const userId = authRef.userId;
    const record = await getRegisteredRecord();
    if (
        record &&
        record.token === token &&
        record.userId === userId &&
        record.platform === Platform.OS
    ) {
        return token;
    }

    const success = await registerTokenWithBackend(token);
    if (success) {
        await saveRegisteredRecord({
            token,
            userId,
            platform: Platform.OS
        });
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

function attachListeners(): () => void {
    const handleOpened = (
        message?: FirebaseMessagingTypes.RemoteMessage
    ) => {
        if (!authRef.isLoggedIn) {
            return;
        }

        if (handlersRef.onNotificationOpened) {
            handlersRef.onNotificationOpened(message);
        }
    };

    const unsubscribeForeground = messaging().onMessage(async (remoteMessage) => {
        if (handlersRef.onForegroundMessage) {
            handlersRef.onForegroundMessage(remoteMessage);
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
        ({ type }) => {
            if (type === EventType.PRESS) {
                handleOpened();
            }
        }
    );

    const unsubscribeTokenRefresh = messaging().onTokenRefresh(async (token) => {
        if (!authRef.isLoggedIn) {
            return;
        }
        await registerIfNeeded(token);
    });

    return () => {
        unsubscribeForeground();
        unsubscribeOpened();
        unsubscribeNotifeeForeground();
        unsubscribeTokenRefresh();
    };
}

function initialize(handlers: PushNotificationHandlers = {}): () => void {
    handlersRef = handlers;

    if (!cleanupListeners) {
        cleanupListeners = attachListeners();
    }

    return () => {
        cleanupListeners?.();
        cleanupListeners = null;
        handlersRef = {};
    };
}

function setAuthState({
    isLoggedIn,
    userId
}: {
    isLoggedIn: boolean;
    userId?: string | number | null;
}): void {
    const wasLoggedIn = authRef.isLoggedIn;
    authRef.isLoggedIn = isLoggedIn;
    authRef.userId = userId ?? null;

    if (wasLoggedIn && !isLoggedIn) {
        clearLocalToken().catch(() => {});
    }
}

async function clearLocalToken(): Promise<void> {
    await clearRegisteredRecord();
    try {
        await messaging().deleteToken();
    } catch (error) {
        console.warn('Failed to delete FCM token:', error);
    }
}

/** @deprecated Use initialize() once at app mount */
function setupPushNotificationListeners(
    handlers: PushNotificationHandlers = {}
): () => void {
    return initialize(handlers);
}

/** @deprecated Use registerIfNeeded() */
async function syncFcmToken(): Promise<string | null> {
    return registerIfNeeded();
}

/** @deprecated Use clearLocalToken() */
async function deleteFcmToken(): Promise<void> {
    await clearLocalToken();
}

const PushNotification = {
    initialize,
    setAuthState,
    registerIfNeeded,
    ensureNotificationPermission,
    getFcmToken,
    displayRemoteMessage,
    clearLocalToken,
    setupPushNotificationListeners,
    syncFcmToken,
    deleteFcmToken
};

export default PushNotification;