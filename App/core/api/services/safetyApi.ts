import moment from 'moment-timezone';
import { API } from '../endpoints';
import { apiGet, toLegacyPayload } from '../client';
import { LegacyApiPayload } from '../types/common';

function mapPassthrough(raw: Record<string, unknown>): Record<string, unknown> {
    return raw;
}

export const safetyApi = {
    getSafetyData: (reason: string) => {
        const today = moment().tz('America/Denver').format('YYYY-MM-DD');
        return apiGet<Record<string, unknown>>(
            API.safety.data(reason, today, today),
            mapPassthrough
        );
    },

    getSafetyDataLegacy: async (reason: string): Promise<LegacyApiPayload> => {
        const response = await safetyApi.getSafetyData(reason);
        return toLegacyPayload(response);
    }
};