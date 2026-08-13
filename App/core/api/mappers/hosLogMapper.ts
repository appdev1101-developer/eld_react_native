import {
    HosCoDriver,
    HosDayLog,
    HosDayRecord,
    HosGraphLogEntry,
    HosVehicleRef,
    HosViolationData,
    HosViolationEntry
} from '../types/hosLog';

function asString(value: unknown, fallback = ''): string {
    return typeof value === 'string' ? value : fallback;
}

function asNullableString(value: unknown): string | null {
    return typeof value === 'string' ? value : null;
}

function asNumber(value: unknown, fallback = 0): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'string' && value.trim() !== '') {
        const parsed = Number(value);
        if (!Number.isNaN(parsed)) return parsed;
    }
    return fallback;
}

function asBoolean(value: unknown, fallback = false): boolean {
    return typeof value === 'boolean' ? value : fallback;
}

function asArray<T>(value: unknown): T[] {
    return Array.isArray(value) ? (value as T[]) : [];
}

function mapGraphEntry(raw: Record<string, unknown>): HosGraphLogEntry {
    return {
        log_id: asNumber(raw.log_id),
        shift_id: asNumber(raw.shift_id),
        log_name: asString(raw.log_name),
        start_log_time: asString(raw.start_log_time, '00:00:00'),
        end_log_time: asString(raw.end_log_time, '00:00:00'),
        vehicle_name: asString(raw.vehicle_name),
        vehicle_id: asNumber(raw.vehicle_id),
        odometer: asNullableString(raw.odometer),
        location_start: asNullableString(raw.location_start),
        location_end: asNullableString(raw.location_end),
        engine_hour: asNullableString(raw.engine_hour)
    };
}

function mapVehicle(raw: Record<string, unknown>): HosVehicleRef {
    return { name: asString(raw.name) };
}

function mapViolationEntry(raw: Record<string, unknown>): HosViolationEntry {
    return {
        shift_id: asNumber(raw.shift_id),
        violation_duration: asString(raw.violation_duration, '00:00:00'),
        violation_startTime: asString(raw.violation_startTime),
        violation_endTime: asString(raw.violation_endTime)
    };
}

function mapViolationData(raw: unknown): HosViolationData {
    const data = (raw ?? {}) as Record<string, unknown>;
    return {
        Shift_data: asArray<Record<string, unknown>>(data.Shift_data).map(mapViolationEntry),
        total_shift_time: asString(data.total_shift_time, '00:00:00'),
        cycle_data: asArray<Record<string, unknown>>(data.cycle_data).map(mapViolationEntry),
        total_cycle_time: asString(data.total_cycle_time, '00:00:00'),
        eight_hour_break_violation: asArray<Record<string, unknown>>(
            data.eight_hour_break_violation
        ).map(mapViolationEntry),
        total_drive_time: asString(data.total_drive_time, '00:00:00'),
        driver_eleven_viol_data: asArray<Record<string, unknown>>(
            data.driver_eleven_viol_data
        ).map(mapViolationEntry),
        total_drive_shift_time: asString(data.total_drive_shift_time, '00:00:00'),
        total_log_count: asNumber(data.total_log_count)
    };
}

function mapCoDriver(raw: Record<string, unknown>): HosCoDriver {
    return {
        id: asNumber(raw.id),
        first_name: asString(raw.first_name),
        last_name: asString(raw.last_name)
    };
}

function mapDayLog(raw: Record<string, unknown>): HosDayLog {
    return {
        graph_data: asArray<Record<string, unknown>>(raw.graph_data).map(mapGraphEntry),
        vehicle: asArray<Record<string, unknown>>(raw.vehicle).map(mapVehicle),
        violation_data: mapViolationData(raw.violation_data),
        total_log_time: asString(raw.total_log_time, '00:00:00'),
        inspection_exist: asBoolean(raw.inspection_exist),
        coDriver_data: raw.coDriver_data ?? null,
        coDriver_list: asArray<Record<string, unknown>>(raw.coDriver_list).map(mapCoDriver),
        distance_diffr: asNumber(raw.distance_diffr),
        odometer:
            typeof raw.odometer === 'string' || typeof raw.odometer === 'number'
                ? raw.odometer
                : null,
        start_location: asNullableString(raw.start_location),
        location_end: asNullableString(raw.location_end),
        engine_hour:
            typeof raw.engine_hour === 'string' || typeof raw.engine_hour === 'number'
                ? raw.engine_hour
                : 0
    };
}

/**
 * `log_data` arrives as an array of single-key objects, e.g.
 * [{ "2026-08-12": {...} }, { "2026-08-11": {...} }]. This flattens each
 * entry to { date, log } so nothing downstream needs
 * Object.keys(item)[0]/Object.values(item)[0] to read it.
 */
export function mapHosLogData(raw: unknown): HosDayRecord[] {
    if (!Array.isArray(raw)) {
        return [];
    }

    return raw.reduce<HosDayRecord[]>((acc, entry) => {
        if (!entry || typeof entry !== 'object') {
            return acc;
        }
        const date = Object.keys(entry)[0];
        if (!date) {
            return acc;
        }
        acc.push({
            date,
            log: mapDayLog((entry as Record<string, unknown>)[date] as Record<string, unknown>)
        });
        return acc;
    }, []);
}