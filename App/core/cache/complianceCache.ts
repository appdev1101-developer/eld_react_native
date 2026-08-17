import { HosDayRecord } from "../api/types/hosLog";


export type HosLogDayRecord = Record<string, unknown>;

export type ComplianceCachedData = {
    hosRecords: HosDayRecord[];
    fetchedAt: number;
};

const CACHE_TTL_MS = 60_000;
let cache: ComplianceCachedData | null = null;

export function getComplianceCache(): ComplianceCachedData | null {
    if (!cache) {
        return null;
    }
    if (Date.now() - cache.fetchedAt > CACHE_TTL_MS) {
        return null;
    }
    return cache;
}

export function setComplianceCache(
    data: Omit<ComplianceCachedData, 'fetchedAt'>
): void {
    cache = {
        ...data,
        fetchedAt: Date.now()
    };
}

export function invalidateComplianceCache(): void {
    cache = null;
}