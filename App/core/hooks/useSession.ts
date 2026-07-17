import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Login, UserDataType } from '../../Model/User';
import { logout } from '../../Redux/reducer/User';
import { RootState } from '../../Redux/store';
import { authApi } from '../api/services/authApi';
import {
    isLoginConflict,
    isLoginSuccess,
    LoginLegacyResult,
    parseLogSessionId,
    parseLoginUser
} from '../session/loginHelpers';
import SessionManager from '../session/SessionManager';
import { getIsOnline } from '../network/networkMonitor';
import type { AppDispatch } from '../../Redux/store';

export type LoginAttemptResult =
    | { conflict: true; data: LoginLegacyResult }
    | { success: true; message: string; user: UserDataType }
    | { success: false; message: string };

export async function performLogout(dispatch: AppDispatch): Promise<void> {
    const logSessionId = await SessionManager.getLogSessionId();

    if (logSessionId && getIsOnline()) {
        try {
            await authApi.logoutLegacy(logSessionId);
        } catch (error) {
            if (__DEV__) {
                console.warn('Logout API failed; clearing local session anyway.', error);
            }
        }
    }

    await SessionManager.endSession();
    dispatch(logout());
}

export function useSession() {
    const dispatch = useDispatch<AppDispatch>();
    const session = useSelector((state: RootState) => state.User);

    const completeLogin = useCallback(
        async (result: LoginLegacyResult): Promise<LoginAttemptResult> => {
            if (isLoginConflict(result)) {
                return { conflict: true, data: result };
            }

            const user = parseLoginUser(result);
            const token = String(result.token ?? '');

            if (!user || !token || !isLoginSuccess(result)) {
                return {
                    success: false,
                    message: String(result.message ?? 'Login failed')
                };
            }

            await SessionManager.startSession(
                user,
                token,
                parseLogSessionId(result)
            );

            return {
                success: true,
                message: String(result.message ?? 'Logged in'),
                user
            };
        },
        [dispatch]
    );

    const login = useCallback(
        async (credentials: Login): Promise<LoginAttemptResult> => {
            const result = (await authApi.loginLegacy(credentials)) as LoginLegacyResult;
            return completeLogin(result);
        },
        [completeLogin]
    );

    const updateAccount = useCallback(async (user: UserDataType) => {
        await SessionManager.updateAccount(user);
    }, []);

    const signOut = useCallback(async () => {
        await performLogout(dispatch);
    }, [dispatch]);

    return {
        userData: session.userData,
        userInfo: session.userInfo,
        configData: session.configData,
        loginStatus: session.loginStatus,
        login,
        completeLogin,
        updateAccount,
        signOut
    };
}