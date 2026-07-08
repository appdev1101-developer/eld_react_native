import { TextStyle, ViewStyle } from 'react-native';
import { FONTS } from './Fonts';
import { moderateScale } from './PixelRatio';
import { THEME } from './Theme';

export type ButtonVariant =
    | 'primary'
    | 'secondary'
    | 'success'
    | 'accent'
    | 'outline'
    | 'outlineInverse'
    | 'ghost'
    | 'danger';

export type ButtonSize = 'sm' | 'md' | 'lg';

export type EditFieldVariant = 'filled' | 'outlined';

export type EditFieldSize = 'sm' | 'md' | 'lg';

export type CardVariant = 'elevated' | 'flat' | 'muted' | 'outlined' | 'inset';

export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

const BUTTON_HEIGHTS: Record<ButtonSize, number> = {
    sm: moderateScale(36),
    md: moderateScale(44),
    lg: moderateScale(48)
};

const BUTTON_FONT_SIZES: Record<ButtonSize, number> = {
    sm: moderateScale(12),
    md: moderateScale(14),
    lg: moderateScale(16)
};

const BUTTON_PADDING_HORIZONTAL: Record<ButtonSize, number> = {
    sm: moderateScale(14),
    md: moderateScale(18),
    lg: moderateScale(22)
};

const INPUT_HEIGHTS: Record<EditFieldSize, number> = {
    sm: moderateScale(40),
    md: moderateScale(45),
    lg: moderateScale(52)
};

const INPUT_FONT_SIZES: Record<EditFieldSize, number> = {
    sm: moderateScale(12),
    md: moderateScale(14),
    lg: moderateScale(16)
};

const CARD_PADDING: Record<CardPadding, number> = {
    none: 0,
    sm: moderateScale(10),
    md: moderateScale(14),
    lg: moderateScale(20)
};

type ButtonStyles = {
    container: ViewStyle;
    text: TextStyle;
    loaderColor: string;
};

export function getButtonStyles(
    variant: ButtonVariant,
    size: ButtonSize
): ButtonStyles {
    const baseContainer: ViewStyle = {
        height: BUTTON_HEIGHTS[size],
        paddingHorizontal: BUTTON_PADDING_HORIZONTAL[size],
        borderRadius: THEME.radius.sm,
        justifyContent: 'center',
        alignItems: 'center'
    };

    const baseText: TextStyle = {
        fontFamily: FONTS.ProductSans.bold,
        fontSize: BUTTON_FONT_SIZES[size]
    };

    const variants: Record<ButtonVariant, ButtonStyles> = {
        primary: {
            container: {
                ...baseContainer,
                backgroundColor: THEME.colors.primary
            },
            text: { ...baseText, color: THEME.colors.textOnDark },
            loaderColor: THEME.colors.textOnDark
        },
        secondary: {
            container: {
                ...baseContainer,
                backgroundColor: THEME.colors.primaryLight
            },
            text: { ...baseText, color: THEME.colors.textOnDark },
            loaderColor: THEME.colors.textOnDark
        },
        success: {
            container: {
                ...baseContainer,
                backgroundColor: THEME.colors.success
            },
            text: { ...baseText, color: THEME.colors.textOnDark },
            loaderColor: THEME.colors.textOnDark
        },
        accent: {
            container: {
                ...baseContainer,
                backgroundColor: THEME.colors.accentDark
            },
            text: { ...baseText, color: THEME.colors.textOnDark },
            loaderColor: THEME.colors.textOnDark
        },
        outline: {
            container: {
                ...baseContainer,
                backgroundColor: THEME.colors.surface,
                borderWidth: 1,
                borderColor: THEME.colors.border
            },
            text: { ...baseText, color: THEME.colors.textPrimary },
            loaderColor: THEME.colors.primary
        },
        outlineInverse: {
            container: {
                ...baseContainer,
                paddingHorizontal: moderateScale(16),
                borderRadius: THEME.radius.pill,
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.65)'
            },
            text: {
                ...baseText,
                fontFamily: FONTS.ProductSans.regular,
                color: THEME.colors.textOnDark
            },
            loaderColor: THEME.colors.textOnDark
        },
        ghost: {
            container: {
                ...baseContainer,
                backgroundColor: 'transparent'
            },
            text: { ...baseText, color: THEME.colors.primary },
            loaderColor: THEME.colors.primary
        },
        danger: {
            container: {
                ...baseContainer,
                backgroundColor: THEME.colors.error
            },
            text: { ...baseText, color: THEME.colors.textOnDark },
            loaderColor: THEME.colors.textOnDark
        }
    };

    return variants[variant];
}

type EditFieldStyles = {
    mainContainer: ViewStyle;
    inputContainer: ViewStyle;
    input: TextStyle;
    label: TextStyle;
    hint: TextStyle;
    error: TextStyle;
};

export function getEditFieldStyles(
    variant: EditFieldVariant,
    size: EditFieldSize,
    hasError: boolean
): EditFieldStyles {
    const height = INPUT_HEIGHTS[size];
    const fontSize = INPUT_FONT_SIZES[size];
    const borderColor = hasError ? THEME.colors.error : THEME.colors.border;

    const filledInputContainer: ViewStyle = {
        backgroundColor: THEME.colors.surfaceElevated,
        borderWidth: 1,
        borderColor,
        borderRadius: THEME.radius.sm,
        height,
        paddingHorizontal: moderateScale(12)
    };

    return {
        mainContainer: {
            marginTop: moderateScale(8),
            marginBottom: moderateScale(4)
        },
        inputContainer: variant === 'filled' ? filledInputContainer : {},
        input: {
            fontFamily: FONTS.ProductSans.regular,
            fontSize,
            color: THEME.colors.textPrimary
        },
        label: {
            fontFamily: FONTS.ProductSans.bold,
            fontSize: moderateScale(12),
            color: THEME.colors.textSecondary,
            marginBottom: moderateScale(6)
        },
        hint: {
            fontFamily: FONTS.ProductSans.regular,
            fontSize: moderateScale(11),
            color: THEME.colors.textMuted,
            marginTop: moderateScale(4)
        },
        error: {
            fontFamily: FONTS.ProductSans.regular,
            fontSize: moderateScale(11),
            color: THEME.colors.error,
            marginTop: moderateScale(4)
        }
    };
}

export function getOutlinedInputHeight(size: EditFieldSize): number {
    return INPUT_HEIGHTS[size];
}

type CardStyles = {
    container: ViewStyle;
};

export function getCardStyles(
    variant: CardVariant,
    padding: CardPadding
): CardStyles {
    const pad = CARD_PADDING[padding];

    const base: ViewStyle = {
        borderRadius: THEME.radius.md,
        padding: pad
    };

    const variants: Record<CardVariant, ViewStyle> = {
        elevated: {
            ...base,
            backgroundColor: THEME.colors.surface,
            borderWidth: 1,
            borderColor: THEME.colors.borderLight,
            ...THEME.shadow.card
        },
        flat: {
            ...base,
            backgroundColor: THEME.colors.surface
        },
        muted: {
            ...base,
            backgroundColor: THEME.colors.surfaceMuted
        },
        outlined: {
            ...base,
            backgroundColor: THEME.colors.surface,
            borderWidth: 1,
            borderColor: THEME.colors.border
        },
        inset: {
            ...base,
            backgroundColor: THEME.colors.surfaceMuted,
            borderRadius: THEME.radius.sm
        }
    };

    return { container: variants[variant] };
}