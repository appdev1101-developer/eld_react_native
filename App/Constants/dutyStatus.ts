import { ColorValue } from 'react-native';
import { THEME } from './Theme';

export type DutyStatusIconName =
    | 'drive'
    | 'yard'
    | 'personal'
    | 'onDuty'
    | 'sleeper'
    | 'offDuty';

export type DutyApiStatus =
    | 'Off duty'
    | 'Sleeping Berth'
    | 'Driving'
    | 'ON duty'
    | 'Personal Conveyance'
    | 'Yard moves';

export type StatusDataType = {
    id: number;
    icon: DutyStatusIconName;
    name: string;
    description?: string;
    apiStatus: DutyApiStatus;
    /** Primary ring color — sourced from THEME.status */
    themeColor: string;
    /** Which 60° arc segment is active: 1 = left, 2 = center, 3 = right */
    selectedArc: 1 | 2 | 3;
    /** Muted arc colors for inactive segments */
    arcColors: [ColorValue, ColorValue, ColorValue];
};

const INACTIVE_ARC_COLORS: [ColorValue, ColorValue, ColorValue] = [
    'rgba(255, 255, 255, 0.14)',
    'rgba(255, 255, 255, 0.14)',
    'rgba(255, 255, 255, 0.14)'
];

function buildStatus(
    entry: Omit<StatusDataType, 'arcColors' | 'themeColor'> & { themeColor: string }
): StatusDataType {
    return {
        ...entry,
        arcColors: INACTIVE_ARC_COLORS
    };
}

export const ALL_DUTY_STATUSES: Array<StatusDataType> = [
    buildStatus({
        id: 3,
        icon: 'drive',
        name: 'Drive',
        description: '11-Hour Driving Limit',
        apiStatus: 'Driving',
        themeColor: THEME.status.drive,
        selectedArc: 1
    }),
    buildStatus({
        id: 6,
        icon: 'yard',
        name: 'Yard Move',
        description: 'Moving Nearby',
        apiStatus: 'Yard moves',
        themeColor: THEME.status.yard,
        selectedArc: 2
    }),
    buildStatus({
        id: 5,
        icon: 'personal',
        name: 'Personal use',
        description: 'Personal Conveyance',
        apiStatus: 'Personal Conveyance',
        themeColor: THEME.status.personal,
        selectedArc: 3
    }),
    buildStatus({
        id: 4,
        icon: 'onDuty',
        name: 'ON Duty',
        description: 'On Duty — Not Driving',
        apiStatus: 'ON duty',
        themeColor: THEME.status.onDuty,
        selectedArc: 2
    }),
    buildStatus({
        id: 2,
        icon: 'sleeper',
        name: 'Sleeper',
        description: 'Sleeper Berth',
        apiStatus: 'Sleeping Berth',
        themeColor: THEME.status.sleeper,
        selectedArc: 3
    }),
    buildStatus({
        id: 1,
        icon: 'offDuty',
        name: 'Off duty',
        description: 'Off Duty — Personal Time',
        apiStatus: 'Off duty',
        themeColor: THEME.status.offDuty,
        selectedArc: 1
    })
];

export const DEFAULT_STATUS_VISUAL = {
    themeColor: THEME.colors.textAccent,
    selectedArc: 0 as 0 | 1 | 2 | 3,
    name: 'No Shift',
    arcColors: INACTIVE_ARC_COLORS
};

export function findDutyStatus(
    apiStatus?: string | null
): StatusDataType | undefined {
    if (!apiStatus) {
        return undefined;
    }
    return ALL_DUTY_STATUSES.find((item) => item.apiStatus === apiStatus);
}

export function getDutyStatusVisual(apiStatus?: string | null) {
    const status = findDutyStatus(apiStatus);
    if (!status) {
        return DEFAULT_STATUS_VISUAL;
    }
    return {
        themeColor: status.themeColor,
        selectedArc: status.selectedArc,
        name: status.name,
        arcColors: status.arcColors,
        icon: status.icon
    };
}