export type HOSApiDataType = {
    time_left_in_shift: string;
    time_left_in_cycle: string;
    time_left_in_drive: string;
    time_left_in_break: string;
    latest_log: string;
    time_in_current_status: string;
};

export type HOSChartData = {
    graph_data: Array<Array<any>>;
    violation_data: {
        Shift_data: Array<{
            shift_id: number;
            violation_duration: string;
            violation_startTime: string;
            violation_endTime: string;
        }>;
        total_shift_time: string;
    };
    vehicle?: Array<{
        name: string;
    }>;
};

export interface ConfigResponse {
    status: string;
    code: number;
    message: string;
    main_menu_data: MainMenu[];
    dashboard_module_data: DashboardModule[];
    lang_data: Language[];
    font_mode_data: FontMode[];
    duty_status: DutyStatus[];
    timezone: string;
    odometer: Odometer[];
    safety_type: SafetyType[];
    currentTime: string;
}

export interface MainMenu {
    menu_id: number;
    app_menu_id: number;
    language_id: number;
    menu_name: string;
    menu_link: string;
    view_type: number;
    display_leftmenu: string;
    child_menus: ChildMenu[];
}

export interface ChildMenu {
    menu_id: number;
    app_menu_id: number;
    language_id: number;
    menu_name: string;
    menu_link: string;
    view_type: number;
    display_leftmenu: string;
}

export interface DashboardModule {
    label_id: number;
    language_id: number;
    label_name: string;
    label_text: string;
}

export interface Language {
    id: number;
    short_name: string;
    language_name: string;
}

export interface FontMode {
    list_id: string;
    title: string;
    short_name: string;
    language_id: number;
    seq: number;
}

export interface DutyStatus {
    option_id: string;
    title: string;
    short_name: string;
    language_id: number;
    seq: number;
}

export interface Odometer {
    option_id: string;
    title: string;
    short_name: string;
    language_id: number;
    seq: number;
}

export interface SafetyType {
    title: string;
    short_name: string;
}
