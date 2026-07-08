import { StyleSheet, View } from 'react-native';
import React, { useState } from 'react';
import { Container, Text } from 'react-native-basic-elements';
import AuthHeader from '../../Components/Headers/AuthHeader';
import { Button, EditField } from '../../Components/UI';
import { FONTS } from '../../Constants/Fonts';
import { moderateScale } from '../../Constants/PixelRatio';
import NavigationService from '../../Services/Navigation';
import { authApi } from '../../core/api/services/authApi';
import { isLegacySuccess } from '../../core/api/types/common';
import { requireOnline } from '../../core/network/requireOnline';
import { showError, showToast } from '../../Utils/toast';
import { getApiErrorMessage } from '../../Utils/apiErrorMessage';
import { email } from '../../Utils/validators';
import { THEME } from '../../Constants/Theme';

const ForgotPassword = () => {
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

            <EditField
                containerStyle={styles.fieldContainer}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
                value={emailValue}
                onChangeText={setEmailValue}
            />

            <Button
                title="Send Code"
                fullWidth
                style={styles.submitButton}
                onPress={handleForgotPassword}
            />

            <View style={styles.bottomContainer}>
                <Text style={styles.bottomText}>
                    Remember Password?{' '}
                    <Text
                        onPress={() => NavigationService.back()}
                        style={styles.loginLink}
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
        marginHorizontal: moderateScale(22),
        marginVertical: moderateScale(12),
        lineHeight: moderateScale(35),
        color: THEME.colors.textPrimary
    },
    subTitleText: {
        fontFamily: FONTS.ProductSans.regular,
        marginHorizontal: moderateScale(22),
        color: THEME.colors.textSecondary,
        fontSize: moderateScale(14),
        lineHeight: moderateScale(23)
    },
    fieldContainer: {
        marginHorizontal: moderateScale(22),
        marginTop: moderateScale(18)
    },
    submitButton: {
        marginHorizontal: moderateScale(22),
        marginVertical: moderateScale(15)
    },
    bottomContainer: {
        flex: 1,
        justifyContent: 'flex-end',
        alignItems: 'center'
    },
    bottomText: {
        marginBottom: moderateScale(20),
        fontFamily: FONTS.ProductSans.regular,
        fontSize: moderateScale(12),
        color: THEME.colors.textSecondary
    },
    loginLink: {
        color: THEME.colors.successSoft
    }
});