import {
    AppState,
    Linking,
    Permission,
    PermissionsAndroid,
    Platform
} from 'react-native';
import DeviceInfo from 'react-native-device-info';

export type EldPermissionStatus = {
    bluetooth: boolean;
    location: boolean;
    notifications: boolean;
    deviceLocationEnabled: boolean;
    allGranted: boolean;
    deniedPermissions: string[];
    hasNeverAskAgain: boolean;
};

const ANDROID_API_BLUETOOTH_RUNTIME = 31;
const ANDROID_API_NOTIFICATIONS = 33;
const REQUEST_STAGE_DELAY_MS = 300;

const GRANTED = PermissionsAndroid.RESULTS.GRANTED;
const NEVER_ASK_AGAIN = PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN;

let isRequestingPermissions = false;

function getAndroidApiLevel(): number {
    return Number(Platform.Version);
}

function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildGrantedStatus(
    bluetooth: boolean,
    location: boolean,
    notifications: boolean,
    deviceLocationEnabled: boolean,
    deniedPermissions: string[] = [],
    hasNeverAskAgain = false
): EldPermissionStatus {
    const appPermissionsGranted = bluetooth && location && notifications;
    return {
        bluetooth,
        location,
        notifications,
        deviceLocationEnabled,
        allGranted: appPermissionsGranted && deviceLocationEnabled,
        deniedPermissions,
        hasNeverAskAgain
    };
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

export async function isDeviceLocationEnabled(): Promise<boolean> {
    if (Platform.OS !== 'android') {
        return true;
    }
    try {
        return await DeviceInfo.isLocationEnabled();
    } catch {
        return false;
    }
}

async function readPermissionFlags(): Promise<{
    bluetooth: boolean;
    location: boolean;
    notifications: boolean;
    deviceLocationEnabled: boolean;
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

    const deviceLocationEnabled = await isDeviceLocationEnabled();

    return { bluetooth, location, notifications, deviceLocationEnabled };
}

function collectDeniedLabels(
    flags: {
        bluetooth: boolean;
        location: boolean;
        notifications: boolean;
        deviceLocationEnabled: boolean;
    }
): string[] {
    const denied: string[] = [];
    if (!flags.bluetooth) {
        denied.push('Bluetooth');
    }
    if (!flags.location) {
        denied.push('Location permission');
    }
    if (!flags.notifications) {
        denied.push('Notifications');
    }
    if (!flags.deviceLocationEnabled) {
        denied.push('Phone GPS');
    }
    return denied;
}

async function requestPermissionGroup(
    permissions: Permission[]
): Promise<{ denied: string[]; hasNeverAskAgain: boolean }> {
    const denied: string[] = [];
    let hasNeverAskAgain = false;

    if (permissions.length === 0) {
        return { denied, hasNeverAskAgain };
    }

    const results = await PermissionsAndroid.requestMultiple(permissions);

    Object.entries(results).forEach(([permission, result]) => {
        if (result !== GRANTED) {
            denied.push(permissionLabel(permission as Permission));
        }
        if (result === NEVER_ASK_AGAIN) {
            hasNeverAskAgain = true;
        }
    });

    return { denied, hasNeverAskAgain };
}

/** Read current Bluetooth, location, and notification permission state (Android only). */
export async function getEldPermissionStatus(): Promise<EldPermissionStatus> {
    if (Platform.OS !== 'android') {
        return buildGrantedStatus(true, true, true, true);
    }

    const flags = await readPermissionFlags();
    return buildGrantedStatus(
        flags.bluetooth,
        flags.location,
        flags.notifications,
        flags.deviceLocationEnabled,
        collectDeniedLabels(flags)
    );
}

/**
 * Prompt for Bluetooth, location, and notification permissions in stages.
 * Re-checks with PermissionsAndroid.check after the system dialogs close.
 */
export async function requestEldPermissions(): Promise<EldPermissionStatus> {
    if (Platform.OS !== 'android') {
        return buildGrantedStatus(true, true, true, true);
    }

    if (isRequestingPermissions) {
        return getEldPermissionStatus();
    }

    isRequestingPermissions = true;

    try {
        const deniedPermissions: string[] = [];
        let hasNeverAskAgain = false;

        if (getAndroidApiLevel() >= ANDROID_API_BLUETOOTH_RUNTIME) {
            const bluetoothNeedsRequest =
                !(await checkPermission(
                    PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN
                )) ||
                !(await checkPermission(
                    PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT
                ));

            if (bluetoothNeedsRequest) {
                const bluetoothResult = await requestPermissionGroup([
                    PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
                    PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT
                ]);
                deniedPermissions.push(...bluetoothResult.denied);
                hasNeverAskAgain =
                    hasNeverAskAgain || bluetoothResult.hasNeverAskAgain;
                await delay(REQUEST_STAGE_DELAY_MS);
            }
        }

        const locationNeedsRequest = !(await checkPermission(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        ));

        if (locationNeedsRequest) {
            const locationResult = await requestPermissionGroup([
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
            ]);
            deniedPermissions.push(...locationResult.denied);
            hasNeverAskAgain =
                hasNeverAskAgain || locationResult.hasNeverAskAgain;
            await delay(REQUEST_STAGE_DELAY_MS);
        }

        if (getAndroidApiLevel() >= ANDROID_API_NOTIFICATIONS) {
            const notificationsNeedRequest = !(await checkPermission(
                PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
            ));

            if (notificationsNeedRequest) {
                const notificationResult = await requestPermissionGroup([
                    PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
                ]);
                deniedPermissions.push(...notificationResult.denied);
                hasNeverAskAgain =
                    hasNeverAskAgain || notificationResult.hasNeverAskAgain;
            }
        }

        const flags = await readPermissionFlags();
        const uniqueDenied = [
            ...new Set([...collectDeniedLabels(flags), ...deniedPermissions])
        ];

        return buildGrantedStatus(
            flags.bluetooth,
            flags.location,
            flags.notifications,
            flags.deviceLocationEnabled,
            uniqueDenied,
            hasNeverAskAgain
        );
    } finally {
        isRequestingPermissions = false;
    }
}

/**
 * Check permissions, request any that are missing, then re-check.
 * Use this before ELD scan/connect flows.
 */
export async function ensureEldPermissions(): Promise<EldPermissionStatus> {
    const current = await getEldPermissionStatus();
    const needsAppPermission =
        !current.bluetooth || !current.location || !current.notifications;

    if (!needsAppPermission) {
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
    return `Still missing: ${status.deniedPermissions.join(', ')}.`;
}

export function openAppSettings(): void {
    Linking.openSettings().catch(() => {});
}

export function openDeviceLocationSettings(): void {
    if (Platform.OS !== 'android') {
        return;
    }
    Linking.sendIntent('android.settings.LOCATION_SOURCE_SETTINGS').catch(() => {
        Linking.openSettings().catch(() => {});
    });
}

/**
 * When the user returns to the app, re-check permission state only.
 * Does not re-request dialogs to avoid races with in-progress grants.
 */
export function watchEldPermissionsOnResume(onGranted: () => void): () => void {
    if (Platform.OS !== 'android') {
        return () => {};
    }

    const subscription = AppState.addEventListener('change', async (state) => {
        if (state !== 'active' || isRequestingPermissions) {
            return;
        }

        const status = await getEldPermissionStatus();
        if (status.allGranted) {
            onGranted();
        }
    });

    return () => subscription.remove();
}