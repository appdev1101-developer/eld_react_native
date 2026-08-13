/**
 * One duty-status segment for a day. `shift_id` here is the duty-status
 * TYPE id (1 Off Duty, 2 Sleeper Berth, 3 Driving, 4 On Duty,
 * 5 Personal Conveyance, 6 Yard Move — same scheme as Constants/DutyStatus.ts
 * and changeDutyStatusLegacy's `data.id`). `log_name` is a human-readable
 * label for display only — never match against it, match against
 * `shift_id` (see HOSChart.tsx's ROW_INDEX_BY_STATUS).
 */
export interface HosGraphLogEntry {
    log_id: number;
    shift_id: number;
    log_name: string;
    start_log_time: string; // "HH:mm:ss", local to the log's day
    end_log_time: string; // "HH:mm:ss"
    vehicle_name: string;
    vehicle_id: number;
    odometer: string | null;
    location_start: string | null;
    location_end: string | null;
    engine_hour: string | null;
}

export interface HosVehicleRef {
    name: string;
}

/**
 * NOTE: `shift_id` here means something different from HosGraphLogEntry's
 * `shift_id` above — in this array it's the `log_id` of the violated log
 * entry (cross-reference into graph_data), not a duty-status type. Same
 * field name, two different meanings depending on which array it's in —
 * worth flagging to the backend team, but modeled as-is here since that's
 * what the API actually sends.
 */
export interface HosViolationEntry {
    shift_id: number;
    violation_duration: string;
    violation_startTime: string; // ISO datetime
    violation_endTime: string; // ISO datetime
}

export interface HosViolationData {
    Shift_data: HosViolationEntry[];
    total_shift_time: string;
    cycle_data: HosViolationEntry[];
    total_cycle_time: string;
    eight_hour_break_violation: HosViolationEntry[];
    total_drive_time: string;
    driver_eleven_viol_data: HosViolationEntry[];
    total_drive_shift_time: string;
    total_log_count: number;
}

export interface HosCoDriver {
    id: number;
    first_name: string;
    last_name: string;
}

export interface HosDayLog {
    graph_data: HosGraphLogEntry[];
    vehicle: HosVehicleRef[];
    violation_data: HosViolationData;
    total_log_time: string;
    inspection_exist: boolean;
    coDriver_data: unknown | null;
    coDriver_list: HosCoDriver[];
    distance_diffr: number;
    odometer: string | number | null;
    start_location: string | null;
    location_end: string | null;
    engine_hour: number | string;
}

/**
 * The raw shape each `log_data[i]` entry actually arrives in — a
 * single-key object keyed by date, e.g. { "2026-08-12": HosDayLog }.
 * Prefer HosDayRecord (below) everywhere else in the app; this raw shape
 * is only meant to be consumed by the mapper.
 */
export type HosLogDateEntry = Record<string, HosDayLog>;

export interface HosLogApiResponse {
    status: string;
    statusCode: number;
    message: string;
    log_data: HosLogDateEntry[];
}

/**
 * Flattened, app-facing shape — {date, log} instead of a single-key object
 * requiring Object.keys()[0]/Object.values()[0] gymnastics to read.
 */
export interface HosDayRecord {
    date: string;
    log: HosDayLog;
}