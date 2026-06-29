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
    deniedPermissions: string[];
    hasNeverAskAgain: boolean;
};

const ANDROID_API_BLUETOOTH_RUNTIME = 31;
const ANDROID_API_NOTIFICATIONS = 33;

function getAndroidApiLevel(): number {
    return Number(Platform.Version);
}

const GRANTED = PermissionsAndroid.RESULTS.GRANTED;
const NEVER_ASK_AGAIN = PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN;

function buildGrantedStatus(
    bluetooth: boolean,
    location: boolean,
    notifications: boolean,
    deniedPermissions: string[] = [],
    hasNeverAskAgain = false
): EldPermissionStatus {
    return {
        bluetooth,
        location,
        notifications,
        allGranted: bluetooth && location && notifications,
        deniedPermissions,
        hasNeverAskAgain
    };
}

function getRequiredPermissions(): Permission[] {
    if (Platform.OS !== 'android') {
        return [];
    }

    const permissions: Permission[] = [
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION
    ];

    if (getAndroidApiLevel() >= ANDROID_API_BLUETOOTH_RUNTIME) {
        permissions.unshift(
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT
        );
    }

    if (getAndroidApiLevel() >= ANDROID_API_NOTIFICATIONS) {
        permissions.push(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
    }

    return permissions;
}

function permissionLabel(permission: Permission): string {
    switch (permission) {
        case PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN:
        case PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT:
            return 'Bluetooth';
        case PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION:
        case PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION:
            return 'Location';
        case PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS:
            return 'Notifications';
        default:
            return 'Required permission';
    }
}

async function checkPermission(permission: Permission): Promise<boolean> {
    if (Platform.OS !== 'android') {
        return true;
    }
    try {
        return await PermissionsAndroid.check(permission);
    } catch {
        return false;
    }
}

async function readPermissionFlags(): Promise<{
    bluetooth: boolean;
    location: boolean;
    notifications: boolean;
}> {
    let bluetooth = true;
    if (getAndroidApiLevel() >= ANDROID_API_BLUETOOTH_RUNTIME) {
        const scan = await checkPermission(
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN
        );
        const connect = await checkPermission(
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT
        );
        bluetooth = scan && connect;
    }

    const fineLocation = await checkPermission(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
    );
    const coarseLocation = await checkPermission(
        PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION
    );
    const location = fineLocation || coarseLocation;

    let notifications = true;
    if (getAndroidApiLevel() >= ANDROID_API_NOTIFICATIONS) {
        notifications = await checkPermission(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        );
    }

    return { bluetooth, location, notifications };
}

function collectDeniedLabels(
    flags: { bluetooth: boolean; location: boolean; notifications: boolean }
): string[] {
    const denied: string[] = [];
    if (!flags.bluetooth) {
        denied.push('Bluetooth');
    }
    if (!flags.location) {
        denied.push('Location');
    }
    if (!flags.notifications) {
        denied.push('Notifications');
    }
    return denied;
}

/** Read current Bluetooth, location, and notification permission state (Android only). */
export async function getEldPermissionStatus(): Promise<EldPermissionStatus> {
    if (Platform.OS !== 'android') {
        return buildGrantedStatus(true, true, true);
    }

    const flags = await readPermissionFlags();
    return buildGrantedStatus(
        flags.bluetooth,
        flags.location,
        flags.notifications,
        collectDeniedLabels(flags)
    );
}

/**
 * Prompt for Bluetooth, location, and notification permissions.
 * Re-checks with PermissionsAndroid.check after the system dialog closes.
 */
export async function requestEldPermissions(): Promise<EldPermissionStatus> {
    if (Platform.OS !== 'android') {
        return buildGrantedStatus(true, true, true);
    }

    const permissions = getRequiredPermissions();
    const deniedPermissions: string[] = [];
    let hasNeverAskAgain = false;

    if (permissions.length > 0) {
        const results = await PermissionsAndroid.requestMultiple(permissions);

        Object.entries(results).forEach(([permission, result]) => {
            if (result !== GRANTED) {
                deniedPermissions.push(permissionLabel(permission as Permission));
            }
            if (result === NEVER_ASK_AGAIN) {
                hasNeverAskAgain = true;
            }
        });
    }

    const flags = await readPermissionFlags();
    const uniqueDenied = [
        ...new Set([...collectDeniedLabels(flags), ...deniedPermissions])
    ];

    return buildGrantedStatus(
        flags.bluetooth,
        flags.location,
        flags.notifications,
        uniqueDenied,
        hasNeverAskAgain
    );
}

/**
 * Check permissions, request any that are missing, then re-check.
 * Use this before ELD scan/connect flows.
 */
export async function ensureEldPermissions(): Promise<EldPermissionStatus> {
    const current = await getEldPermissionStatus();
    if (current.allGranted) {
        return current;
    }
    return requestEldPermissions();
}

export function formatDeniedPermissionsMessage(
    status: EldPermissionStatus
): string {
    if (status.deniedPermissions.length === 0) {
        return 'Enable location, nearby devices, and notifications in Settings.';
    }
    return `Still missing: ${status.deniedPermissions.join(', ')}. Enable them in Settings.`;
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
        if (state !== 'active') {
            return;
        }

        const status = await ensureEldPermissions();
        if (status.allGranted) {
            onGranted();
        }
    });

    return () => subscription.remove();
}