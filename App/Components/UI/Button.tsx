import React from 'react';
import { StyleSheet, TextStyle, ViewStyle } from 'react-native';
import { AppButton } from 'react-native-basic-elements';
import type { PropsOfIcon } from 'react-native-basic-elements/lib/Components/Icon';
import {
    ButtonSize,
    ButtonVariant,
    getButtonStyles
} from '../../Constants/ui';
import { THEME } from '../../Constants/Theme';

type ButtonIcon = PropsOfIcon & {
    position: 'left' | 'right';
};

type Props = {
    title: string;
    onPress?: () => void;
    variant?: ButtonVariant;
    size?: ButtonSize;
    fullWidth?: boolean;
    /** Applies standard screen horizontal inset. Set false when parent already has padding. */
    inset?: boolean;
    loading?: boolean;
    loadingTitle?: string;
    disabled?: boolean;
    muted?: boolean;
    style?: ViewStyle;
    textStyle?: TextStyle;
    buttonIcon?: ButtonIcon;
    shadow?: boolean;
};

const Button: React.FC<Props> = ({
    title,
    onPress,
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    inset = true,
    loading = false,
    loadingTitle,
    disabled = false,
    muted = false,
    style,
    textStyle,
    buttonIcon,
    shadow = false
}) => {
    const preset = getButtonStyles(variant, size);
    const isDisabled = disabled || loading;

    return (
        <AppButton
            title={loading ? (loadingTitle ?? title) : title}
            onPress={onPress}
            disabled={isDisabled}
            shadow={shadow}
            buttonIcon={buttonIcon}
            style={StyleSheet.flatten([
                preset.container,
                inset ? styles.inset : styles.noInset,
                fullWidth && styles.fullWidth,
                muted && styles.muted,
                isDisabled && styles.disabled,
                shadow && variant === 'primary' && THEME.shadow.card,
                style
            ])}
            textStyle={StyleSheet.flatten([preset.text, textStyle])}
            loader={
                loading
                    ? {
                          position: 'right',
                          size: 'small',
                          color: preset.loaderColor
                      }
                    : undefined
            }
        />
    );
};

export default Button;

const styles = StyleSheet.create({
    inset: {
        marginHorizontal: THEME.spacing.screen
    },
    noInset: {
        marginHorizontal: 0
    },
    fullWidth: {
        alignSelf: 'stretch'
    },
    muted: {
        opacity: 0.6
    },
    disabled: {
        opacity: 0.55
    }
});