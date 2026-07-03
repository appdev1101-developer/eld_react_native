import Storage from '../../Utils/Storage';
import { MAIN_BASE_URL } from '../../Utils/EnvVariables';
import RNFetchBlob from 'rn-fetch-blob';
import RNFS from 'react-native-fs';
import { LegacyApiPayload } from './types/common';

const BASE_URL = `${MAIN_BASE_URL}/mobileAPI/`;
const REQUEST_TIMEOUT_MS = 30000;

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

type UploadFile = {
    key: string;
    path: string;
    mime: string;
};

async function getToken(): Promise<string | null> {
    return Storage.get('token');
}

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

async function getOriginalname(path: string): Promise<string> {
    const parts = path.split('/');
    return parts[parts.length - 1] ?? 'file';
}

function legacyRequest(
    endpoint: string,
    params: unknown = null,
    method: HttpMethod = 'GET'
): Promise<LegacyApiPayload> {
    return new Promise(async (resolve, reject) => {
        const token = await getToken();
        const xhr = new XMLHttpRequest();
        const url = `${BASE_URL}${endpoint}`;
        const timeoutId = setTimeout(() => {
            xhr.abort();
            reject({
                statusCode: 408,
                message: 'Request timed out'
            });
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

            if (xhr.status === 200) {
                const parsed = parseJsonSafe(xhr.responseText);
                resolve((parsed ?? { status: 'failure' }) as LegacyApiPayload);
                return;
            }

            if (xhr.status === 409) {
                const parsed = parseJsonSafe(xhr.responseText);
                resolve({
                    ...(parsed ?? {}),
                    multiauth: true,
                    status: 'conflict',
                    statusCode: 409
                } as LegacyApiPayload);
                return;
            }

            const parsed = parseJsonSafe(xhr.responseText);
            reject({
                ...(parsed ?? {}),
                status: xhr.status,
                statusCode: xhr.status
            });
        };

        xhr.onerror = () => {
            clearTimeout(timeoutId);
            reject({
                statusCode: 0,
                message: 'Network error'
            });
        };

        if (method === 'GET') {
            xhr.send();
        } else {
            xhr.send(params ? JSON.stringify(params) : undefined);
        }
    });
}

function legacyMultiupload(
    endpoint: string,
    method: HttpMethod,
    files: UploadFile[] = [],
    fields: Record<string, unknown> = {}
): Promise<LegacyApiPayload> {
    return new Promise(async (resolve, reject) => {
        const token = await getToken();
        const xhr = new XMLHttpRequest();
        const url = `${BASE_URL}${endpoint}`;
        const formData = new FormData();

        Object.entries(fields).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                formData.append(key, String(value));
            }
        });

        for (const file of files) {
            const name = await getOriginalname(file.path);
            formData.append(file.key, {
                uri: file.path,
                type: file.mime,
                name
            } as unknown as Blob);
        }

        const timeoutId = setTimeout(() => {
            xhr.abort();
            reject({ statusCode: 408, message: 'Upload timed out' });
        }, REQUEST_TIMEOUT_MS);

        xhr.open(method, url, true);
        xhr.setRequestHeader('Accept', '/');
        xhr.setRequestHeader('cache-control', 'no-cache');
        if (token) {
            xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        }

        xhr.onreadystatechange = () => {
            if (xhr.readyState !== XMLHttpRequest.DONE) {
                return;
            }
            clearTimeout(timeoutId);

            if (xhr.status === 200) {
                const parsed = parseJsonSafe(xhr.responseText);
                resolve((parsed ?? { status: 'failure' }) as LegacyApiPayload);
                return;
            }

            if (xhr.status === 409) {
                const parsed = parseJsonSafe(xhr.responseText);
                resolve({
                    ...(parsed ?? {}),
                    multiauth: true,
                    status: 'conflict',
                    statusCode: 409
                } as LegacyApiPayload);
                return;
            }

            const parsed = parseJsonSafe(xhr.responseText);
            reject({
                ...(parsed ?? {}),
                status: xhr.status,
                statusCode: xhr.status
            });
        };

        xhr.onerror = () => {
            clearTimeout(timeoutId);
            reject({ statusCode: 0, message: 'Network error during upload' });
        };

        xhr.send(formData);
    });
}

