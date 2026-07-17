import { Login, UserDataType } from '../../../Model/User';
import { API } from '../endpoints';
import { apiGet, apiPost, toLegacyPayload } from '../client';
import { LegacyApiPayload } from '../types/common';
import legacyClient from '../legacyClient';
import { mapEmptyData } from '../mappers/dashboardMapper';

export interface LoginResult {
    token: string;
    userInfo: UserDataType;
    logSessionId: string | null;
    raw: LegacyApiPayload;
}

function mapLoginResult(raw: Record<string, unknown>): LoginResult {
    const userInfo =
        (raw.user_info as UserDataType | undefined) ??
        ({
            id: raw.user_id,
            master_id: raw.master_id,
            ...(raw.user_info as object)
        } as UserDataType);

    const logSessionId = raw.log_session_id;
    const normalizedLogSessionId =
        logSessionId === undefined || logSessionId === null || logSessionId === ''
            ? null
            : String(logSessionId);

    return {
        token: String(raw.token ?? ''),
        userInfo,
        logSessionId: normalizedLogSessionId,
        raw: raw as LegacyApiPayload
    };
}

export const authApi = {
    login: (credentials: Login) =>
        apiPost<LoginResult>(API.auth.login(), mapLoginResult, credentials),

    loginLegacy: async (credentials: Login): Promise<LegacyApiPayload> => {
        const response = await authApi.login(credentials);
        if (response.multiauth || response.status === 'conflict') {
            return {
                ...response.data.raw,
                multiauth: true,
                status: 'conflict',
                statusCode: response.statusCode
            };
        }
        return {
            ...response.data.raw,
            status: response.status,
            message: response.message,
            statusCode: response.statusCode,
            token: response.data.token,
            user_info: response.data.userInfo,
            log_session_id: response.data.logSessionId ?? undefined
        };
    },

    logout: (logSessionId: string | number) =>
        apiGet<Record<string, never>>(
            API.auth.logout(logSessionId),
            mapEmptyData
        ),

    logoutLegacy: async (
        logSessionId: string | number
    ): Promise<LegacyApiPayload> => {
        const response = await authApi.logout(logSessionId);
        return toLegacyPayload(response);
    },

    forgotPasswordLegacy: (email: string): Promise<LegacyApiPayload> =>
        legacyClient.post(API.auth.forgotPassword(email), {}),

    resetPasswordLegacy: (
        email: string,
        password: string,
        confirmPassword: string
    ): Promise<LegacyApiPayload> =>
        legacyClient.multiupload(API.auth.resetPassword(email), 'POST', [], {
            password,
            confirm_password: confirmPassword
        }),

    registerFcmToken: (payload: {
        fcm_token: string;
        platform: string;
        device_id: string;
    }) =>
        apiPost<Record<string, never>>(
            API.auth.fcmToken(),
            mapEmptyData,
            payload
        )
};