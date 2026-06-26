import { Image, StyleSheet, ToastAndroid, View, Modal, Alert } from 'react-native';
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
import { useDispatch } from 'react-redux';
import { setUser } from '../../Redux/reducer/User';
import AuthService from '../../Services/Auth';
import { UserDataType } from '../../Model/User';

const SignIn = () => {
    const dispatch = useDispatch();
    const colors = useTheme();

    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [showConflictModal, setShowConflictModal] = useState<boolean>(false);
    const [conflictData, setConflictData] = useState<any>(null);
    const [loginLoading, setLoginLoading] = useState<boolean>(false);
    const [forceLoginLoading, setForceLoginLoading] = useState<boolean>(false);

    const handleLogin = () => {
        setLoginLoading(true);
        AuthService.login({ email, password })
            .then(async (result) => {
                // Check if this is a 409 conflict (already logged in)
                if (result && result.multiauth === true) {
                    setConflictData(result);
                    setShowConflictModal(true);
                    return;
                }

                if (result && result.status === 'success') {
                    await AuthService.setToken(result.token);
                    await AuthService.setAccount(result.user_info);
                    dispatch(setUser(result.user_info));
                    ToastAndroid.show(result.message, ToastAndroid.SHORT);
                } else {
                    ToastAndroid.show(result.message, ToastAndroid.SHORT);
                }
            })
            .catch(async (error) => {
                console.log('error', error);

                // Initialize force logout service in case of login error
                // try {
                //     const forceLogoutService = ForceLogoutService.getInstance();

                //     // Check if we have user data from a previous session
                //     const storedUserData = await AuthService.getAccount();
                //     const storedToken = await AuthService.getToken();

                //     console.log("fuck", storedUserData, storedUserData.id, storedToken)

                //     if (storedUserData && storedUserData.id && storedToken) {
                //         await forceLogoutService.initialize({
                //             userId: storedUserData.id.toString(),
                //             accessToken: storedToken,
                //             onForceLogout: () => {
                //                 // Handle force logout
                //                 console.log('Force logout triggered from login error');
                //                 AuthService.logout();
                //                 NavigationService.navigate('SignIn');
                //                 ToastAndroid.show('You have been logged out from another device', ToastAndroid.LONG);
                //             }
                //         });
                //     }
                // } catch (forceLogoutError) {
                //     console.log('Error initializing force logout service:', forceLogoutError);
                // }

                ToastAndroid.show(
                    typeof error.message === 'object'
                        ? 'Invalid Login'
                        : error.message || 'Login failed',
                    ToastAndroid.SHORT
                );
            })
            .finally(() => setLoginLoading(false));
    };

    const handleForceLogin = async () => {
        setForceLoginLoading(true);

        try {
            // Call login API with force flag
            const result = await AuthService.login({
                email,
                password,
                force: 1
            });

            // Check if this is still a conflict even with force flag
            if (result && result.multiauth === true) {
                ToastAndroid.show(
                    'Unable to force login. Please try again.',
                    ToastAndroid.SHORT
                );
                setShowConflictModal(true);
                return;
            }

            if (result && result.success === true) {
                console.log('result', result);
                setShowConflictModal(false);
                const userData = {
                    id: result.user_id,
                    master_id: result.master_id,
                    ...result.user_info
                };
                await AuthService.setToken(result.token);
                await AuthService.setAccount(userData);
                dispatch(setUser(userData as UserDataType));
                ToastAndroid.show('Successfully logged in', ToastAndroid.SHORT);
            } else {
                ToastAndroid.show(result.message || 'Login failed', ToastAndroid.SHORT);
            }
        } catch (error: any) {
            console.log('Force login error', error);
            ToastAndroid.show(
                typeof error.message === 'object'
                    ? 'Force login failed'
                    : error.message || 'Failed to force login',
                ToastAndroid.SHORT
            );
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
                value={email}
                onChangeText={(text) => setEmail(text)}
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

            {/* </View>

            {/* Conflict Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={showConflictModal}
                onRequestClose={() => setShowConflictModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <Text style={styles.modalTitle}>Already Logged In</Text>
                        <Text style={styles.modalMessage}>
                            You are already logged in on another device. Do you want to
                            login here?
                        </Text>

                        <View style={styles.modalButtonContainer}>
                            <AppButton
                                title="No"
                                style={{
                                    ...styles.modalButton,
                                    ...styles.cancelButton
                                }}
                                textStyle={{
                                    ...styles.btnTextStyle,
                                    color: '#6A707C'
                                }}
                                onPress={() => setShowConflictModal(false)}
                                disabled={forceLoginLoading}
                            />
                            <AppButton
                                title={forceLoginLoading ? 'Logging in...' : 'Yes'}
                                style={{
                                    ...styles.modalButton,
                                    ...styles.confirmButton
                                }}
                                textStyle={styles.btnTextStyle}
                                onPress={handleForceLogin}
                                disabled={forceLoginLoading}
                                loader={
                                    forceLoginLoading
                                        ? {
                                              position: 'right',
                                              size: 'small',
                                              color: '#FFFFFF'
                                          }
                                        : undefined
                                }
                            />
                        </View>
                    </View>
                </View>
            </Modal>

            {/* <View
                style={{
                    flex: 1,
                    justifyContent: 'flex-end',
                    alignItems: 'center'
                }}
            >
                <Text style={styles.buttomText}>
                    Don't have an account?{' '}
                    <Text
                        onPress={() => NavigationService.navigate('Register')}
                        style={{ color: '#35C2C1' }}
                    >
                        Register Now
                    </Text>
                </Text>
            </View> */}
        </Container>
    );
};

export default SignIn;

const styles = StyleSheet.create({
    welcomeText: {
        fontFamily: FONTS.ProductSans.regular,
        fontSize: moderateScale(20),
        marginHorizontal: 22,
        marginVertical: moderateScale(12),
        lineHeight: moderateScale(35)
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
    forgotPassText: {
        fontFamily: FONTS.ProductSans.regular,
        fontSize: moderateScale(12),
        color: '#6A707C',
        marginHorizontal: 22,
        textAlign: 'right',
        marginVertical: 10
    },
    btnTextStyle: {
        fontFamily: FONTS.ProductSans.regular,
        fontSize: 17,
        color: '#fff'
    },
    socialBtnContainer: {
        borderWidth: 1,
        borderColor: '#E8ECF4',
        height: moderateScale(45),
        flex: 1,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center'
    },
    buttomText: {
        marginBottom: moderateScale(20),
        fontFamily: FONTS.ProductSans.regular,
        fontSize: moderateScale(12)
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    modalContainer: {
        backgroundColor: 'white',
        borderRadius: 15,
        padding: 25,
        marginHorizontal: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5
    },
    modalTitle: {
        fontSize: moderateScale(18),
        fontFamily: FONTS.ProductSans.regular,
        textAlign: 'center',
        marginBottom: 15,
        color: '#333'
    },
    modalMessage: {
        fontSize: moderateScale(14),
        fontFamily: FONTS.ProductSans.regular,
        textAlign: 'center',
        color: '#666',
        lineHeight: moderateScale(22),
        marginBottom: 25
    },
    modalButtonContainer: {
        flexDirection: 'row',
        gap: 10
    },
    modalButton: {
        flex: 1,
        height: moderateScale(40),
        borderRadius: 8
    },
    cancelButton: {
        backgroundColor: '#F7F8F9',
        borderWidth: 1,
        borderColor: '#E8ECF4'
    },
    confirmButton: {
        backgroundColor: '#35C2C1'
    }
});
