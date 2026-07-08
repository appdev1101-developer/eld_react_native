import React, { useState } from 'react';
import {
    Image,
    StyleSheet,
    TextInputProps,
    TextStyle,
    View,
    ViewStyle
} from 'react-native';
import {
    AppTextInput,
    Text,
    useTheme
} from 'react-native-basic-elements';
import type { PropsOfIcon } from 'react-native-basic-elements/lib/Components/Icon';
import { moderateScale } from '../../Constants/PixelRatio';
import { THEME } from '../../Constants/Theme';
import {
    EditFieldSize,
    EditFieldVariant,
    getEditFieldStyles,
    getOutlinedInputHeight
} from '../../Constants/ui';

type Props = TextInputProps & {
    variant?: EditFieldVariant;
    size?: EditFieldSize;
    label?: string;
    hint?: string;
    error?: string;
    /** Applies standard screen horizontal inset. Set false when parent already has padding. */
    inset?: boolean;
    containerStyle?: ViewStyle;
    mainContainerStyle?: ViewStyle;
    inputContainerStyle?: ViewStyle;
    inputStyle?: TextStyle;
    showPasswordToggle?: boolean;
    leftIcon?: PropsOfIcon;
    rightAction?: React.ReactElement;
    onRightIconPress?: () => void;
};

const EditField: React.FC<Props> = ({
    variant = 'filled',
    size = 'md',
    label,
    hint,
    error,
    containerStyle,
    inset = true,
    showPasswordToggle = false,
    secureTextEntry,
    leftIcon,
    rightAction,
    onRightIconPress,
    placeholderTextColor = THEME.colors.textMuted,
    style,
    inputContainerStyle,
    inputStyle,
    mainContainerStyle,
    ...textInputProps
}) => {
    const colors = useTheme();
    const [showPassword, setShowPassword] = useState(false);
    const hasError = Boolean(error);
    const preset = getEditFieldStyles(variant, size, hasError);

    const passwordToggle = showPasswordToggle ? (
        <Image
            source={
                !showPassword
                    ? require('../../Assets/Icons/eye.png')
                    : require('../../Assets/Icons/eye-off.png')
            }
            style={styles.eyeIcon}
            tintColor={THEME.colors.textSecondary}
        />
    ) : undefined;

    const resolvedRightAction = rightAction ?? passwordToggle;
    const resolvedSecureEntry = showPasswordToggle
        ? !showPassword
        : secureTextEntry;

    const resolvedOnRightPress =
        onRightIconPress ??
        (showPasswordToggle ? () => setShowPassword((state) => !state) : undefined);

    return (
        <View
            style={StyleSheet.flatten([
                inset ? styles.inset : styles.noInset,
                containerStyle
            ])}
        >
            {label ? <Text style={preset.label}>{label}</Text> : null}

            {variant === 'outlined' ? (
                <AppTextInput.Outlined
                    {...textInputProps}
                    secureTextEntry={resolvedSecureEntry}
                    placeholderTextColor={placeholderTextColor}
                    activeBorderColor={
                        hasError ? THEME.colors.error : THEME.colors.primary
                    }
                    inactiveBorderColor={
                        hasError ? THEME.colors.error : THEME.colors.border
                    }
                    backgroundColor={THEME.colors.surface}
                    inputHeight={getOutlinedInputHeight(size)}
                    containerStyle={StyleSheet.flatten([
                        styles.outlinedContainer,
                        mainContainerStyle
                    ])}
                    inputStyle={StyleSheet.flatten([
                        preset.input,
                        { color: colors.primaryFontColor },
                        inputStyle
                    ])}
                    rightAction={resolvedRightAction}
                    onRightIconPress={resolvedOnRightPress}
                />
            ) : (
                <AppTextInput
                    {...textInputProps}
                    secureTextEntry={resolvedSecureEntry}
                    placeholderTextColor={placeholderTextColor}
                    leftIcon={leftIcon}
                    mainContainerStyle={StyleSheet.flatten([
                        preset.mainContainer,
                        mainContainerStyle
                    ])}
                    inputContainerStyle={StyleSheet.flatten([
                        preset.inputContainer,
                        inputContainerStyle
                    ])}
                    inputStyle={StyleSheet.flatten([
                        preset.input,
                        { color: colors.primaryFontColor },
                        inputStyle
                    ])}
                    rightAction={resolvedRightAction}
                    onRightIconPress={resolvedOnRightPress}
                />
            )}

            {error ? <Text style={preset.error}>{error}</Text> : null}
            {!error && hint ? <Text style={preset.hint}>{hint}</Text> : null}
        </View>
    );
};

export default EditField;

const styles = StyleSheet.create({
    inset: {
        marginHorizontal: THEME.spacing.screen
    },
    noInset: {
        marginHorizontal: 0
    },
    outlinedContainer: {
        marginTop: moderateScale(4),
        marginBottom: moderateScale(4)
    },
    eyeIcon: {
        height: moderateScale(16),
        width: moderateScale(16)
    }
});