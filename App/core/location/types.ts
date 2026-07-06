export type DutyStatusLocationSource = 'eld' | 'device' | 'none';

export type DutyStatusLocation = {
    lat: number;
    lng: number;
    address: string | null;
    source: DutyStatusLocationSource;
};

export const EMPTY_DUTY_STATUS_LOCATION: DutyStatusLocation = {
    lat: 0,
    lng: 0,
    address: null,
    source: 'none'
};