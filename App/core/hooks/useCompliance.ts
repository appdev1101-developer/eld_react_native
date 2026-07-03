import moment from 'moment';
import { useCallback, useState } from 'react';
import { hosApi } from '../api/services/hosApi';
import { isLegacySuccess } from '../api/types/common';
import {
    ComplianceCachedData,
    HosLogDayRecord,
    getComplianceCache,
    invalidateComplianceCache,
    setComplianceCache
} from '../cache/complianceCache';
import { HOSChartData } from '../../Model/Dashboard';

const emptyChart: HOSChartData = {
    graph_data: [],
    violation_data: {
        Shift_data: [],
        total_shift_time: ''
    }
};

function splitHosLogData(logData: HosLogDayRecord[]) {
    const todayKey = moment().format('YYYY-MM-DD');
    const todayData =
        logData.find((item) => Object.keys(item).includes(todayKey)) ?? null;
    const hosData = logData.filter(
        (item) => !Object.keys(item).includes(todayKey)
    );
    return { todayData, hosData };
}

export function useCompliance() {
    const [todayData, setTodayData] = useState<HosLogDayRecord | null>(null);
    const [hosData, setHosData] = useState<HosLogDayRecord[]>([]);
    const [chartData, setChartData] = useState<HOSChartData>(emptyChart);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const applyCache = useCallback((cached: ComplianceCachedData) => {
        setTodayData(cached.todayData);
        setHosData(cached.hosData);
        setChartData(cached.chartData);
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

            const today = moment().format('YYYY-MM-DD');
            const fromDate = moment().subtract(7, 'days').format('YYYY-MM-DD');

            try {
                const [hosResult, chartResult] = await Promise.all([
                    hosApi.getHosDataLegacy(fromDate, today),
                    hosApi.getChartDataLegacy(today)
                ]);

                let nextToday: HosLogDayRecord | null = null;
                let nextHos: HosLogDayRecord[] = [];
                let nextChart = emptyChart;

                if (isLegacySuccess(hosResult) && Array.isArray(hosResult.log_data)) {
                    const split = splitHosLogData(
                        hosResult.log_data as HosLogDayRecord[]
                    );
                    nextToday = split.todayData;
                    nextHos = split.hosData;
                    setTodayData(nextToday);
                    setHosData(nextHos);
                }

                if (isLegacySuccess(chartResult) && chartResult.data) {
                    nextChart = chartResult.data as HOSChartData;
                    setChartData(nextChart);
                }

                const cached: ComplianceCachedData = {
                    todayData: nextToday,
                    hosData: nextHos,
                    chartData: nextChart,
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
        todayData,
        hosData,
        chartData,
        loading,
        refreshing,
        fetchCompliance,
        refresh,
        invalidate: invalidateComplianceCache
    };
}