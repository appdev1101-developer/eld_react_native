import { UserDataType } from '../../Model/User';
import { isLegacySuccess, LegacyApiPayload } from '../api/types/common';

export type LoginLegacyResult = LegacyApiPayload & {
    token?: string;
    user_info?: UserDataType;
    user_id?: number;
    master_id?: number;
    log_session_id?: string | number;
    success?: boolean;
};

export function parseLogSessionId(result: LoginLegacyResult): string | null {
    const logSessionId = result.log_session_id;
    if (logSessionId === undefined || logSessionId === null || logSessionId === '') {
        return null;
    }
    return String(logSessionId);
}

export function isLoginConflict(result: LoginLegacyResult): boolean {
    return (
        result.multiauth === true ||
        String(result.status ?? '').toLowerCase() === 'conflict'
    );
}

export function isLoginSuccess(result: LoginLegacyResult): boolean {
    if (isLoginConflict(result)) {
        return false;
    }
    if (result.success === true) {
        return Boolean(result.token);
    }
    return isLegacySuccess(result) && Boolean(result.token);
}

export function parseLoginUser(result: LoginLegacyResult): UserDataType | null {
    if (!isLoginSuccess(result)) {
        return null;
    }

    const userInfo = result.user_info;
    if (!userInfo && result.user_id === undefined) {
        return null;
    }

    return {
        ...(userInfo ?? {
            first_name: '',
            last_name: '',
            email: '',
            country_code: null,
            mobile_no: '',
            pin_code: '',
            address: '',
            timezone: '',
            avatar_image: null
        }),
        id: result.user_id ?? userInfo?.id,
        master_id: result.master_id ?? userInfo?.master_id
    } as UserDataType;
}