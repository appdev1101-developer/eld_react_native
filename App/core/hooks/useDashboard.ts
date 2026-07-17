import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../Redux/store';
import { dashboardApi } from '../api/services/dashboardApi';
import { isSuccess } from '../api/types/common';
import { ApprovalRequestData, HosSummary } from '../api/types/dashboard';
import {
    getHomeCache,
    invalidateHomeCache,
    setHomeCache
} from '../cache/homeDataCache';
import {
    setDashboardBundle,
    setDashboardHos,
    setDashboardLoading,
    setDashboardRefreshing
} from '../../Redux/reducer/Dashboard';
import { setConfigData, setUserInfo } from '../../Redux/reducer/User';

export function formatHosTimes(hos: HosSummary | null) {
    const format = (value: string) => value.split(':').slice(0, 2).join(':');
    return {
        driveTime: format(hos?.timeLeftInDrive ?? '00:00'),
        shiftTime: format(hos?.timeLeftInShift ?? '00:00'),
        cycleTime: format(hos?.timeLeftInCycle ?? '00:00')
    };
}

export function useDashboard() {
    const dispatch = useDispatch();
    const dashboard = useSelector((state: RootState) => state.Dashboard);

    const applyBundle = useCallback(
        (bundle: {
            hos: HosSummary | null;
            unsignedLogCount: number;
            unsignedLogs: Array<unknown>;
            approvals: ApprovalRequestData;
            userInfo?: ReturnType<typeof setUserInfo> extends never ? never : unknown;
            config?: unknown;
        }) => {
            dispatch(
                setDashboardBundle({
                    hos: bundle.hos,
                    unsignedLogCount: bundle.unsignedLogCount,
                    unsignedLogs: bundle.unsignedLogs,
                    approvals: bundle.approvals
                })
            );
        },
        [dispatch]
    );

    const applyCache = useCallback(
        (cached: NonNullable<ReturnType<typeof getHomeCache>>) => {
            if (cached.userInfo) {
                dispatch(setUserInfo(cached.userInfo));
            }
            if (cached.config) {
                dispatch(setConfigData(cached.config));
            }
            applyBundle({
                hos: cached.hos,
                unsignedLogCount: cached.unsignedLogCount,
                unsignedLogs: cached.unsignedLogs ?? [],
                approvals: cached.approvals ?? {
                    coDriver: [],
                    addLog: [],
                    editLog: [],
                    reassignLog: [],
                    unidentifiedDriving: []
                }
            });
            dispatch(setDashboardLoading(false));
            return cached;
        },
        [applyBundle, dispatch]
    );

    const fetchDashboard = useCallback(
        async (options?: { showLoading?: boolean; force?: boolean }) => {
            const showLoading = options?.showLoading ?? false;
            const force = options?.force ?? false;

            if (!force) {
                const cached = getHomeCache();
                if (cached) {
                    return applyCache(cached);
                }
            }

            if (showLoading) {
                dispatch(setDashboardLoading(true));
            }

            try {
                //approvalData
                const [unsignedLogsRes, dashboardData, configData ] =
                    await Promise.all([
                        dashboardApi.getUnsignedLogs(),
                        dashboardApi.getData(),
                        //ToDo: Commented beacuse it is used for localization
                        //dashboardApi.getConfig(),
                        dashboardApi.getApprovalRequests()
                    ]);

                let nextUserInfo = null;
                let nextHos: HosSummary | null = null;
                let nextConfig = null;
                let unsignedLogCount = 0;
                let unsignedLogsList: Array<unknown> = [];
                let approvals: ApprovalRequestData = {
                    coDriver: [],
                    addLog: [],
                    editLog: [],
                    reassignLog: [],
                    unidentifiedDriving: []
                };

                if (isSuccess(unsignedLogsRes)) {
                    unsignedLogCount = unsignedLogsRes.data.length;
                    unsignedLogsList = unsignedLogsRes.data;
                }

                if (isSuccess(dashboardData)) {
                    nextUserInfo = dashboardData.data.userInfo;
                    nextHos = dashboardData.data.hos;
                    if (nextUserInfo) {
                        dispatch(setUserInfo(nextUserInfo));
                    }
                }

                if (isSuccess(configData)) {
                    nextConfig = configData.data;
                    dispatch(setConfigData(configData.data));
                }

                // if (isSuccess(approvalData)) {
                //     approvals = approvalData.data;
                // }

                setHomeCache({
                    userInfo: nextUserInfo,
                    hos: nextHos,
                    //config: nextConfig,
                    config: null,
                    unsignedLogCount,
                    unsignedLogs: unsignedLogsList,
                    approvals
                });

                applyBundle({
                    hos: nextHos,
                    unsignedLogCount,
                    unsignedLogs: unsignedLogsList,
                    approvals
                });

                return {
                    userInfo: nextUserInfo,
                    hos: nextHos,
                    config: nextConfig,
                    unsignedLogCount,
                    unsignedLogs: unsignedLogsList,
                    approvals
                };
            } catch (error) {
                if (__DEV__) {
                    console.warn('useDashboard fetch failed', error);
                }
                return null;
            } finally {
                dispatch(setDashboardLoading(false));
            }
        },
        [applyBundle, applyCache, dispatch]
    );

    const refresh = useCallback(async () => {
        dispatch(setDashboardRefreshing(true));
        invalidateHomeCache();
        await fetchDashboard({ force: true });
        dispatch(setDashboardRefreshing(false));
    }, [dispatch, fetchDashboard]);

    const refreshHos = useCallback(async () => {
        invalidateHomeCache();
        const result = await dashboardApi.getData();
        if (isSuccess(result)) {
            dispatch(setDashboardHos(result.data.hos));
            if (result.data.userInfo) {
                dispatch(setUserInfo(result.data.userInfo));
            }
            const cached = getHomeCache();
            if (cached) {
                setHomeCache({
                    ...cached,
                    hos: result.data.hos,
                    userInfo: result.data.userInfo
                });
            }
        }
    }, [dispatch]);

    return {
        hos: dashboard.hos,
        unsignedLogCount: dashboard.unsignedLogCount,
        unsignedLogs: dashboard.unsignedLogs,
        approvals: dashboard.approvals,
        loading: dashboard.loading,
        refreshing: dashboard.refreshing,
        hosTimes: formatHosTimes(dashboard.hos),
        fetchDashboard,
        refresh,
        refreshHos,
        invalidate: invalidateHomeCache
    };
}