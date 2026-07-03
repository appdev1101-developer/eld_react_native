import Storage from '../../Utils/Storage';
import { UserDataType } from '../../Model/User';

const TOKEN_KEY = 'token';
const ACCOUNT_KEY = 'account';

export async function getToken(): Promise<string | null> {
    const token = await Storage.get(TOKEN_KEY);
    return typeof token === 'string' ? token : null;
}

export async function setToken(token: string): Promise<void> {
    await Storage.set(TOKEN_KEY, token);
}

export async function getAccount(): Promise<UserDataType | null> {
    const account = await Storage.get(ACCOUNT_KEY);
    if (!account || typeof account !== 'object') {
        return null;
    }
    return account as UserDataType;
}

export async function setAccount(account: UserDataType): Promise<void> {
    await Storage.set(ACCOUNT_KEY, account);
}

export async function clearSessionStorage(): Promise<void> {
    await Storage.clear();
}