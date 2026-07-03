import { ApiError } from '../core/api/types/common';

function isApiError(value: unknown): value is ApiError {
    return (
        typeof value === 'object' &&
        value !== null &&
        'message' in value &&
        typeof (value as ApiError).message === 'string'
    );
}

export function getApiErrorMessage(
    error: unknown,
    fallback = 'Something went wrong. Please try again.'
): string {
    if (!error) {
        return fallback;
    }

    if (typeof error === 'string') {
        return error;
    }

    if (isApiError(error)) {
        if (error.error?.trim()) {
            return error.error;
        }
        if (typeof error.message === 'string' && error.message.trim()) {
            if (typeof error.message === 'object') {
                return fallback;
            }
            return error.message;
        }
    }

    if (error instanceof Error && error.message.trim()) {
        return error.message;
    }

    if (typeof error === 'object' && error !== null) {
        const record = error as Record<string, unknown>;
        if (typeof record.error === 'string' && record.error.trim()) {
            return record.error;
        }
        if (typeof record.message === 'string' && record.message.trim()) {
            return record.message;
        }
    }

    return fallback;
}