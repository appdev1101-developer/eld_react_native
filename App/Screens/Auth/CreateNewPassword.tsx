import { StyleSheet } from 'react-native';
import React, { useState } from 'react';
import { Container, Text } from 'react-native-basic-elements';
import AuthHeader from '../../Components/Headers/AuthHeader';
import { Button, EditField } from '../../Components/UI';
import { FONTS } from '../../Constants/Fonts';
import { moderateScale } from '../../Constants/PixelRatio';
import NavigationService from '../../Services/Navigation';
import { RouteProp } from '@react-navigation/native';
import { authApi } from '../../core/api/services/authApi';
import { isLegacySuccess } from '../../core/api/types/common';
import { requireOnline } from '../../core/network/requireOnline';
import { showError, showToast } from '../../Utils/toast';
import { getApiErrorMessage } from '../../Utils/apiErrorMessage';
import { firstInvalid, minLength, passwordsMatch, required } from '../../Utils/validators';
import { THEME } from '../../Constants/Theme';

type CreatePasswordRouteProp = RouteProp<{ params: { email: string } }, 'params'>;

const CreateNewPassword = ({ route }: { route: CreatePasswordRouteProp }) => {
    const { email } = route.params;
    const [password, setPassword] = useState<string>('');
    const [confirmPassword, setConfirmPassword] = useState<string>('');

    const handleChangePassword = () => {
        const validation = firstInvalid(
            required(password, 'Password'),
            minLength(password, 6, 'Password'),
            required(confirmPassword, 'Confirm password'),
            passwordsMatch(password, confirmPassword)
        );

        if (!validation.valid) {
            showError(validation.message);
            return;
        }

        if (!requireOnline()) {
            return;
        }

        authApi
            .resetPasswordLegacy(email, password, confirmPassword)
            .then((result) => {
                if (isLegacySuccess(result)) {
                    showToast(result.message ?? 'Password updated successfully');
                    NavigationService.navigate('PasswordChanged');
                } else {
                    showError(result.message ?? 'Failed to reset password');
                }
            })
            .catch((error) => {
                showError(getApiErrorMessage(error, 'Failed to reset password'));
            });
    };

    return (
        <Container>
            <AuthHeader />

            <Text style={styles.titleText}>Create new password</Text>

            <Text style={styles.subTitleText}>
                Your new password must be unique from those previously used.
            </Text>

            <EditField
                containerStyle={styles.fieldContainer}
                placeholder="New Password"
                showPasswordToggle
                value={password}
                onChangeText={setPassword}
            />

            <EditField
                containerStyle={styles.fieldContainer}
                placeholder="Confirm Password"
                showPasswordToggle
                value={confirmPassword}
                onChangeText={setConfirmPassword}
            />

            <Button
                title="Reset Password"
                variant="accent"
                size="lg"
                fullWidth
                style={styles.submitButton}
                onPress={handleChangePassword}
            />
        </Container>
    );
};

export default CreateNewPassword;

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
        fontSize: moderateScale(13),
        lineHeight: moderateScale(22)
    },
    fieldContainer: {
        marginHorizontal: moderateScale(22),
        marginTop: moderateScale(8)
    },
    submitButton: {
        marginHorizontal: moderateScale(22),
        marginVertical: moderateScale(20)
    }
});