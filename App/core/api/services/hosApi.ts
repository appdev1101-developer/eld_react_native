import { API } from '../endpoints';
import { apiGet, apiPost, apiUploadMultipart, toLegacyPayload } from '../client';
import { mapEmptyData } from '../mappers/dashboardMapper';
import { LegacyApiPayload } from '../types/common';

function mapPassthrough(raw: Record<string, unknown>): Record<string, unknown> {
    return raw;
}

export const hosApi = {
    getChartData: (date: string) =>
        apiGet<Record<string, unknown>>(API.hos.chart(date), mapPassthrough),

    getChartDataLegacy: async (date: string): Promise<LegacyApiPayload> => {
        const response = await hosApi.getChartData(date);
        return toLegacyPayload(response);
    },

    getHosData: (toDate: string, fromDate: string) =>
        apiGet<Record<string, unknown>>(
            API.hos.data(toDate, fromDate),
            mapPassthrough
        ),

    getHosDataLegacy: async (
        fromDate: string,
        toDate: string
    ): Promise<LegacyApiPayload> => {
        const response = await hosApi.getHosData(toDate, fromDate);
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