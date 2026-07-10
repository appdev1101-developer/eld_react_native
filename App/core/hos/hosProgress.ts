export type HosCardKind = 'drive' | 'shift' | 'cycle';

export type HosUrgency = 'safe' | 'warning' | 'critical';

export const HOS_LIMITS_MINUTES: Record<HosCardKind, number> = {
    drive: 11 * 60,
    shift: 14 * 60,
    cycle: 70 * 60
};

export const HOS_LIMIT_LABELS: Record<HosCardKind, string> = {
    drive: '11-hour driving limit',
    shift: '14-hour on-duty limit',
    cycle: '70-hour cycle limit'
};

export function parseTimeLeftToMinutes(timeLeft: string): number {
    if (!timeLeft || timeLeft === '--') {
        return 0;
    }

    const parts = timeLeft.split(':').map((part) => Number.parseInt(part, 10) || 0);
    const hours = parts[0] ?? 0;
    const minutes = parts[1] ?? 0;
    return hours * 60 + minutes;
}

export function formatMinutesLabel(totalMinutes: number): string {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours <= 0) {
        return `${minutes}m`;
    }

    if (minutes === 0) {
        return `${hours}h`;
    }

    return `${hours}h ${minutes}m`;
}

export function getHosProgress(timeLeft: string, kind: HosCardKind) {
    const limitMinutes = HOS_LIMITS_MINUTES[kind];
    const remainingMinutes = parseTimeLeftToMinutes(timeLeft);
    const percentRemaining = Math.min(
        1,
        Math.max(0, limitMinutes > 0 ? remainingMinutes / limitMinutes : 0)
    );

    let urgency: HosUrgency = 'safe';
    if (percentRemaining <= 0.2) {
        urgency = 'critical';
    } else if (percentRemaining <= 0.5) {
        urgency = 'warning';
    }

    return {
        remainingMinutes,
        limitMinutes,
        percentRemaining,
        urgency,
        remainingLabel: formatMinutesLabel(remainingMinutes),
        limitLabel: HOS_LIMIT_LABELS[kind]
    };
}

export function getAccentedHosCard(
    apiStatus?: string | null
): HosCardKind | null {
    switch (apiStatus) {
        case 'Driving':
            return 'drive';
        case 'ON duty':
        case 'Yard moves':
            return 'shift';
        default:
            return null;
    }
}