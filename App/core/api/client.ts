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

function parseJsonSafe(text: string): Record<string, unknown> | null {
    if (!text) {
        return null;
    }
    try {
        return JSON.parse(text) as Record<string, unknown>;
    } catch {
        return null;
    }
}

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

async function getToken(): Promise<string | null> {
    return Storage.get('token');
}

async function requestRaw(
    method: HttpMethod,
    endpoint: string,
    body?: unknown
): Promise<{ httpStatus: number; raw: Record<string, unknown> }> {
    if (!getIsOnline()) {
        return Promise.reject({
            statusCode: 0,
            message: 'No internet connection. Please check your network.'
        } satisfies ApiError);
    }

    const token = await getToken();
    const url = `${BASE_URL}${endpoint}`;

    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const timeoutId = setTimeout(() => {
            xhr.abort();
            reject({
                statusCode: 408,
                message: 'Request timed out'
            } satisfies ApiError);
        }, REQUEST_TIMEOUT_MS);

        xhr.open(method, url, true);
        xhr.setRequestHeader('Accept', '*/*');
        xhr.setRequestHeader('Content-Type', 'application/json');
        if (token) {
            xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        }

        xhr.onreadystatechange = () => {
            if (xhr.readyState !== XMLHttpRequest.DONE) {
                return;
            }
            clearTimeout(timeoutId);
            console.log("<<<<< Response >>>> "+xhr.responseText);
            const parsed = parseJsonSafe(xhr.responseText);
            
            if (xhr.status === 200 || xhr.status === 409) {
                resolve({
                    httpStatus: xhr.status,
                    raw: parsed ?? {
                        status: xhr.status === 409 ? 'conflict' : 'failure',
                        message: xhr.responseText || 'Empty response'
                    }
                });
                return;
            }

            if (parsed) {
                reject({
                    statusCode: xhr.status,
                    message: String(parsed.message ?? 'Request failed'),
                    error: parsed.error ? String(parsed.error) : undefined,
                    raw: parsed
                } satisfies ApiError);
                return;
            }

            reject({
                statusCode: xhr.status,
                message: 'Server error. Please try again later.',
                raw: xhr.responseText
            } satisfies ApiError);
        };

        xhr.onerror = () => {
            clearTimeout(timeoutId);
            reject({
                statusCode: 0,
                message: 'Network error. Check your connection.'
            } satisfies ApiError);
        };

        if (method === 'GET') {
            xhr.send();
        } else {
            xhr.send(body ? JSON.stringify(body) : undefined);
        }
    });
}

export async function apiRequest<T>(
    method: HttpMethod,
    endpoint: string,
    mapData: (payload: Record<string, unknown>) => T,
    body?: unknown
): Promise<ApiResponse<T>> {
    console.log("##### Method #####", method);
    console.log("##### Endpoint #####", endpoint);
    console.log("##### Body #####", body);
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

export async function apiUploadMultipart<T>(
    method: 'POST' | 'PUT',
    endpoint: string,
    mapData: (payload: Record<string, unknown>) => T,
    fields: Record<string, unknown>,
    files: MultipartFile[] = []
): Promise<ApiResponse<T>> {
    if (!getIsOnline()) {
        return Promise.reject({
            statusCode: 0,
            message: 'No internet connection. Please check your network.'
        } satisfies ApiError);
    }

    const token = await getToken();
    const url = `${BASE_URL}${endpoint}`;
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

    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const timeoutId = setTimeout(() => {
            xhr.abort();
            reject({
                statusCode: 408,
                message: 'Upload timed out'
            } satisfies ApiError);
        }, REQUEST_TIMEOUT_MS);

        xhr.open(method, url, true);
        xhr.setRequestHeader('Accept', '*/*');
        xhr.setRequestHeader('cache-control', 'no-cache');
        if (token) {
            xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        }

        xhr.onreadystatechange = () => {
            if (xhr.readyState !== XMLHttpRequest.DONE) {
                return;
            }
            clearTimeout(timeoutId);

            const parsed = parseJsonSafe(xhr.responseText);
            if (xhr.status === 200 || xhr.status === 409) {
                resolve(
                    buildApiResponse(
                        parsed ?? { status: 'failure', message: 'Empty upload response' },
                        xhr.status,
                        mapData
                    )
                );
                return;
            }

            reject({
                statusCode: xhr.status,
                message: String(parsed?.message ?? 'Upload failed'),
                raw: parsed ?? xhr.responseText
            } satisfies ApiError);
        };

        xhr.onerror = () => {
            clearTimeout(timeoutId);
            reject({
                statusCode: 0,
                message: 'Network error during upload.'
            } satisfies ApiError);
        };

        xhr.send(formData);
    });
}