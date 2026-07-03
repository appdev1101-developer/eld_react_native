export type ApprovalRequestType =
    | 'coDriver'
    | 'addLog'
    | 'editLog'
    | 'reassignLog'
    | 'unidentifiedDriving';

export const API = {
    auth: {
        login: () => 'user/mobile/login',
        forgotPassword: (email: string) => `forgot/mobile/password/${email}`,
        resetPassword: (email: string) => `reset/mobile/password/${email}`,
        fcmToken: () => 'user/mobile/fcm-token'
    },
    dashboard: {
        data: () => 'dashboard/mobile/data',
        changeDutyStatus: (
            id: number,
            lat: number,
            lng: number,
            remark: string
        ) =>
            `change/mobile/duty/status/${id}/${lat}/${lng}/${encodeURIComponent(remark)}`,
        config: () => 'config/data',
        notifications: () => 'user/data/notification',
        approvals: () => 'approval/mobile/request',
        approvalAction: (type: ApprovalRequestType, status: number) =>
            `approval/mobile/request/${type}/${status}`
    },
    hos: {
        data: (toDate: string, fromDate: string) =>
            `hos/mobile/data/${toDate}/${fromDate}`,
        chart: (date: string) => `hos/mobile/graph/data/${date}`,
        unsignedLogs: () => 'hos/log/unsigned',
        certifyLog: (date: string) => `hos/log/unsigned/certify/${date}`,
        editActivity: () => 'hos/form/edit/activity'
    },
    inspection: {
        createForm: () => 'driver/mobile/inspection/create',
        submit: () => 'driver/mobile/inspection',
        history: () => 'driver/mobile/inspection'
    },
    safety: {
        data: (reason: string, from: string, to: string) =>
            `safety/data/${reason}/${from}/${to}`
    },
    settings: {
        updateAccount: () => 'setting/mobile/account/edit'
    },
    mail: {
        send: (email: string) => `send/mail/${email}`
    }
} as const;