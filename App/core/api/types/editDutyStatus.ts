// import { HosDayRecord, HosGraphLogEntry } from '../../../core/api/types/hosLog';

import { HosDayRecord, HosGraphLogEntry } from "./hosLog";

export interface EditDutyStatusNavigationParams {
    /** The specific log entry the user tapped "Edit" on. */
    log: HosGraphLogEntry;
    /** The full day's record — needed so the chart can show the whole day, not just this one segment. */
    record: HosDayRecord;
    timezone: string;
}

export interface EditDutyStatusFormValues {
    startTime: Date;
    endTime: Date;
    /** Duty-status id: 1 Off, 2 Sleeper, 3 Driving, 4 On Duty (see core/chart/hos_chart.config.ts). */
    dutyStatus: number;
    location: string;
    notes: string;
}

export interface UpdateDutyStatusPayload {
    log_id: number;
    date: string;
    start_time: string; // "HH:mm:ss"
    end_time: string; // "HH:mm:ss"
    shift_id: number;
    location: string;
    notes: string;
}