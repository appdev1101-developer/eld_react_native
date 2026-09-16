import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus, DeviceEventEmitter } from 'react-native';
import GeoDataBackgroundService from '../../Utils/GeoDataService';
import { resetEldConnectionTracking } from '../../Utils/EldConnectionBeep';
import { ELD_EVENTS, EldConnectionChangedPayload } from '../../Utils/bleEvents';
import { logger } from '../logger';



// Fallback safety net only — the primary signal is the CONNECTION_CHANGED
// event, forwarded from the native BT receiver/watchdog in
// GeoDataForegroundService. This stays as insurance in case an event is
// ever missed (e.g. the JS bridge wasn't ready at the exact moment it
// fired), so it's deliberately longer than the native watchdog's own 45s
// stall threshold rather than trying to be the fast path.
const DATA_STALE_MS = 60_000;

/**
 * The one hook any screen should use to know "is the ELD connected right
 * now". Previously this listening/staleness logic lived only inside
 * HomeHeader.tsx — any other screen wanting the same status would have
 * had to duplicate all of it. Extracted here so it's reusable and has
 * exactly one implementation to keep correct.
 */
export function useEldConnection() {
    const [isConnected, setIsConnected] = useState(false);
    const lastDataTimeRef = useRef(0);

    const refreshConnectionStatus = useCallback(async () => {
        const savedAddress = await GeoDataBackgroundService.getSavedDeviceAddress();
        if (!savedAddress) {
            logger.log("<< useEldConnection -> Empty Bluettooth Device >> ");
            lastDataTimeRef.current = 0;
            resetEldConnectionTracking();
            setIsConnected(false);
            return;
        }
        logger.log(`<< LastDataTime -> ${lastDataTimeRef.current} ${Date.now()}>>`);
        const elapsed = Date.now() - lastDataTimeRef.current;
        const hasRecentData = lastDataTimeRef.current > 0 && elapsed <= DATA_STALE_MS;
        logger.log(`<< Elapsed Time -> ${elapsed} ${hasRecentData}>>`);
        setIsConnected(hasRecentData);
    }, []);

    useEffect(() => {
        const connectionListener = DeviceEventEmitter.addListener(
            ELD_EVENTS.CONNECTION_CHANGED,
            (event: EldConnectionChangedPayload) => {
                logger.log(`<< connectionListener isConnected -> ${event?.connected}>>`);
                setIsConnected(!!event?.connected);
                if (event?.connected) {
                    lastDataTimeRef.current = Date.now();
                }
            }
        );

        const dataListener = DeviceEventEmitter.addListener(ELD_EVENTS.DATA, () => {
            lastDataTimeRef.current = Date.now();
            logger.log(`<< dataListener isConnected ${lastDataTimeRef.current}>>`);
            setIsConnected(true);
        });

        refreshConnectionStatus();

        const staleCheckInterval = setInterval(refreshConnectionStatus, 5000);

        const appStateListener = AppState.addEventListener('change', (state: AppStateStatus) => {
            if (state === 'active') {
                logger.log(`<< appStateListener state ${state}>>`);
                refreshConnectionStatus();
            }
        });

        return () => {
            connectionListener.remove();
            dataListener.remove();
            clearInterval(staleCheckInterval);
            appStateListener.remove();
        };
    }, [refreshConnectionStatus]);

    return { isConnected };
}