import Store from '../../Redux/store';
import { clearDashboard } from '../../Redux/reducer/Dashboard';
import { setUser } from '../../Redux/reducer/User';
import { UserDataType } from '../../Model/User';
import { invalidateComplianceCache } from '../cache/complianceCache';
import { invalidateHomeCache } from '../cache/homeDataCache';
import { invalidateMessagesCache } from '../cache/messagesCache';
import { invalidateNotificationsCache } from '../cache/notificationsCache';
import GeoDataBackgroundService from '../../Utils/GeoDataService';
import messageWebSocket from '../../Utils/MessageWebSocket';
import PushNotification from '../../Utils/PushNotification';
import { clearEldOnboardingSkipped } from './eldOnboarding';
import {
    clearSessionStorage,
    getAccount,
    getLogSessionId,
    getToken,
    setAccount,
    setLogSessionId,
    setToken
} from './sessionStorage';

let isTearingDown = false;

async function teardownSession(): Promise<void> {
    if (isTearingDown) {
        return;
    }
    isTearingDown = true;

    try {
        Store.dispatch(clearDashboard());
        invalidateHomeCache();
        invalidateComplianceCache();
        invalidateMessagesCache();
        invalidateNotificationsCache();
        PushNotification.setAuthState({ isLoggedIn: false, userId: null });
        messageWebSocket.disconnect();
        await GeoDataBackgroundService.stop();
    } catch (error) {
        if (__DEV__) {
            console.warn('SessionManager.teardownSession failed:', error);
        }
    } finally {
        isTearingDown = false;
    }
}

async function startSession(
    user: UserDataType,
    token: string,
    logSessionId?: string | null
): Promise<void> {
    await clearEldOnboardingSkipped();
    await setToken(token);
    await setAccount(user);
    if (logSessionId) {
        await setLogSessionId(logSessionId);
    }
    Store.dispatch(setUser(user));
}

async function endSession(): Promise<void> {
    await teardownSession();
    await clearSessionStorage();
}

async function restoreSession(): Promise<UserDataType | null> {
    const [account, token] = await Promise.all([getAccount(), getToken()]);
    if (!account || !token) {
        return null;
    }
    Store.dispatch(setUser(account));
    return account;
}

async function updateAccount(user: UserDataType): Promise<void> {
    await setAccount(user);
    Store.dispatch(setUser(user));
}

const SessionManager = {
    startSession,
    endSession,
    restoreSession,
    updateAccount,
    getToken,
    getAccount,
    getLogSessionId,
    teardownSession
};

export default SessionManager;