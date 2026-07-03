import { ConfigResponse } from '../../Model/Dashboard';
import { UserInfoDataType } from '../../Model/User';
import { ApprovalRequestData, HosSummary } from '../api/types/dashboard';

export type HomeCachedData = {
    userInfo: UserInfoDataType | null;
    hos: HosSummary | null;
    config: ConfigResponse | null;
    unsignedLogCount: number;
    unsignedLogs?: Array<unknown>;
    approvals: ApprovalRequestData | null;
    fetchedAt: number;
};

const CACHE_TTL_MS = 60_000;
let cache: HomeCachedData | null = null;

export function getHomeCache(): HomeCachedData | null {
    if (!cache) {
        return null;
    }
    if (Date.now() - cache.fetchedAt > CACHE_TTL_MS) {
        return null;
    }
    return cache;
}

export function setHomeCache(data: Omit<HomeCachedData, 'fetchedAt'>): void {
    cache = {
        ...data,
        fetchedAt: Date.now()
    };
}

export function invalidateHomeCache(): void {
    cache = null;
}