import { API } from '../endpoints';
import { apiGet, apiPost, toLegacyPayload } from '../client';
import { LegacyApiPayload } from '../types/common';
import { mapEmptyData } from '../mappers/dashboardMapper';

function mapPassthrough(raw: Record<string, unknown>): Record<string, unknown> {
    return raw;
}

export const inspectionApi = {
    getCreateFormData: () =>
        apiGet<Record<string, unknown>>(
            API.inspection.createForm(),
            mapPassthrough
        ),

    getCreateFormDataLegacy: async (): Promise<LegacyApiPayload> => {
        const response = await inspectionApi.getCreateFormData();
        return toLegacyPayload(response);
    },

    submitInspection: (data: unknown) =>
        apiPost<Record<string, never>>(
            API.inspection.submit(),
            mapEmptyData,
            data
        ),

    getHistory: () =>
        apiGet<Record<string, unknown>>(API.inspection.history(), mapPassthrough),

    getHistoryLegacy: async (): Promise<LegacyApiPayload> => {
        const response = await inspectionApi.getHistory();
        return toLegacyPayload(response);
    }
};