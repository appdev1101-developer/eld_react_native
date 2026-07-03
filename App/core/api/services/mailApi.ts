import { API } from '../endpoints';
import { apiGet, toLegacyPayload } from '../client';
import { LegacyApiPayload } from '../types/common';
import { mapEmptyData } from '../mappers/dashboardMapper';

export const mailApi = {
    sendDotInspectionMail: (email: string) =>
        apiGet<Record<string, never>>(API.mail.send(email), mapEmptyData),

    sendDotInspectionMailLegacy: async (email: string): Promise<LegacyApiPayload> => {
        const response = await mailApi.sendDotInspectionMail(email);
        return toLegacyPayload(response);
    }
};