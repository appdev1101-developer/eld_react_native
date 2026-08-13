import { API } from '../endpoints';
import { apiGet, apiPost, apiUploadMultipart, toLegacyPayload } from '../client';
import { mapEmptyData } from '../mappers/dashboardMapper';
import { mapHosLogData } from '../mappers/hosLogMapper';
import { LegacyApiPayload } from '../types/common';
import { HosDayRecord } from '../types/hosLog';

function mapPassthrough(raw: Record<string, unknown>): Record<string, unknown> {
    return raw;
}

export const hosApi = {

    getLogData: () =>
        apiGet<HosDayRecord[]>(API.hos.logData(), (raw) =>
            mapHosLogData(raw.log_data)
        ),
 
    getLogDataLegacy: async (): Promise<LegacyApiPayload> => {
        const response = await hosApi.getLogData();
        return toLegacyPayload(response);
    },

    editActivity: (data: unknown) =>
        apiPost<Record<string, never>>(API.hos.editActivity(), mapEmptyData, data),

    submitUnsignedLogSignature: (
        logId: number | string | null,
        signatureUri: string,
        mimeType: string
    ) =>
        apiUploadMultipart<Record<string, never>>(
            'POST',
            API.hos.unsignedLogs(),
            mapEmptyData,
            { id: logId },
            [
                {
                    key: 'signature',
                    uri: signatureUri,
                    mime: mimeType,
                    name: `signature.${mimeType.split('/')[1] ?? 'png'}`
                }
            ]
        ),

    certifyLogSignature: (
        date: string,
        signatureUri: string,
        mimeType: string
    ) =>
        apiUploadMultipart<Record<string, never>>(
            'POST',
            API.hos.certifyLog(date),
            mapEmptyData,
            {},
            [
                {
                    key: 'signature',
                    uri: signatureUri,
                    mime: mimeType,
                    name: `signature.${mimeType.split('/')[1] ?? 'png'}`
                }
            ]
        )
};