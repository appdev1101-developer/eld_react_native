import { UserInfoDataType } from '../../../Model/User';
import { ConfigResponse } from '../../../Model/Dashboard';

export interface HosSummary {
    timeLeftInDrive: string;
    timeLeftInShift: string;
    timeLeftInCycle: string;
    timeLeftInBreak: string;
    latestLog: string;
    timeInCurrentStatus: string;
}

export interface DashboardData {
    userInfo: UserInfoDataType | null;
    hos: HosSummary;
}

export interface ApprovalRequestData {
    coDriver: Array<unknown>;
    addLog: Array<unknown>;
    editLog: Array<unknown>;
    reassignLog: Array<unknown>;
    unidentifiedDriving: Array<unknown>;
}

export type { ConfigResponse };