export type ParsedCoordinates = {
    lat: number;
    lng: number;
};

export function parseCoordinates(
    lat?: number | string | null,
    lng?: number | string | null
): ParsedCoordinates | null {
    const parsedLat = typeof lat === 'string' ? Number.parseFloat(lat) : lat;
    const parsedLng = typeof lng === 'string' ? Number.parseFloat(lng) : lng;

    if (
        typeof parsedLat !== 'number' ||
        typeof parsedLng !== 'number' ||
        Number.isNaN(parsedLat) ||
        Number.isNaN(parsedLng) ||
        (parsedLat === 0 && parsedLng === 0)
    ) {
        return null;
    }

    return {
        lat: Number(parsedLat.toFixed(6)),
        lng: Number(parsedLng.toFixed(6))
    };
}