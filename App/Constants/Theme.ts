import { moderateScale } from './PixelRatio';

export const THEME = {
    colors: {
        primary: '#392969',
        primaryLight: '#7051CF',
        accent: '#FF9A62',
        accentDark: '#FF5B00',
        success: '#14AE5C',
        successSoft: '#00DDA3',
        warning: '#F5A841',
        error: '#EE4E34',
        textPrimary: '#1E232C',
        textSecondary: '#8E9093',
        textMuted: '#A5ACB8',
        textOnDark: '#FFFFFF',
        textAccent: '#B8C9F0',
        surface: '#FFFFFF',
        surfaceMuted: '#FAFAFC',
        surfaceElevated: '#F4F4F6',
        border: '#E8E8ED',
        borderLight: '#F0F2F5',
        offline: '#5C4B8A',
        badge: '#392969',
        badgeMuted: 'rgba(57, 41, 105, 0.12)'
    },
    gradient: {
        header: ['#392969', '#7051CF'] as const
    },
    status: {
        drive: '#72f575',
        onDuty: '#f5a841',
        sleeper: '#b8bcc4',
        offDuty: '#ee4e34',
        yard: '#eaf5a3',
        personal: '#acada5'
    },
    radius: {
        sm: moderateScale(12),
        md: moderateScale(16),
        lg: moderateScale(20),
        sheet: moderateScale(32),
        pill: moderateScale(999)
    },
    spacing: {
        screen: moderateScale(18),
        section: moderateScale(24),
        row: moderateScale(56)
    },
    shadow: {
        card: {
            shadowColor: '#392969',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.08,
            shadowRadius: 24,
            elevation: 4
        },
        fab: {
            shadowColor: '#392969',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 6
        }
    }
} as const;

export const GRADIENT_HEADER = [...THEME.gradient.header];
