import { Image, StyleSheet, View, Modal } from 'react-native';
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
import { useSession } from '../../core/hooks/useSession';
import { requireOnline } from '../../core/network/requireOnline';
import { showError, showToast } from '../../Utils/toast';
import { getApiErrorMessage } from '../../Utils/apiErrorMessage';
import { email, firstInvalid, minLength, required } from '../../Utils/validators';

const SignIn = () => {
    const { login } = useSession();
    const colors = useTheme();

    const [emailValue, setEmailValue] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [showConflictModal, setShowConflictModal] = useState<boolean>(false);

    const [loginLoading, setLoginLoading] = useState<boolean>(false);
    const [forceLoginLoading, setForceLoginLoading] = useState<boolean>(false);

    const validateCredentials = (): boolean => {
        const result = firstInvalid(
            required(emailValue, 'Email'),
            email(emailValue),
            required(password, 'Password'),
            minLength(password, 4, 'Password')
        );

        if (!result.valid) {
            showError(result.message);
            return false;
        }

        return true;
    };

    const handleLogin = () => {
        if (!requireOnline() || !validateCredentials()) {
            return;
        }

        setLoginLoading(true);
        login({ email: emailValue.trim(), password })
            .then((result) => {
                if ('conflict' in result) {
                    setShowConflictModal(true);
                    return;
                }

                showToast(result.message);
            })
            .catch((error: unknown) => {
                showError(getApiErrorMessage(error, 'Login failed'));
            })
            .finally(() => setLoginLoading(false));
    };

    const handleForceLogin = async () => {
        if (!requireOnline() || !validateCredentials()) {
            return;
        }

        setForceLoginLoading(true);

        try {
            const result = await login({
                email: emailValue.trim(),
                password,
                force: 1
            });

            if ('conflict' in result) {
                showError('Unable to force login. Please try again.');
                setShowConflictModal(true);
                return;
            }

            if (result.success) {
                setShowConflictModal(false);
            }
            showToast(result.message || 'Login failed');
        } catch (error: unknown) {
            showError(getApiErrorMessage(error, 'Failed to force login'));
        } finally {
            setForceLoginLoading(false);
        }
    };

    return (
        <Container>
            <AuthHeader />

            <Text style={styles.welcomeText}>
                Welcome back!{'\n'}Glad to see you, Again!
            </Text>

            <AppTextInput
                mainContainerStyle={{
                    marginTop: moderateScale(10),
                    marginBottom: moderateScale(5)
                }}
                inputContainerStyle={styles.inputContainerStyle}
                inputStyle={{
                    ...styles.inputStyle,
                    color: colors.primaryFontColor
                }}
                placeholder="Enter your email"
                placeholderTextColor="#8391A1"
                keyboardType="email-address"
                value={emailValue}
                onChangeText={(text) => setEmailValue(text)}
            />

            <AppTextInput
                mainContainerStyle={{
                    marginTop: moderateScale(10),
                    marginBottom: moderateScale(5)
                }}
                inputContainerStyle={styles.inputContainerStyle}
                inputStyle={{
                    ...styles.inputStyle,
                    color: colors.primaryFontColor
                }}
                placeholder="Enter your password"
                placeholderTextColor="#8391A1"
                secureTextEntry={!showPassword}
                rightAction={
                    <Image
                        source={
                            !showPassword
                                ? require('../../Assets/Icons/eye.png')
                                : require('../../Assets/Icons/eye-off.png')
                        }
                        style={{
                            height: moderateScale(16),
                            width: moderateScale(16)
                        }}
                        tintColor="#6A707C"
                    />
                }
                onRightIconPress={() => setShowPassword((state) => !state)}
                value={password}
                onChangeText={(text) => setPassword(text)}
            />

            <Text
                onPress={() => NavigationService.navigate('ForgotPassword')}
                style={styles.forgotPassText}
            >
                Forgot Password?
            </Text>

            <AppButton
                title={loginLoading ? 'Logging in...' : 'Login'}
                textStyle={styles.btnTextStyle}
                style={{
                    height: moderateScale(40),
                    marginVertical: moderateScale(15)
                }}
                onPress={handleLogin}
                disabled={loginLoading}
                loader={
                    loginLoading
                        ? {
                              position: 'right',
                              size: 'small',
                              color: '#FFFFFF'
                          }
                        : undefined
                }
            />

            <Modal
                animationType="fade"
                transparent={true}
                visible={showConflictModal}
                onRequestClose={() => setShowConflictModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Already Logged In</Text>
                        <Text style={styles.modalMessage}>
                            Your account is already active on another device. Do you want
                            to force login and logout the other session?
                        </Text>

                        <View style={styles.modalButtonContainer}>
                            <AppButton
                                title="Cancel"
                                style={styles.cancelButton}
                                textStyle={styles.cancelButtonText}
                                onPress={() => setShowConflictModal(false)}
                            />
                            <AppButton
                                title={
                                    forceLoginLoading ? 'Logging in...' : 'Force Login'
                                }
                                style={styles.forceLoginButton}
                                textStyle={styles.forceLoginButtonText}
                                onPress={handleForceLogin}
                                disabled={forceLoginLoading}
                            />
                        </View>
                    </View>
                </View>
            </Modal>
        </Container>
    );
};

export default SignIn;

const styles = StyleSheet.create({
    welcomeText: {
        fontFamily: FONTS.ProductSans.bold,
        fontSize: moderateScale(24),
        color: '#1E232C',
        marginTop: moderateScale(20)
    },
    inputContainerStyle: {
        backgroundColor: '#F7F8F9',
        borderWidth: 1,
        borderColor: '#E8ECF4',
        borderRadius: moderateScale(8),
        height: moderateScale(45)
    },
    inputStyle: {
        fontFamily: FONTS.ProductSans.regular,
        fontSize: moderateScale(14)
    },
    forgotPassText: {
        fontFamily: FONTS.ProductSans.bold,
        fontSize: moderateScale(13),
        color: '#6A707C',
        alignSelf: 'flex-end',
        marginTop: moderateScale(10)
    },
    btnTextStyle: {
        fontFamily: FONTS.ProductSans.bold,
        fontSize: moderateScale(14)
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: moderateScale(20)
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderRadius: moderateScale(12),
        padding: moderateScale(20),
        width: '100%',
        maxWidth: moderateScale(320)
    },
    modalTitle: {
        fontFamily: FONTS.ProductSans.bold,
        fontSize: moderateScale(18),
        color: '#1E232C',
        marginBottom: moderateScale(10),
        textAlign: 'center'
    },
    modalMessage: {
        fontFamily: FONTS.ProductSans.regular,
        fontSize: moderateScale(14),
        color: '#6A707C',
        textAlign: 'center',
        marginBottom: moderateScale(20),
        lineHeight: moderateScale(20)
    },
    modalButtonContainer: {
        flexDirection: 'row',
        gap: moderateScale(10)
    },
    cancelButton: {
        flex: 1,
        backgroundColor: '#F7F8F9',
        height: moderateScale(40)
    },
    cancelButtonText: {
        color: '#6A707C',
        fontFamily: FONTS.ProductSans.bold
    },
    forceLoginButton: {
        flex: 1,
        backgroundColor: '#392969',
        height: moderateScale(40)
    },
    forceLoginButtonText: {
        color: '#FFFFFF',
        fontFamily: FONTS.ProductSans.bold
    }
});