const legacyClient = {
    get: (endpoint: string, _params?: unknown) => legacyRequest(endpoint, null, 'GET'),
    post: (endpoint: string, params?: unknown) =>
        legacyRequest(endpoint, params, 'POST'),
    put: (endpoint: string, params?: unknown) =>
        legacyRequest(endpoint, params, 'PUT'),
    Delete: (endpoint: string, params?: unknown) =>
        legacyRequest(endpoint, params, 'DELETE'),
    multiupload: legacyMultiupload,
    FileUpload: async (
        url: string,
        file: { path: string; mime: string },
        fields: Record<string, unknown> = {}
    ) => {
        const token = await getToken();
        const apiUrl = `${BASE_URL}${url}`;
        const formData = new FormData();

        Object.entries(fields).forEach(([key, value]) => {
            formData.append(key, String(value));
        });

        if (file.path) {
            const name = await getOriginalname(file.path);
            formData.append('video', {
                uri: file.path,
                type: file.mime,
                name
            } as unknown as Blob);
        }

        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.withCredentials = true;
            xhr.onreadystatechange = () => {
                if (
                    xhr.readyState === XMLHttpRequest.DONE &&
                    (xhr.status === 200 || xhr.status === 400)
                ) {
                    resolve(parseJsonSafe(xhr.responseText) ?? {});
                    return;
                }
                if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 0) {
                    reject('notupload');
                }
            };
            xhr.open('POST', apiUrl);
            xhr.setRequestHeader('cache-control', 'no-cache');
            if (token) {
                xhr.setRequestHeader('Authorization', `Bearer ${token}`);
            }
            xhr.send(formData);
        });
    },
    newFileUpload: async (
        url: string,
        file: { path: string; mime: string },
        fields: Record<string, unknown> = {}
    ) => {
        const token = await getToken();
        const apiUrl = `${BASE_URL}${url}`;
        const formData = new FormData();

        Object.entries(fields).forEach(([key, value]) => {
            formData.append(key, String(value));
        });

        if (file.path) {
            const name = await getOriginalname(file.path);
            formData.append('image', {
                uri: file.path,
                type: file.mime,
                name
            } as unknown as Blob);
        }

        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.withCredentials = true;
            xhr.onreadystatechange = () => {
                if (
                    xhr.readyState === XMLHttpRequest.DONE &&
                    (xhr.status === 200 || xhr.status === 400)
                ) {
                    resolve(parseJsonSafe(xhr.responseText) ?? {});
                    return;
                }
                if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 0) {
                    reject('notupload');
                }
            };
            xhr.open('POST', apiUrl);
            xhr.setRequestHeader('Accept', '/');
            xhr.setRequestHeader('cache-control', 'no-cache');
            if (token) {
                xhr.setRequestHeader('Authorization', `Bearer ${token}`);
            }
            xhr.send(formData);
        });
    },
    musicFileUpload: async (
        url: string,
        file: { abPath: string; type: string; name: string },
        _fields: Record<string, unknown> = {}
    ) => {
        const token = await getToken();
        const apiUrl = `${BASE_URL}${url}`;
        const base64Image = await RNFS.readFile(file.abPath, 'base64');

        return RNFetchBlob.fetch(
            'POST',
            apiUrl,
            {
                Accept: '/',
                'Content-Type': 'application/octet-stream',
                'cache-control': 'no-cache',
                Authorization: token ?? '',
                originalname: file.name,
                minetype: `${file.type}`,
                replacetype: `data${file.type}base64`
            },
            `data:${file.type};base64,${base64Image}`
        ).then((result) => JSON.parse(result.data));
    }
};

export default legacyClient;