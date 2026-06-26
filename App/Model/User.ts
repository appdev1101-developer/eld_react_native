export type UserDataType = {
    id?: number;
    driver_id?: string | number;
    first_name: string;
    last_name: string;
    email: string;
    country_code: null | string;
    mobile_no: string;
    pin_code: string;
    address: string;
    timezone: string;
    avatar_image: null | string;
    language_id?: number | string | null;
    username?: string;
    master_id?: number;
    master_company_id?: number;
};

export type HomeTerminalType = {
    id: number;
    name: string;
    address: string;
    type: number;
    shapeData: string;
    latitude: number | null;
    longitude: number | null;
    radius: number | null;
    tags: string | null;
    notes: string | null;
    status: number;
};

export type UserInfoDataType = {
    id: number;
    user_id: number;
    fleet_user_id: number | null;
    language_id: number | null;
    driver_id: string;
    cargo_type_id: number;
    licenseNumber: string;
    username: string;
    note: string;
    driver_license_state: number;
    home_terminal_timezone: string;
    career_name: string;
    main_office_address: string;
    carrer_us_dot_number: string;
    home_terminal_name: string;
    home_terminal_address: number;
    odometer: number;
    updated_at: string;
    created_at: string;
    home_terminal: HomeTerminalType;
};

export type Login = {
    email: string;
    password: string;
    force?: number;
};
