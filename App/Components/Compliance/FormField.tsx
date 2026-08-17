import React from 'react';
import { StyleProp, StyleSheet, TextStyle, ViewStyle } from 'react-native';
import { AppTextInput } from 'react-native-basic-elements';
import { moderateScale } from '../../Constants/PixelRatio';
import { FONTS } from '../../Constants/Fonts';

export interface FormFieldProps {
    title: string;
    value: string;
    onChangeText: (value: string) => void;
    containerStyle?: StyleProp<ViewStyle>;
    inputStyle?: StyleProp<TextStyle>;
    editable?: boolean;
    keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
    placeholder?: string;
}

const FormField: React.FC<FormFieldProps> = ({
    title,
    value,
    onChangeText,
    containerStyle,
    inputStyle,
    editable = true,
    keyboardType = 'default',
    placeholder
}) => {
    return (
        <AppTextInput
            title={title}
            value={value}
            onChangeText={onChangeText}
            editable={editable}
            keyboardType={keyboardType}
            placeholder={placeholder}
            titleStyle={styles.title}
            inputContainerStyle={styles.inputContainer}
            inputStyle={[styles.input, inputStyle]}
            mainContainerStyle={[styles.container, containerStyle]}
        />
    );
};

const styles = StyleSheet.create({
    container: {
        marginHorizontal: moderateScale(10),
        marginTop: moderateScale(8)
    },
    title: {
        marginBottom: 0,
        color: '#33404F',
        fontFamily: FONTS.ProductSans.regular,
        fontSize: moderateScale(14)
    },
    inputContainer: {
        borderWidth: 0,
        marginTop: 0
    },
    input: {
        minHeight: moderateScale(30),
        color: '#33404F',
        fontFamily: FONTS.ProductSans.regular,
        fontSize: moderateScale(14)
    }
});

export default React.memo(FormField);
