import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../Redux/store';
import { dashboardApi } from '../api/services/dashboardApi';
import { isSuccess } from '../api/types/common';
import { setConfigData } from '../../Redux/reducer/User';

// Module-level (not per-component) so that many components mounting at
// once — e.g. a list rendering one ActivityCard per log entry — share a
// single in-flight request instead of each firing its own.
let inFlightRequest: Promise<void> | null = null;

/**
 * Timezone/language/safety-type config — used only by Compliance,
 * Settings, and Safety screens, never by the dashboard itself. Previously
 * this was fetched as part of every dashboard load (bundled into
 * useDashboard's Promise.all), which meant it was refetched on every
 * dashboard refresh for screens the driver might not visit that session.
 *
 * Call this hook from a screen (or component, even repeated in a list)
 * that actually reads `configData` — it fetches once for the whole app,
 * regardless of how many components call it concurrently, and caches for
 * the session. Config changes rarely enough that a hard refresh is a
 * reasonable way to pick up an update; this isn't a live subscription.
 */
export function useAppConfig() {
    const dispatch = useDispatch();
    const configData = useSelector((state: RootState) => state.User.configData);

    const ensureLoaded = useCallback(async () => {
        if (configData) {
            return;
        }
        if (!inFlightRequest) {
            inFlightRequest = dashboardApi
                .getConfig()
                .then((result) => {
                    if (isSuccess(result)) {
                        dispatch(setConfigData(result.data));
                    }
                })
                .catch((error) => {
                    if (__DEV__) {
                        console.warn('useAppConfig fetch failed', error);
                    }
                })
                .finally(() => {
                    inFlightRequest = null;
                });
        }
        await inFlightRequest;
    }, [configData, dispatch]);

    useEffect(() => {
        void ensureLoaded();
    }, [ensureLoaded]);

    return { configData, ensureLoaded };
}