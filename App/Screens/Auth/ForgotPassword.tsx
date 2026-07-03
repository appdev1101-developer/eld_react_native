import { StyleSheet, View } from 'react-native';
import React, { useState } from 'react';
import {
    AppButton,
    AppTextInput,
    Container,
    Text,
    useTheme
} from 'react-native-basic-elements';
import AuthHeader from '../../Components/Headers/AuthHeader';
import { FONTS } from '../../Constants/Fonts';
import { moderateScale } from '../../Constants/PixelRatio';
import NavigationService from '../../Services/Navigation';
import { authApi } from '../../core/api/services/authApi';
import { isLegacySuccess } from '../../core/api/types/common';
import { requireOnline } from '../../core/network/requireOnline';
import { showError, showToast } from '../../Utils/toast';
import { getApiErrorMessage } from '../../Utils/apiErrorMessage';
import { email } from '../../Utils/validators';

const ForgotPassword = () => {
    const colors = useTheme();
    const [emailValue, setEmailValue] = useState<string>('');

    const handleForgotPassword = () => {
        const emailValidation = email(emailValue);
        if (!emailValidation.valid) {
            showError(emailValidation.message);
            return;
        }

        if (!requireOnline()) {
            return;
        }

        authApi
            .forgotPasswordLegacy(emailValue.trim())
            .then((result) => {
                if (isLegacySuccess(result)) {
                    showToast(result.message ?? 'Verification code sent');
                    NavigationService.navigate('OtpVerification', {
                        otp: result.otp,
                        email: emailValue.trim()
                    });
                } else {
                    showError(result.message ?? 'Failed to send verification code');
                }
            })
            .catch((error) => {
                showError(getApiErrorMessage(error, 'Failed to send verification code'));
            });
    };

    return (
        <Container>
            <AuthHeader />

            <Text style={styles.titleText}>Forgot Password?</Text>

            <Text style={styles.subTitleText}>
                Don't worry! It occurs. Please enter the email address linked with your
                account.
            </Text>

            <AppTextInput
                mainContainerStyle={{
                    marginTop: moderateScale(26),
                    marginBottom: moderateScale(5)
                }}
                inputContainerStyle={styles.inputContainerStyle}
                inputStyle={{ ...styles.inputStyle, color: colors.primaryFontColor }}
                placeholder="Enter your email"
                placeholderTextColor="#8391A1"
                keyboardType="email-address"
                value={emailValue}
                onChangeText={(val) => setEmailValue(val)}
            />

            <AppButton
                title="Send Code"
                textStyle={styles.btnTextStyle}
                style={{ height: moderateScale(40), marginVertical: moderateScale(15) }}
                onPress={handleForgotPassword}
            />

            <View
                style={{
                    flex: 1,
                    justifyContent: 'flex-end',
                    alignItems: 'center'
                }}
            >
                <Text style={styles.bottomText}>
                    Remember Password?{' '}
                    <Text
                        onPress={() => NavigationService.back()}
                        style={{ color: '#35C2C1' }}
                    >
                        Login
                    </Text>
                </Text>
            </View>
        </Container>
    );
};

export default ForgotPassword;

const styles = StyleSheet.create({
    titleText: {
        fontFamily: FONTS.ProductSans.regular,
        fontSize: moderateScale(20),
        marginHorizontal: 22,
        marginVertical: moderateScale(12),
        lineHeight: moderateScale(35)
    },
    subTitleText: {
        fontFamily: FONTS.ProductSans.regular,
        marginHorizontal: 22,
        color: '#8391A1',
        fontSize: moderateScale(14),
        lineHeight: moderateScale(23)
    },
    inputContainerStyle: {
        borderColor: '#E8ECF4',
        marginHorizontal: 22,
        height: moderateScale(45),
        backgroundColor: '#F7F8F9'
    },
    inputStyle: {
        paddingLeft: 20,
        fontFamily: FONTS.ProductSans.regular,
        fontSize: moderateScale(11)
    },
    btnTextStyle: {
        fontFamily: FONTS.ProductSans.regular,
        fontSize: moderateScale(13),
        color: '#fff'
    },
    bottomText: {
        marginBottom: moderateScale(20),
        fontFamily: FONTS.ProductSans.regular,
        fontSize: moderateScale(12)
    }
});