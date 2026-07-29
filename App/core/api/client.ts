import axios, { AxiosError, AxiosInstance } from 'axios';
import Storage from '../../Utils/Storage';
import { MAIN_BASE_URL } from '../../Utils/EnvVariables';
import { getIsOnline } from '../network/networkMonitor';
import {
    ApiError,
    ApiResponse,
    ApiStatus,
    LegacyApiPayload
} from './types/common';

const BASE_URL = `${MAIN_BASE_URL}/mobileAPI/`;
const REQUEST_TIMEOUT_MS = 30000;

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

type MultipartFile = {
    key: string;
    uri: string;
    mime: string;
    name: string;
};

type OfflineError = ApiError & { isOfflineError: true };

function isOfflineError(error: unknown): error is OfflineError {
    return (
        typeof error === 'object' &&
        error !== null &&
        (error as OfflineError).isOfflineError === true
    );
}

/**
 * Single Axios instance for the whole app. Every request (JSON or multipart)
 * goes through this instance so auth headers, offline handling, timeouts,
 * and error shaping only need to be correct in one place.
 *
 * `validateStatus` intentionally accepts both 200 and 409: the backend uses
 * 409 as a "conflict / multi-auth" business response rather than a hard
 * failure, matching the behavior of the previous XHR-based client.
 */
export const apiClient: AxiosInstance = axios.create({
    baseURL: BASE_URL,
    timeout: REQUEST_TIMEOUT_MS,
    headers: { Accept: '*/*' },
    validateStatus: (status) => status === 200 || status === 409
});

// ---- request interceptor: auth header + offline short-circuit ----
apiClient.interceptors.request.use(async (config) => {
    if (!getIsOnline()) {
        const offlineError: OfflineError = {
            isOfflineError: true,
            statusCode: 0,
            message: 'No internet connection. Please check your network.'
        };
        return Promise.reject(offlineError);
    }

    const token = await Storage.get<string>('token');
    if (token) {
        config.headers = config.headers ?? {};
        config.headers.Authorization = `Bearer ${token}`;
        if(__DEV__)
        {
            console.log(`[Auth Token] ${token}`);
        }

    }

    if (__DEV__) {
        // Dev-only, and deliberately never logs request/response bodies —
        // those can contain auth tokens or driver PII.
        console.log(`[api] ${config.method?.toUpperCase()} ${config.url}`);
    }

    return config;
});

// ---- response interceptor: every failure comes out shaped as ApiError ----
apiClient.interceptors.response.use(
    (response) => {
        console.log('[api response]',response.data);
        return response;
    }, 
    (error: AxiosError | OfflineError) => {
        if (isOfflineError(error)) {
            return Promise.reject(error);
        }

        const axiosError = error as AxiosError<Record<string, unknown>>;

        if (axiosError.code === 'ECONNABORTED') {
            return Promise.reject({
                statusCode: 408,
                message: 'Request timed out'
            } satisfies ApiError);
        }

        if (!axiosError.response) {
            return Promise.reject({
                statusCode: 0,
                message: 'Network error. Check your connection.'
            } satisfies ApiError);
        }

        const data = axiosError.response.data;
        return Promise.reject({
            statusCode: axiosError.response.status,
            message: String(data?.message ?? 'Request failed'),
            error: data?.error ? String(data.error) : undefined,
            raw: data
        } satisfies ApiError);
    }
);

function normalizeStatus(raw: Record<string, unknown>, httpStatus: number): ApiStatus {
    if (httpStatus === 409 || raw.multiauth === true) {
        return 'conflict';
    }
    const status = String(raw.status ?? '').toLowerCase();
    if (status === 'success') {
        return 'success';
    }
    if (status === 'conflict') {
        return 'conflict';
    }
    if (httpStatus >= 200 && httpStatus < 300 && status === '') {
        return 'success';
    }
    return 'failure';
}

export function toLegacyPayload<T>(
    response: ApiResponse<T>
): LegacyApiPayload & T {
    return {
        status: response.status,
        message: response.message,
        statusCode: response.statusCode,
        multiauth: response.multiauth,
        ...(response.data as object)
    } as LegacyApiPayload & T;
}

