import {
    AppState,
    Linking,
    Permission,
    PermissionsAndroid,
    Platform
} from 'react-native';

export type EldPermissionStatus = {
    bluetooth: boolean;
    location: boolean;
    notifications: boolean;
    allGranted: boolean;
};

const ANDROID_API_BLUETOOTH_RUNTIME = 31;
const ANDROID_API_NOTIFICATIONS = 33;

async function checkPermission(permission: Permission): Promise<boolean> {
    if (Platform.OS !== 'android') return true;
    try {
        return await PermissionsAndroid.check(permission);
    } catch {
        return false;
    }
}

async function requestPermission(permission: Permission): Promise<boolean> {
    try {
        const result = await PermissionsAndroid.request(permission);
        return result === PermissionsAndroid.RESULTS.GRANTED;
    } catch {
        return false;
    }
}

/** Read current Bluetooth, location, and notification permission state (Android only). */
export async function getEldPermissionStatus(): Promise<EldPermissionStatus> {
    if (Platform.OS !== 'android') {
        return {
            bluetooth: true,
            location: true,
            notifications: true,
            allGranted: true
        };
    }

    let bluetooth = true;
    if (Platform.Version >= ANDROID_API_BLUETOOTH_RUNTIME) {
        const scan = await checkPermission(PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN);
        const connect = await checkPermission(
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT
        );
        bluetooth = scan && connect;
    }

    const location = await checkPermission(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
    );

    let notifications = true;
    if (Platform.Version >= ANDROID_API_NOTIFICATIONS) {
        notifications = await checkPermission(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        );
    }

    return {
        bluetooth,
        location,
        notifications,
        allGranted: bluetooth && location && notifications
    };
}

/**
 * Prompt for Bluetooth, location, and notification permissions.
 * Called once from App.js on startup (and again when the app returns active
 * if the user may have changed grants in Settings).
 */
export async function requestEldPermissions(): Promise<EldPermissionStatus> {
    if (Platform.OS !== 'android') {
        return {
            bluetooth: true,
            location: true,
            notifications: true,
            allGranted: true
        };
    }

    let bluetooth = true;
    if (Platform.Version >= ANDROID_API_BLUETOOTH_RUNTIME) {
        const scan = await requestPermission(PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN);
        const connect = await requestPermission(
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT
        );
        bluetooth = scan && connect;
    }

    const location = await requestPermission(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
    );

    let notifications = true;
    if (Platform.Version >= ANDROID_API_NOTIFICATIONS) {
        notifications = await requestPermission(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        );
    }

    return {
        bluetooth,
        location,
        notifications,
        allGranted: bluetooth && location && notifications
    };
}

export function openAppSettings(): void {
    Linking.openSettings().catch(() => {});
}

/**
 * When the user grants permissions in system Settings and returns to the app,
 * run `onGranted` once all required permissions are present.
 */
export function watchEldPermissionsOnResume(onGranted: () => void): () => void {
    if (Platform.OS !== 'android') {
        return () => {};
    }

    const subscription = AppState.addEventListener('change', async (state) => {
        if (state !== 'active') return;

        let status = await getEldPermissionStatus();
        if (!status.allGranted) {
            status = await requestEldPermissions();
        }
        if (status.allGranted) {
            onGranted();
        }
    });

    return () => subscription.remove();
}
