export type ApprovalRequestType =
    | 'coDriver'
    | 'addLog'
    | 'editLog'
    | 'reassignLog'
    | 'unidentifiedDriving';
export const API = {
    
    auth: {
        login: () => `user/mobile/login`,
        logout: (logSessionId: string | number) =>
            `user/mobile/logout/${encodeURIComponent(String(logSessionId))}`,
        forgotPassword: (email: string) => `forgot/mobile/password/${email}`,
        resetPassword: (email: string) => `reset/mobile/password/${email}`,
        fcmToken: () => `user/device/notify`
    },
    dashboard: {
        data: () => `new/dashboard/mobile/data/index`,
        //data: () => 'dashboard/mobile/data',
        // changeDutyStatus: (
        //     id: number,
        //     lat: number,
        //     lng: number,
        //     remark: string
        // ) =>
        //     `change/mobile/duty/status/${id}/${lat}/${lng}/${encodeURIComponent(remark)}`,
        changeDutyStatus: () =>
            `new/change/mobile/duty/status`,
        config: () => `config/data`,
        notifications: () => `user/data/notification`,
        approvals: () => `approval/mobile/request`,
        approvalAction: () =>
            `approval/mobile/request/data/log`
    },
    hos: {
        // data: (fromDate: string, toDate: string) =>
        //     `hos/mobile/data/${fromDate}/${toDate}`,
        // chart: (date: string) => `hos/mobile/graph/data/${date}`,
        logData: () => `hos/mobile/log/data`,
        unsignedLogs: () => `hos/log/unsigned`,
        certifyLog: (date: string) => `hos/log/unsigned/certify/${date}`,
        editActivity: () => `hos/form/edit/activity`,
        editDutyStatusLog: () =>
            `hos/mobile/graph/log/edit`
    },
    inspection: {
        createForm: () => `driver/mobile/inspection/create`,
        submit: () => `driver/mobile/inspection`,
        history: () => `driver/mobile/inspection`
    },
    safety: {
        data: (reason: string, from: string, to: string) =>
            `safety/data/${reason}/${from}/${to}`
    },
    settings: {
        updateAccount: () => `setting/mobile/account/edit`
    },
    mail: {
        send: (email: string) => `send/mail/${email}`
    },
    // Send logs
    diagnostics: {
        uploadLogs: () => `error/data/log`
    },
    messaging: {
        
        // load the users, groups and recent chat
        recentChats: () => `chat/data`,
        // upload chat image link
        uploadChatImage: () => `save/image/message`
    }
} as const;