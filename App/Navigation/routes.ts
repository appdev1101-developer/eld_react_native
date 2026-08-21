export const ROUTES = {
  ROOT: {
    AUTH: 'Auth',
    APP: 'App',
  },

  AUTH: {
    WELCOME: 'Welcome',
    SIGN_IN: 'SignIn',
    REGISTER: 'Register',
    FORGOT_PASSWORD: 'ForgotPassword',
    OTP_VERIFICATION: 'OtpVerification',
    CREATE_NEW_PASSWORD: 'CreateNewPassword',
    PASSWORD_CHANGED: 'PasswordChanged',
  },

  TAB: {
    HOME: 'HomeTab',
    MESSAGES: 'MessagesTab',
    COMPLIANCE: 'ComplianceTab',
    NOTIFICATION: 'NotificationTab',
    PROFILE: 'ProfileTab',
  },

  MESSAGE: {
    RECENT_CHATS: 'RecentChats',
    CHAT_THREAD: 'ChatThread',
    GROUP_INFO: 'GroupInfo',
    GROUP_MEDIA: 'GroupMedia',
  },
} as const;