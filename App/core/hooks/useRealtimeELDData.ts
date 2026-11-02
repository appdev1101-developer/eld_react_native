import { useEffect, useState } from 'react';
import { DeviceEventEmitter } from 'react-native';
import { ELD_EVENTS } from '../../Utils/bleEvents';


// Below this, we treat the reading as "stopped/idle" for display purposes
// rather than showing tiny nonzero noise (e.g. 0.3 mph) as if it were real
// motion. Doesn't affect the underlying data, purely a display decision.
const IDLE_SPEED_THRESHOLD = 1;

export type EldDataPayload = {
    speed?: number;
    speedTimestamp?: string;
    odometer?:number;
    vin?:string;
    latitude?:number;
    longitude?:number;
};

/**
 * Real-time vehicle speed, sourced from the same GeometrisData event
 * useEldConnection() already listens to for connection status — a
 * second, independent listener on the same event, each hook responsible
 * for its own slice of the payload. `speed` in the raw payload comes
 * straight from GeoDataForegroundService.geoDataToJson() as a flat,
 * top-level numeric field.
 *
 * TODO: confirm the actual unit the Geometris/Whereqube SDK reports
 * (assumed mph here, matching US trucking convention used throughout
 * this app) — nothing in the native conversion code labels the unit
 * explicitly.
 */
export function useRealtimeELDData() {
    const [speed, setSpeed] = useState<number | null>(null);
    const [speedTimeStamp, setSpeedTimeStamp] = useState<string>('');
    const [odometer, setOdometer] = useState<number | null>(null);
    const [vin, setVin] = useState<string | null>('');
    const [lat, setLat] = useState<number | null>(null);
    const [lng, setLng] = useState<number | null>(null);
    const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);

    useEffect(() => {
        const listener = DeviceEventEmitter.addListener(
            ELD_EVENTS.DATA,
            (payload: EldDataPayload) => {
                // if (typeof payload?.speed !== 'number' || Number.isNaN(payload.speed)) {
                //     return;
                // }
                //setSpeed(payload.speed < IDLE_SPEED_THRESHOLD ? 0 : payload.speed);
                setSpeed(payload.speed ?? 0);
                setSpeedTimeStamp(payload.speedTimestamp ?? '');
                setOdometer(payload.odometer ?? 0);
                setLat(payload.latitude ?? 0.0)
                setLng(payload.longitude ?? 0.0)
                setVin(payload.vin ?? 'N/A')
                setLastUpdatedAt(Date.now());
            }
        );

        return () => listener.remove();
    }, []);

    return { speed,speedTimeStamp,odometer,lat,lng,vin, lastUpdatedAt };
}