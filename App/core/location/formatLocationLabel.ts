import { DutyStatusLocation } from './types';
import { parseCoordinates } from './parseCoordinates';

export function formatLocationLabel(location: DutyStatusLocation): string {
    if (location.address) {
        return location.address;
    }

    const coords = parseCoordinates(location.lat, location.lng);
    if (coords) {
        return `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`;
    }

    return 'Location unavailable — enable GPS or connect ELD';
}