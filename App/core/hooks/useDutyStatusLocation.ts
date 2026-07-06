import { useCallback, useEffect, useRef, useState } from 'react';
import { DeviceEventEmitter } from 'react-native';
import { GeoData } from '../../Utils/Geometris';
import DeviceLocation from '../../Utils/DeviceLocation';
import { parseCoordinates } from '../location/parseCoordinates';
import {
    DutyStatusLocation,
    EMPTY_DUTY_STATUS_LOCATION
} from '../location/types';
import { toDutyStatusLocation } from '../location/getDutyStatusLocation';

const DEVICE_LOCATION_REFRESH_MS = 15_000;

type UseDutyStatusLocationOptions = {
    enabled: boolean;
};

export function useDutyStatusLocation({ enabled }: UseDutyStatusLocationOptions) {
    const [location, setLocation] = useState<DutyStatusLocation>(EMPTY_DUTY_STATUS_LOCATION);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const eldCoordsRef = useRef<{ lat: number; lng: number } | null>(null);
    const eldAddressRef = useRef<string | null>(null);
    const deviceLocationRef = useRef<DutyStatusLocation | null>(null);
    const geocodeRequestIdRef = useRef(0);

    const resolveLocation = useCallback(() => {
        if (eldCoordsRef.current) {
            setLocation(
                toDutyStatusLocation(
                    eldCoordsRef.current.lat,
                    eldCoordsRef.current.lng,
                    eldAddressRef.current,
                    'eld'
                )
            );
            return;
        }

        if (deviceLocationRef.current) {
            setLocation(deviceLocationRef.current);
            return;
        }

        setLocation(EMPTY_DUTY_STATUS_LOCATION);
    }, []);

    const reverseGeocodeEld = useCallback(
        async (lat: number, lng: number) => {
            const requestId = ++geocodeRequestIdRef.current;
            const address = await DeviceLocation.reverseGeocode(lat, lng);
            if (requestId !== geocodeRequestIdRef.current) {
                return;
            }

            eldAddressRef.current = address;
            if (eldCoordsRef.current) {
                resolveLocation();
            }
        },
        [resolveLocation]
    );

    const refreshDeviceLocation = useCallback(async () => {
        setIsRefreshing(true);
        try {
            const deviceResult = await DeviceLocation.getCurrentLocation();
            if (deviceResult) {
                const coords = parseCoordinates(
                    deviceResult.latitude,
                    deviceResult.longitude
                );
                if (coords) {
                    const address = deviceResult.address?.trim() || null;
                    deviceLocationRef.current = toDutyStatusLocation(
                        coords.lat,
                        coords.lng,
                        address,
                        'device'
                    );
                }
            }
        } finally {
            setIsRefreshing(false);
            resolveLocation();
        }
    }, [resolveLocation]);

    const refreshLocation = useCallback(async () => {
        await refreshDeviceLocation();
        return location;
    }, [location, refreshDeviceLocation]);

    useEffect(() => {
        const listener = DeviceEventEmitter.addListener('GeometrisData', (data: GeoData) => {
            const coords = parseCoordinates(data?.latitude, data?.longitude);
            if (!coords) {
                return;
            }

            const previous = eldCoordsRef.current;
            eldCoordsRef.current = coords;

            const movedSignificantly =
                !previous ||
                Math.abs(previous.lat - coords.lat) > 0.0001 ||
                Math.abs(previous.lng - coords.lng) > 0.0001;

            if (movedSignificantly || !eldAddressRef.current) {
                reverseGeocodeEld(coords.lat, coords.lng);
            }

            resolveLocation();
        });

        return () => {
            listener.remove();
            geocodeRequestIdRef.current += 1;
        };
    }, [resolveLocation, reverseGeocodeEld]);

    useEffect(() => {
        if (!enabled) {
            return;
        }

        refreshDeviceLocation();
        const intervalId = setInterval(refreshDeviceLocation, DEVICE_LOCATION_REFRESH_MS);
        return () => clearInterval(intervalId);
    }, [enabled, refreshDeviceLocation]);

    const getFreshCoordinates = useCallback(async (): Promise<DutyStatusLocation> => {
        if (eldCoordsRef.current) {
            return toDutyStatusLocation(
                eldCoordsRef.current.lat,
                eldCoordsRef.current.lng,
                eldAddressRef.current,
                'eld'
            );
        }

        await refreshDeviceLocation();
        return deviceLocationRef.current ?? EMPTY_DUTY_STATUS_LOCATION;
    }, [refreshDeviceLocation]);

    return {
        location,
        isRefreshing,
        refreshLocation,
        getFreshCoordinates
    };
}