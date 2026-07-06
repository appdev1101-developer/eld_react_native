import { DutyStatusLocation, EMPTY_DUTY_STATUS_LOCATION } from './types';
import { parseCoordinates } from './parseCoordinates';

export type DutyStatusCoordinates = {
    lat: number;
    lng: number;
};

export function getDutyStatusCoordinates(
    location: DutyStatusLocation
): DutyStatusCoordinates | null {
    const coords = parseCoordinates(location.lat, location.lng);
    if (!coords) {
        return null;
    }
    return coords;
}

export function isDutyStatusLocationValid(location: DutyStatusLocation): boolean {
    return getDutyStatusCoordinates(location) !== null;
}

export function toDutyStatusLocation(
    lat: number,
    lng: number,
    address: string | null,
    source: DutyStatusLocation['source']
): DutyStatusLocation {
    const coords = parseCoordinates(lat, lng);
    if (!coords) {
        return EMPTY_DUTY_STATUS_LOCATION;
    }

    return {
        lat: coords.lat,
        lng: coords.lng,
        address,
        source
    };
}