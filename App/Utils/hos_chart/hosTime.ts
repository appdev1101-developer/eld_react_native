export const MINUTES_PER_DAY = 24 * 60;
export const SECONDS_PER_DAY = 24 * 60 * 60;

export function timeToSeconds(value: string): number | null {
    if (typeof value !== 'string') {
        return null;
    }

    const parts = value.trim().split(':');

    if (parts.length < 2 || parts.length > 3) {
        return null;
    }

    const hours = Number(parts[0]);
    const minutes = Number(parts[1]);
    const seconds = Number(parts[2] ?? 0);

    if (
        !Number.isFinite(hours) ||
        !Number.isFinite(minutes) ||
        !Number.isFinite(seconds) ||
        hours < 0 ||
        hours > 23 ||
        minutes < 0 ||
        minutes > 59 ||
        seconds < 0 ||
        seconds > 59
    ) {
        return null;
    }

    return hours * 3600 + minutes * 60 + seconds;
}

export function timeToMinutes(value: string): number | null {
    const seconds = timeToSeconds(value);
    return seconds === null ? null : seconds / 60;
}

export function formatHourLabel(hour: number): string {
    if (hour === 0 || hour === 24) {
        return 'M';
    }

    if (hour < 12) {
        return String(hour);
    }

    if (hour === 12) {
        return 'N';
    }

    return String(hour - 12);
}

/**
 * Returns an end time on the same forward timeline as start.
 *
 * 23:00 -> 01:30 becomes 23:00 -> 25:30.
 * 08:00 -> 10:00 remains 08:00 -> 10:00.
 */
export function normalizeEndMinutes(
    startMinutes: number,
    endMinutes: number
): number {
    if (endMinutes < startMinutes) {
        return endMinutes + MINUTES_PER_DAY;
    }

    return endMinutes;
}

export function isValidTimeRange(start: string, end: string): boolean {
    const startMinutes = timeToMinutes(start);
    const endMinutes = timeToMinutes(end);

    return (
        startMinutes !== null &&
        endMinutes !== null &&
        startMinutes !== endMinutes
    );
}
