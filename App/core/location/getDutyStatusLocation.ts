import { GeoData } from '../../Utils/Geometris';

const FALLBACK_LAT = 0;
const FALLBACK_LNG = 0;

export type DutyStatusCoordinates = {
    lat: number;
    lng: number;
};

export function getDutyStatusCoordinates(
    geoData?: GeoData | null
): DutyStatusCoordinates {
    const lat = geoData?.latitude;
    const lng = geoData?.longitude;

    if (
        typeof lat === 'number' &&
        typeof lng === 'number' &&
        !Number.isNaN(lat) &&
        !Number.isNaN(lng) &&
        !(lat === 0 && lng === 0)
    ) {
        return {
            lat: Number(lat.toFixed(6)),
            lng: Number(lng.toFixed(6))
        };
    }

    return { lat: FALLBACK_LAT, lng: FALLBACK_LNG };
}