import { DeviceEventEmitter } from 'react-native';
import GeoDataBackgroundService from './GeoDataService';

const DATA_STALE_MS = 15_000;

let lastDataTimestamp = 0;
let listenerAttached = false;

/** Register a single app-wide listener for connection beeps. */
export function ensureEldConnectionBeepListener(): void {
    if (listenerAttached) {
        return;
    }
    listenerAttached = true;
    DeviceEventEmitter.addListener('GeometrisData', onEldGeoDataReceived);
}

/**
 * Call when a GeometrisData event is received. Plays a short beep the first time
 * the ELD link becomes active (or reconnects after going stale).
 */
export function onEldGeoDataReceived(): void {
    const now = Date.now();
    const wasConnected =
        lastDataTimestamp > 0 && now - lastDataTimestamp <= DATA_STALE_MS;
    lastDataTimestamp = now;

    if (!wasConnected) {
        GeoDataBackgroundService.playConnectionBeep().catch(() => {});
    }
}

/** Reset tracking when the saved ELD device is cleared. */
export function resetEldConnectionTracking(): void {
    lastDataTimestamp = 0;
}
