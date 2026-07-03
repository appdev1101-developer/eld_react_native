import { UserInfoDataType } from '../../../Model/User';
import { ConfigResponse } from '../../../Model/Dashboard';
import {
    ApprovalRequestData,
    DashboardData,
    HosSummary
} from '../types/dashboard';

function asString(value: unknown, fallback = ''): string {
    return typeof value === 'string' ? value : fallback;
}

export function mapHosSummary(raw: Record<string, unknown>): HosSummary {
    return {
        timeLeftInDrive: asString(raw.time_left_in_drive, '00:00:00'),
        timeLeftInShift: asString(raw.time_left_in_shift, '00:00:00'),
        timeLeftInCycle: asString(raw.time_left_in_cycle, '00:00:00'),
        timeLeftInBreak: asString(raw.time_left_in_break, '00:00:00'),
        latestLog: asString(raw.latest_log),
        timeInCurrentStatus: asString(raw.time_in_current_status)
    };
}

export function mapDashboardData(raw: Record<string, unknown>): DashboardData {
    return {
        userInfo: (raw.userInfo as UserInfoDataType | undefined) ?? null,
        hos: mapHosSummary(raw)
    };
}

export function mapConfigData(raw: Record<string, unknown>): ConfigResponse {
    return raw as unknown as ConfigResponse;
}

export function mapApprovalRequests(
    raw: Record<string, unknown>
): ApprovalRequestData {
    const data = (raw.data as Record<string, unknown> | undefined) ?? {};
    return {
        coDriver: (data.coDriver as Array<unknown>) ?? [],
        addLog: (data.addLog as Array<unknown>) ?? [],
        editLog: (data.editLog as Array<unknown>) ?? [],
        reassignLog: (data.reassignLog as Array<unknown>) ?? [],
        unidentifiedDriving: (data.unidentifiedDriving as Array<unknown>) ?? []
    };
}

export function mapUnsignedLogs(raw: Record<string, unknown>): Array<unknown> {
    return (raw.data as Array<unknown>) ?? [];
}

export function mapEmptyData(_raw: Record<string, unknown>): Record<string, never> {
    return {};
}

export function mapPassthrough(
    raw: Record<string, unknown>
): Record<string, unknown> {
    return raw;
}