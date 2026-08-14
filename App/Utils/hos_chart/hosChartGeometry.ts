import { HOS_DASHED_STATUS_CODES, HOS_ROW_INDEX_BY_STATUS, HOSChartLine, HOSChartViolation } from '../../core/chart';
import {
    MINUTES_PER_DAY,
    normalizeEndMinutes,
    timeToMinutes,
} from './hosTime';

export interface ChartDimensions {
    width: number;
    height: number;
    left: number;
    top: number;
    bottom: number;
    rowHeight: number;
}

export interface ChartSegment {
    id: string;
    sourceId: string;
    status: number;
    rowIndex: number;
    dashed: boolean;
    startMinutes: number;
    endMinutes: number;
    startX: number;
    endX: number;
    y: number;
}

export interface ChartTransition {
    id: string;
    x: number;
    y1: number;
    y2: number;
    dashed: boolean;
}

export interface ViolationRect {
    id: string;
    startX: number;
    endX: number;
}

export function minutesToX(
    minutes: number,
    dimensions: ChartDimensions
): number {
    const clamped = Math.max(0, Math.min(MINUTES_PER_DAY, minutes));

    return (
        dimensions.left +
        (clamped / MINUTES_PER_DAY) * dimensions.width
    );
}

export function getRowIndex(status: number): number {
    return HOS_ROW_INDEX_BY_STATUS[status] ?? 0;
}

export function getStatusY(
    status: number,
    dimensions: ChartDimensions
): number {
    const rowIndex = getRowIndex(status);

    return (
        dimensions.top +
        rowIndex * dimensions.rowHeight +
        dimensions.rowHeight / 2
    );
}

/**
 * Converts source records into independent horizontal segments.
 *
 * Overnight:
 * 23:00 -> 02:00
 * becomes:
 * 23:00 -> 24:00
 * 00:00 -> 02:00
 *
 * This prevents SVG paths from jumping from the right side to the left side.
 */
export function buildChartSegments(
    lines: HOSChartLine[],
    dimensions: ChartDimensions
): ChartSegment[] {
    const segments: ChartSegment[] = [];

    lines.forEach((line) => {
        const start = timeToMinutes(line.start);
        const end = timeToMinutes(line.end);

        if (start === null || end === null || start === end) {
            return;
        }

        const normalizedEnd = normalizeEndMinutes(start, end);
        const rowIndex = getRowIndex(line.status);
        const dashed = HOS_DASHED_STATUS_CODES.has(line.status);
        const y = getStatusY(line.status, dimensions);

        if (normalizedEnd <= MINUTES_PER_DAY) {
            segments.push({
                id: `${line.id}-0`,
                sourceId: line.id,
                status: line.status,
                rowIndex,
                dashed,
                startMinutes: start,
                endMinutes: normalizedEnd,
                startX: minutesToX(start, dimensions),
                endX: minutesToX(normalizedEnd, dimensions),
                y,
            });

            return;
        }

        // First part: start -> midnight.
        segments.push({
            id: `${line.id}-1`,
            sourceId: line.id,
            status: line.status,
            rowIndex,
            dashed,
            startMinutes: start,
            endMinutes: MINUTES_PER_DAY,
            startX: minutesToX(start, dimensions),
            endX: minutesToX(MINUTES_PER_DAY, dimensions),
            y,
        });

        // Second part: midnight -> next-day end.
        const nextDayEnd = normalizedEnd - MINUTES_PER_DAY;

        if (nextDayEnd > 0) {
            segments.push({
                id: `${line.id}-2`,
                sourceId: line.id,
                status: line.status,
                rowIndex,
                dashed,
                startMinutes: 0,
                endMinutes: nextDayEnd,
                startX: minutesToX(0, dimensions),
                endX: minutesToX(nextDayEnd, dimensions),
                y,
            });
        }
    });

    return segments;
}

/**
 * Builds vertical step transitions only when two records actually touch.
 *
 * This intentionally does NOT connect:
 * 10:00 -> 11:00
 * with
 * 11:05 -> 12:00
 *
 * because a five-minute gap exists.
 *
 * It also deduplicates transitions created by repeated/duplicate records.
 */
export function buildChartTransitions(
    lines: HOSChartLine[],
    dimensions: ChartDimensions
): ChartTransition[] {
    const transitions: ChartTransition[] = [];
    const seen = new Set<string>();

    for (let i = 0; i < lines.length; i += 1) {
        const current = lines[i];

        const currentStart = timeToMinutes(current.start);
        const currentEndRaw = timeToMinutes(current.end);

        if (
            currentStart === null ||
            currentEndRaw === null ||
            currentStart === currentEndRaw
        ) {
            continue;
        }

        const currentEnd = normalizeEndMinutes(
            currentStart,
            currentEndRaw
        );

        // Look for a record whose start is exactly at the current
        // record's end modulo 24h.
        const boundaryMinutes = currentEnd % MINUTES_PER_DAY;

        let bestNext: HOSChartLine | null = null;

        for (let j = 0; j < lines.length; j += 1) {
            if (i === j) {
                continue;
            }

            const candidate = lines[j];
            const candidateStart = timeToMinutes(candidate.start);

            if (candidateStart === null) {
                continue;
            }

            if (Math.abs(candidateStart - boundaryMinutes) < 0.001) {
                bestNext = candidate;
                break;
            }
        }

        if (!bestNext || bestNext.status === current.status) {
            continue;
        }

        const x = minutesToX(boundaryMinutes, dimensions);
        const y1 = getStatusY(current.status, dimensions);
        const y2 = getStatusY(bestNext.status, dimensions);

        if (y1 === y2) {
            continue;
        }

        const id = `${x}-${Math.min(y1, y2)}-${Math.max(y1, y2)}`;

        if (seen.has(id)) {
            continue;
        }

        seen.add(id);

        transitions.push({
            id,
            x,
            y1,
            y2,
            // A dashed status keeps a dashed transition. This makes
            // special statuses visually distinguishable.
            dashed:
                HOS_DASHED_STATUS_CODES.has(current.status) ||
                HOS_DASHED_STATUS_CODES.has(bestNext.status),
        });
    }

    return transitions;
}

export function buildViolationRects(
    violations: HOSChartViolation[],
    dimensions: ChartDimensions
): ViolationRect[] {
    const result: ViolationRect[] = [];

    violations.forEach((violation, index) => {
        const start = timeToMinutes(violation.violation_startTime);
        const endRaw = timeToMinutes(violation.violation_endTime);

        if (start === null || endRaw === null || start === endRaw) {
            return;
        }

        const end = normalizeEndMinutes(start, endRaw);

        if (end <= MINUTES_PER_DAY) {
            result.push({
                id: `${violation.shift_id ?? index}-0`,
                startX: minutesToX(start, dimensions),
                endX: minutesToX(end, dimensions),
            });
            return;
        }

        // For an overnight violation, create two rectangles.
        result.push({
            id: `${violation.shift_id ?? index}-1`,
            startX: minutesToX(start, dimensions),
            endX: minutesToX(MINUTES_PER_DAY, dimensions),
        });

        result.push({
            id: `${violation.shift_id ?? index}-2`,
            startX: minutesToX(0, dimensions),
            endX: minutesToX(end - MINUTES_PER_DAY, dimensions),
        });
    });

    return result;
}
