export interface HOSGraphData {
    log_id: number;
    shift_id: number;
    log_name: string;
    start_log_time: string;
    end_log_time: string;
    vehicle_name: string;
    vehicle_id: number;
    odometer: string | null;
    location_start: string | null;
    location_end: string | null;
    engine_hour: string | number | null;
}

export interface HOSChartLine {
    id: string;
    status: number;
    start: string;
    end: string;
}

export interface HOSChartViolation {
    shift_id?: string | number;
    violation_startTime: string;
    violation_endTime: string;
}

export interface HOSChartProps {
    marginHorizontal?: number;
    lineObject?: HOSChartLine[];
    violations?: HOSChartViolation[];
    vehicleName?: string;
}
