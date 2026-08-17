export type SingleActivityTab = 'log' | 'form' | 'sign';

export interface CoDriver {
    id: number;
    first_name: string;
    last_name: string;
}

export interface EditActivityFormValues {
    distance: string;
    odometer: string;
    driverName: string;
    carrierName: string;
    mainOfficeAddress: string;
    homeTerminalAddress: string;
    coDriverId: string;
    origin: string;
    destination: string;
}

export interface EditActivityPayload {
    first_name: string;
    last_name: string;
    date: string;
    cariier_name: string;
    main_office_address: string;
    home_terminal_address: string;
    distance: string;
    odometer: string;
    fromLoc: string;
    toLoc: string;
    notes: string;
    codriver_id: string;
}
