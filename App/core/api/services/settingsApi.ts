import { API } from '../endpoints';
import { apiUploadMultipart, toLegacyPayload } from '../client';
import { LegacyApiPayload } from '../types/common';
import { mapEmptyData } from '../mappers/dashboardMapper';
export type UpdateAccountPayload = {
    first_name: string;
    last_name: string;
    driver_id: string;
    email: string;
    phone: string;
    language_id: string;
    pincode: string;
    address: string;
    timezone: string;
    username: string;
    licenseNumber: string;
};

export const settingsApi = {
    updateAccount: (data: UpdateAccountPayload) =>
        apiUploadMultipart<Record<string, never>>(
            'POST',
            API.settings.updateAccount(),
            mapEmptyData,
            data as unknown as Record<string, unknown>
        ),

    updateAccountLegacy: async (
        data: UpdateAccountPayload
    ): Promise<LegacyApiPayload> => {
        const response = await settingsApi.updateAccount(data);
        return toLegacyPayload(response);
    }
};