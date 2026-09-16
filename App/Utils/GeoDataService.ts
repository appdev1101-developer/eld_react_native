import { NativeModules, Platform } from 'react-native';
import Storage from './Storage';
import { getToken } from '../core/session/sessionStorage';
import { getEldPermissionStatus } from './EldPermissions';
import { MAIN_BASE_URL } from './EnvVariables';
import { logger } from '../core/logger';

const { GeoDataService: NativeGeoDataService } = NativeModules;

const STORAGE_KEY_DEVICE = 'eld_device_address';

const getEldApiUrl = () => `${MAIN_BASE_URL}/mobileAPI/insert/bluetooth-data`;


/**
 * JS wrapper for the GeoDataForegroundService native module.
 *
 * The foreground service runs entirely in native code so it keeps collecting
 * and uploading ELD data even when the React Native JS thread is suspended
 * (app in background / screen off).
 *
 * Offline queue: if a POST fails or there is no internet the record is stored
 * in a local SQLite database and retried automatically the next time
 * connectivity is available.
 *
 * Live events: the service emits "GeometrisData" via DeviceEventEmitter so the
 * UI automatically reflects the latest values while the app is foregrounded.
 */
const GeoDataBackgroundService = {
    /**
     * Start the background ELD data service and persist the device address
     * so the service can be auto-restarted when the app is relaunched.
     *
     * @param deviceAddress  Bluetooth MAC address of the connected ELD device.
     */
    async start(deviceAddress: string): Promise<boolean> {
        if (Platform.OS !== 'android') return false;
        const { allGranted } = await getEldPermissionStatus();
        if (!allGranted) return false;

        const token: string = (await getToken()) ?? '';
        const eldDataUrl=getEldApiUrl();
        await Storage.set(STORAGE_KEY_DEVICE, deviceAddress);
        
        // logger.log(">>>> Token >>>> "+token);
        logger.log(">>>> ELD Data Url >>>> "+eldDataUrl);
        logger.log(">>>> Bluetooth Device >>>> "+deviceAddress);
        return NativeGeoDataService.startService(eldDataUrl, token, deviceAddress);
    },

    /** Stop the background service and clear the saved device address. */
    async stop(): Promise<boolean> {
        if (Platform.OS !== 'android') return false;
        await Storage.set(STORAGE_KEY_DEVICE, null);
        return NativeGeoDataService.stopService();
    },

    /**
     * Re-start the service using the last saved device address (call on app
     * launch so background collection resumes automatically after a restart).
     * Returns false if no address was previously saved.
     */
    async restoreIfNeeded(): Promise<boolean> {
        const address: string | null = await Storage.get(STORAGE_KEY_DEVICE);
        if (!address) return false;
        return GeoDataBackgroundService.start(address);
    },

    /** Returns the Bluetooth address of the currently saved device, or null. */
    async getSavedDeviceAddress(): Promise<string | null> {
        return Storage.get(STORAGE_KEY_DEVICE);
    },

    /**
     * Returns the number of GeoData records currently queued in SQLite
     * waiting to be uploaded (i.e. failed uploads due to no internet).
     */
    async getPendingCount(): Promise<number> {
        if (Platform.OS !== 'android') return 0;
        return NativeGeoDataService.getPendingCount();
    },

    /** Short notification beep when the ELD Bluetooth link becomes active. */
    async playConnectionBeep(): Promise<void> {
        if (Platform.OS !== 'android' || !NativeGeoDataService?.playConnectionBeep) {
            return;
        }
        await NativeGeoDataService.playConnectionBeep();
    },

    /**
     * Whether the app is currently exempt from battery optimization. This
     * matters specifically because a correctly-declared foreground service
     * with START_STICKY can still be killed in the background on plenty of
     * OEM Android skins (Xiaomi/MIUI, Samsung, Oppo, Vivo) unless the app
     * is explicitly whitelisted — a separate mechanism from the foreground
     * service APIs themselves.
     */
    async isIgnoringBatteryOptimizations(): Promise<boolean> {
        if (Platform.OS !== 'android' || !NativeGeoDataService?.isIgnoringBatteryOptimizations) {
            return true;
        }
        try {
            return await NativeGeoDataService.isIgnoringBatteryOptimizations();
        } catch {
            return false;
        }
    },

    /**
     * Opens the system dialog asking the user to exempt the app from
     * battery optimization. This is a user-facing system prompt — it
     * can't be silently auto-granted, the driver has to approve it
     * explicitly, same as any other permission dialog.
     */
    requestIgnoreBatteryOptimizations(): void {
        if (Platform.OS !== 'android' || !NativeGeoDataService?.requestIgnoreBatteryOptimizations) {
            return;
        }
        NativeGeoDataService.requestIgnoreBatteryOptimizations();
    },
};

export default GeoDataBackgroundService;