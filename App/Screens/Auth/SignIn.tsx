import { StyleSheet, View, Modal } from 'react-native';
import React, { useState } from 'react';
import { Container, Text } from 'react-native-basic-elements';
import AuthHeader from '../../Components/Headers/AuthHeader';
import { Button, EditField } from '../../Components/UI';
import { FONTS } from '../../Constants/Fonts';
import { moderateScale } from '../../Constants/PixelRatio';
import NavigationService from '../../Services/Navigation';
import { useSession } from '../../core/hooks/useSession';
import { requireOnline } from '../../core/network/requireOnline';
import { showError, showToast } from '../../Utils/toast';
import { getApiErrorMessage } from '../../Utils/apiErrorMessage';
import { email, firstInvalid, minLength, required } from '../../Utils/validators';
import { THEME } from '../../Constants/Theme';

const SignIn = () => {
    const { login } = useSession();

    const [emailValue, setEmailValue] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [showConflictModal, setShowConflictModal] = useState<boolean>(false);

    const [loginLoading, setLoginLoading] = useState<boolean>(false);
    const [forceLoginLoading, setForceLoginLoading] = useState<boolean>(false);

    const validateCredentials = (): boolean => {
        const result = firstInvalid(
            required(emailValue, 'Email'),
            email(emailValue),
            required(password, 'Password'),
            minLength(password, 6 , 'Password')
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

            <EditField
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
                value={emailValue}
                onChangeText={setEmailValue}
            />

            <EditField
                placeholder="Enter your password"
                showPasswordToggle
                value={password}
                onChangeText={setPassword}
            />

            <Text
                onPress={() => NavigationService.navigate('ForgotPassword')}
                style={styles.forgotPassText}
            >
                Forgot Password?
            </Text>

            <Button
                title="Login"
                loadingTitle="Logging in..."
                loading={loginLoading}
                fullWidth
                style={styles.primaryButton}
                onPress={handleLogin}
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
                            <Button
                                title="Cancel"
                                variant="outline"
                                style={styles.modalActionButton}
                                onPress={() => setShowConflictModal(false)}
                            />
                            <Button
                                title="Force Login"
                                loadingTitle="Logging in..."
                                loading={forceLoginLoading}
                                style={styles.modalActionButton}
                                onPress={handleForceLogin}
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
        color: THEME.colors.textPrimary,
        marginTop: moderateScale(20),
        marginHorizontal: THEME.spacing.screen
    },
    forgotPassText: {
        fontFamily: FONTS.ProductSans.bold,
        fontSize: moderateScale(13),
        color: THEME.colors.textSecondary,
        alignSelf: 'flex-end',
        marginTop: moderateScale(10),
        marginRight: THEME.spacing.screen
    },
    primaryButton: {
        marginVertical: moderateScale(15)
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: moderateScale(20)
    },
    modalContent: {
        backgroundColor: THEME.colors.surface,
        borderRadius: THEME.radius.md,
        padding: moderateScale(20),
        width: '100%',
        maxWidth: moderateScale(320)
    },
    modalTitle: {
        fontFamily: FONTS.ProductSans.bold,
        fontSize: moderateScale(18),
        color: THEME.colors.textPrimary,
        marginBottom: moderateScale(10),
        textAlign: 'center'
    },
    modalMessage: {
        fontFamily: FONTS.ProductSans.regular,
        fontSize: moderateScale(14),
        color: THEME.colors.textSecondary,
        textAlign: 'center',
        marginBottom: moderateScale(20),
        lineHeight: moderateScale(20)
    },
    modalButtonContainer: {
        flexDirection: 'row',
        gap: moderateScale(10)
    },
    modalActionButton: {
        flex: 1
    }
});