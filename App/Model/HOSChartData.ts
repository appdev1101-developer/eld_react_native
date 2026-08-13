export interface HOSChartData {
  status: string;
  statusCode: number;
  message: string;
  log_data: HOSLogData[];
}

export interface HOSLogData {
  [date: string]: HOSDailyData;
}

export interface HOSDailyData {
  graph_data: HOSGraphData[];
  vehicle: HOSVehicle[];
  violation_data: HOSViolationData;
  total_log_time: string;
  inspection_exist: boolean;
  coDriver_data: HOSCoDriver | null;
  coDriver_list: HOSCoDriver[];
  distance_diffr: number;
  odometer: string | null;
  start_location: string | null;
  location_end: string | null;
  engine_hour: number;
}

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
  engine_hour: string | null;
}

export interface HOSVehicle {
  name: string;
}

export interface HOSViolationData {
  Shift_data: HOSViolationItem[];
  total_shift_time: string;
  cycle_data: HOSViolationItem[];
  total_cycle_time: string;
  eight_hour_break_violation: HOSViolationItem[];
  total_drive_time: string;
  driver_eleven_viol_data: HOSViolationItem[];
  total_drive_shift_time: string;
  total_log_count: number;
}

export interface HOSViolationItem {
  shift_id: number;
  violation_duration: string;
  violation_startTime: string;
  violation_endTime: string;
}

export interface HOSCoDriver {
  id: number;
  first_name: string;
  last_name: string;
}