import { GeoData } from '../../Utils/Geometris';

export function formatLocationLabel(geoData?: GeoData | null): string {
    if (
        geoData &&
        typeof geoData.latitude === 'number' &&
        typeof geoData.longitude === 'number' &&
        !(geoData.latitude === 0 && geoData.longitude === 0)
    ) {
        return `${geoData.latitude.toFixed(5)}, ${geoData.longitude.toFixed(5)}`;
    }
    return 'Location unavailable — connect ELD or enable GPS';
}