export function buildApiResponse<T>(
    raw: Record<string, unknown>,
    httpStatus: number,
    mapData: (payload: Record<string, unknown>) => T
): ApiResponse<T> {
    const status = normalizeStatus(raw, httpStatus);
    return {
        status,
        message: String(raw.message ?? ''),
        statusCode: Number(raw.statusCode ?? httpStatus),
        data: mapData(raw),
        multiauth: raw.multiauth === true ? true : undefined,
        error: raw.error ? String(raw.error) : undefined
    };
}

async function requestRaw(
    method: HttpMethod,
    endpoint: string,
    body?: unknown
): Promise<{ httpStatus: number; raw: Record<string, unknown> }> {
    const response = await apiClient.request<Record<string, unknown>>({
        url: endpoint,
        method,
        data: body,
        headers: { 'Content-Type': 'application/json' }
    });

    return {
        httpStatus: response.status,
        raw: response.data ?? {}
    };
}

export async function apiRequest<T>(
    method: HttpMethod,
    endpoint: string,
    mapData: (payload: Record<string, unknown>) => T,
    body?: unknown
): Promise<ApiResponse<T>> {
    const { httpStatus, raw } = await requestRaw(method, endpoint, body);
    return buildApiResponse(raw, httpStatus, mapData);
}

export async function apiGet<T>(
    endpoint: string,
    mapData: (payload: Record<string, unknown>) => T
): Promise<ApiResponse<T>> {
    return apiRequest('GET', endpoint, mapData);
}

export async function apiPost<T>(
    endpoint: string,
    mapData: (payload: Record<string, unknown>) => T,
    body?: unknown
): Promise<ApiResponse<T>> {
    return apiRequest('POST', endpoint, mapData, body);
}

export async function apiPut<T>(
    endpoint: string,
    mapData: (payload: Record<string, unknown>) => T,
    body?: unknown
): Promise<ApiResponse<T>> {
    return apiRequest('PUT', endpoint, mapData, body);
}

export async function apiDelete<T>(
    endpoint: string,
    mapData: (payload: Record<string, unknown>) => T,
    body?: unknown
): Promise<ApiResponse<T>> {
    return apiRequest('DELETE', endpoint, mapData, body);
}

function buildFormData(
    fields: Record<string, unknown>,
    files: MultipartFile[]
): FormData {
    const formData = new FormData();

    Object.entries(fields).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            formData.append(key, String(value));
        }
    });

    for (const file of files) {
        formData.append(file.key, {
            uri: file.uri,
            type: file.mime,
            name: file.name
        } as unknown as Blob);
    }

    return formData;
}

/**
 * Multipart upload (used for signatures, inspection photos, profile pictures,
 * account settings, etc). Content-Type is deliberately NOT set manually —
 * React Native's networking layer needs to generate the multipart boundary
 * itself when given a FormData body; setting the header by hand breaks it.
 */
export async function apiUploadMultipart<T>(
    method: 'POST' | 'PUT',
    endpoint: string,
    mapData: (payload: Record<string, unknown>) => T,
    fields: Record<string, unknown>,
    files: MultipartFile[] = []
): Promise<ApiResponse<T>> {
    const formData = buildFormData(fields, files);

    const response = await apiClient.request<Record<string, unknown>>({
        url: endpoint,
        method,
        data: formData,
        headers: { 'cache-control': 'no-cache' }
    });

    return buildApiResponse(response.data ?? {}, response.status, mapData);
}

/**
 * Convenience wrapper for the handful of call sites that still expect a
 * raw LegacyApiPayload instead of the typed ApiResponse<T> envelope
 * (i.e. anything migrated off the old legacyClient). New code should
 * prefer apiPost/apiUploadMultipart + toLegacyPayload directly.
 */
export async function legacyPost(
    endpoint: string,
    body?: unknown
): Promise<LegacyApiPayload> {
    const response = await apiPost(endpoint, (raw) => raw, body);
    return toLegacyPayload(response);
}

export async function legacyMultipart(
    endpoint: string,
    fields: Record<string, unknown>,
    files: MultipartFile[] = []
): Promise<LegacyApiPayload> {
    const response = await apiUploadMultipart(
        'POST',
        endpoint,
        (raw) => raw,
        fields,
        files
    );
    return toLegacyPayload(response);
}