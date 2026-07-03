import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
    ApprovalRequestData,
    HosSummary
} from '../../core/api/types/dashboard';

const emptyApprovals: ApprovalRequestData = {
    coDriver: [],
    addLog: [],
    editLog: [],
    reassignLog: [],
    unidentifiedDriving: []
};

export type DashboardReduxState = {
    hos: HosSummary | null;
    unsignedLogCount: number;
    unsignedLogs: Array<unknown>;
    approvals: ApprovalRequestData;
    loading: boolean;
    refreshing: boolean;
};

const initialState: DashboardReduxState = {
    hos: null,
    unsignedLogCount: 0,
    unsignedLogs: [],
    approvals: emptyApprovals,
    loading: true,
    refreshing: false
};

export const DashboardSlice = createSlice({
    name: 'dashboard',
    initialState,
    reducers: {
        setDashboardLoading(state, action: PayloadAction<boolean>) {
            state.loading = action.payload;
        },
        setDashboardRefreshing(state, action: PayloadAction<boolean>) {
            state.refreshing = action.payload;
        },
        setDashboardBundle(
            state,
            action: PayloadAction<{
                hos?: HosSummary | null;
                unsignedLogCount?: number;
                unsignedLogs?: Array<unknown>;
                approvals?: ApprovalRequestData;
            }>
        ) {
            if (action.payload.hos !== undefined) {
                state.hos = action.payload.hos;
            }
            if (action.payload.unsignedLogCount !== undefined) {
                state.unsignedLogCount = action.payload.unsignedLogCount;
            }
            if (action.payload.unsignedLogs !== undefined) {
                state.unsignedLogs = action.payload.unsignedLogs;
            }
            if (action.payload.approvals !== undefined) {
                state.approvals = action.payload.approvals;
            }
        },
        setDashboardHos(state, action: PayloadAction<HosSummary | null>) {
            state.hos = action.payload;
        },
        clearDashboard() {
            return initialState;
        }
    }
});

export const {
    setDashboardLoading,
    setDashboardRefreshing,
    setDashboardBundle,
    setDashboardHos,
    clearDashboard
} = DashboardSlice.actions;

export default DashboardSlice.reducer;