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
import OTPInput from '../../Components/UI/OTPInput';
import { RouteProp } from '@react-navigation/native';

type OtpVerificationRouteProp = RouteProp<
    { params: { otp: string; email: string } },
    'params'
>;

const OtpVerification = ({ route }: { route: OtpVerificationRouteProp }) => {
    const { otp, email } = route.params;

    const [enteredOtp, setEnteredOtp] = useState<string>('');

    const handleVerifyOtp = () => {
        console.log('enteredOtp === otp', enteredOtp, otp);
        if (enteredOtp == otp) {
            NavigationService.navigate('CreateNewPassword', { email });
        } else {
            ToastAndroid.show('Invalid OTP', ToastAndroid.SHORT);
        }
    };

    return (
        <Container>
            <AuthHeader />

            <Text style={styles.titleText}>OTP Verification</Text>

            <Text style={styles.subTitleText}>
                Enter the verification code we just sent on your email address.
            </Text>

            <OTPInput
                value={enteredOtp}
                onChange={(value) => setEnteredOtp(value)}
                containerStyle={{
                    marginTop: moderateScale(25),
                    marginBottom: moderateScale(5),
                    marginHorizontal: 22
                }}
                style={{
                    height: moderateScale(45),
                    width: moderateScale(50)
                }}
                activeInputStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#35C2C1'
                }}
                inActiveInputStyle={{
                    backgroundColor: '#F7F8F9',
                    borderColor: '#E8ECF4'
                }}
            />

            <AppButton
                title="Verify"
                textStyle={styles.btnTextStyle}
                style={{ height: moderateScale(40), marginVertical: moderateScale(15) }}
                onPress={handleVerifyOtp}
            />

            <View
                style={{
                    flex: 1,
                    justifyContent: 'flex-end',
                    alignItems: 'center'
                }}
            >
                <Text style={styles.bottomText}>
                    Didn’t received code?{' '}
                    <Text
                        onPress={() => NavigationService.back()}
                        style={{ color: '#35C2C1' }}
                    >
                        Resend
                    </Text>
                </Text>
            </View>
        </Container>
    );
};

export default OtpVerification;

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
        fontSize: 19,
        lineHeight: 30
    },
    inputContainerStyle: {
        borderColor: '#E8ECF4',
        marginHorizontal: 22,
        height: moderateScale(40),
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
