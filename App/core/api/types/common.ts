export type ApiStatus = 'success' | 'failure' | 'conflict';

export interface ApiResponse<T> {
    status: ApiStatus;
    message: string;
    statusCode: number;
    data: T;
    multiauth?: boolean;
    error?: string;
}

export interface ApiError {
    statusCode: number;
    message: string;
    error?: string;
    raw?: unknown;
}

export type LegacyApiPayload = Record<string, unknown> & {
    status?: string;
    message?: string;
    statusCode?: number;
    multiauth?: boolean;
};

export function isSuccess<T>(
    res: ApiResponse<T>
): res is ApiResponse<T> & { status: 'success' } {
    return res.status === 'success';
}

export function isLegacySuccess(payload: LegacyApiPayload): boolean {
    const status = String(payload.status ?? '').toLowerCase();
    return status === 'success';
}