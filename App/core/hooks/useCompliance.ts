import moment from 'moment';
import { useCallback, useState } from 'react';
import { hosApi } from '../api/services/hosApi';
import { isSuccess } from '../api/types/common';
import { HosDayRecord } from '../api/types/hosLog';
import {
    ComplianceCachedData,
    getComplianceCache,
    invalidateComplianceCache,
    setComplianceCache
} from '../cache/complianceCache';

// function splitHosLogData(records: HosDayRecord[]) {
//     const todayKey = moment().format('YYYY-MM-DD');
//     const todayRecord = records.find((record) => record.date === todayKey) ?? null;
//     const hosRecords = records.filter((record) => record.date !== todayKey);
//     return { todayRecord, hosRecords };
// }

export function useCompliance() {
    const [hosRecords, setHosRecords] = useState<HosDayRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const applyCache = useCallback((cached: ComplianceCachedData) => {
        setHosRecords(cached.hosRecords);
        setLoading(false);
    }, []);

    const fetchCompliance = useCallback(
        async (options?: { showLoading?: boolean; force?: boolean }) => {
            const showLoading = options?.showLoading ?? false;
            const force = options?.force ?? false;

            if (!force) {
                const cached = getComplianceCache();
                if (cached) {
                    applyCache(cached);
                    return cached;
                }
            }

            if (showLoading) {
                setLoading(true);
            }

            try {
                // Single call replaces the previous two (hos/mobile/data
                // for the 7-day list + hos/mobile/graph/data for today's
                // chart) — this endpoint already returns today as just the
                // most recent entry in the same array.
                const result = await hosApi.getLogData();

                if (isSuccess(result)) {
                    setHosRecords(result.data);
                }

                const cached: ComplianceCachedData = {
                    hosRecords: result.data,
                    fetchedAt: Date.now()
                };
                setComplianceCache(cached);
                return cached;
            } catch (error) {
                if (__DEV__) {
                    console.warn('useCompliance fetch failed', error);
                }
                return null;
            } finally {
                setLoading(false);
            }
        },
        [applyCache]
    );

    const refresh = useCallback(async () => {
        setRefreshing(true);
        invalidateComplianceCache();
        await fetchCompliance({ force: true });
        setRefreshing(false);
    }, [fetchCompliance]);

    return {
        hosRecords,
        loading,
        refreshing,
        fetchCompliance,
        refresh,
        invalidate: invalidateComplianceCache
    };
}