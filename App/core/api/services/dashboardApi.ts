import { API } from '../endpoints';
import { apiGet, apiPost, toLegacyPayload } from '../client';
import {
    mapApprovalRequests,
    mapConfigData,
    mapDashboardData,
    mapEmptyData,
    mapUnsignedLogs
} from '../mappers/dashboardMapper';
import { LegacyApiPayload } from '../types/common';
import { ApprovalRequestData, ConfigResponse, DashboardData } from '../types/dashboard';

export const dashboardApi = {
    getData: () =>
        apiGet<DashboardData>(API.dashboard.data(), mapDashboardData),

    getDataLegacy: async (): Promise<LegacyApiPayload> => {
        const response = await dashboardApi.getData();
        return toLegacyPayload(response);
    },

    getConfig: () =>
        apiGet<ConfigResponse>(API.dashboard.config(), mapConfigData),

    getConfigLegacy: async (): Promise<LegacyApiPayload> => {
        const response = await dashboardApi.getConfig();
        return toLegacyPayload(response);
    },

    getApprovalRequests: () =>
        apiGet<ApprovalRequestData>(API.dashboard.approvals(), mapApprovalRequests),

    getApprovalRequestsLegacy: async (): Promise<LegacyApiPayload> => {
        const response = await dashboardApi.getApprovalRequests();
        return {
            ...toLegacyPayload(response),
            data: response.data
        };
    },

    getUnsignedLogs: () =>
        apiGet<Array<unknown>>(API.hos.unsignedLogs(), mapUnsignedLogs),

    getUnsignedLogsLegacy: async (): Promise<LegacyApiPayload> => {
        const response = await dashboardApi.getUnsignedLogs();
        return {
            ...toLegacyPayload(response),
            data: response.data
        };
    },

    changeDutyStatus: (
        id: number,
        lat: number,
        lng: number,
        remark: string
    ) =>
        apiGet<Record<string, never>>(
            API.dashboard.changeDutyStatus(id, lat, lng, remark),
            mapEmptyData
        ),

    changeDutyStatusLegacy: async (
        id: number,
        lat: number,
        lng: number,
        remark: string
    ): Promise<LegacyApiPayload> => {
        const response = await dashboardApi.changeDutyStatus(id, lat, lng, remark);
        return toLegacyPayload(response);
    },

    readAllNotifications: () =>
        apiPost<Record<string, never>>(
            API.dashboard.notifications(),
            mapEmptyData,
            {}
        ),

    markApprovalStatus: (
        type: Parameters<typeof API.dashboard.approvalAction>[0],
        status: number,
        data: unknown
    ) =>
        apiPost<Record<string, never>>(
            API.dashboard.approvalAction(type, status),
            mapEmptyData,
            data
        )
};