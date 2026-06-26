import { StyleSheet, ToastAndroid, View } from 'react-native';
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
import AuthService from '../../Services/Auth';

const ForgotPassword = () => {
    const colors = useTheme();
    const [email, setEmail] = useState<string>('');

    const handleForgotPassword = () => {
        AuthService.forgotPass(email)
            .then((result) => {
                // console.log("result", result)
                if (result.status === 'success') {
                    ToastAndroid.show(result.message, ToastAndroid.SHORT);
                    NavigationService.navigate('OtpVerification', { otp: result.otp, email });
                } else {
                    ToastAndroid.show(result.message, ToastAndroid.SHORT);
                }
            })
            .catch((error) => {
                // console.log("error", error)
                ToastAndroid.show(error.error, ToastAndroid.SHORT);
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
                value={email}
                onChangeText={(val) => setEmail(val)}
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
