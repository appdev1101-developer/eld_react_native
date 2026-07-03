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
import { RouteProp } from '@react-navigation/native';
import { authApi } from '../../core/api/services/authApi';
import { isLegacySuccess } from '../../core/api/types/common';
import { requireOnline } from '../../core/network/requireOnline';
import { showError, showToast } from '../../Utils/toast';
import { getApiErrorMessage } from '../../Utils/apiErrorMessage';
import { firstInvalid, minLength, passwordsMatch, required } from '../../Utils/validators';

type CreatePasswordRouteProp = RouteProp<{ params: { email: string } }, 'params'>;

const CreateNewPassword = ({ route }: { route: CreatePasswordRouteProp }) => {
    const { email } = route.params;
    const colors = useTheme();
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

            <AppTextInput
                mainContainerStyle={{
                    marginTop: moderateScale(25),
                    marginBottom: moderateScale(5)
                }}
                inputContainerStyle={styles.inputContainerStyle}
                inputStyle={{ ...styles.inputStyle, color: colors.primaryFontColor }}
                placeholder="New Password"
                placeholderTextColor="#8391A1"
                value={password}
                onChangeText={(val) => setPassword(val)}
                secureTextEntry
            />

            <AppTextInput
                mainContainerStyle={{
                    marginTop: moderateScale(5),
                    marginBottom: moderateScale(25)
                }}
                inputContainerStyle={styles.inputContainerStyle}
                inputStyle={{ ...styles.inputStyle, color: colors.primaryFontColor }}
                placeholder="Confirm Password"
                placeholderTextColor="#8391A1"
                value={confirmPassword}
                onChangeText={(val) => setConfirmPassword(val)}
                secureTextEntry
            />

            <AppButton
                title="Reset Password"
                textStyle={styles.btnTextStyle}
                style={{
                    height: 56,
                    marginVertical: 20,
                    backgroundColor: '#FF5B00'
                }}
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
        marginHorizontal: 22,
        marginVertical: moderateScale(12),
        lineHeight: moderateScale(35)
    },
    subTitleText: {
        fontFamily: FONTS.ProductSans.regular,
        marginHorizontal: 22,
        color: '#8391A1',
        fontSize: moderateScale(13),
        lineHeight: moderateScale(22)
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
        fontSize: moderateScale(12),
        color: '#fff'
    },
    bottomText: {
        marginBottom: moderateScale(20),
        fontFamily: FONTS.ProductSans.regular,
        fontSize: moderateScale(12)
    }
});