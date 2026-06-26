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
import { RouteProp } from '@react-navigation/native';
import AuthService from '../../Services/Auth';

type CreatePasswordRouteProp = RouteProp<{ params: { email: string } }, 'params'>;

const CreateNewPassword = ({ route }: { route: CreatePasswordRouteProp }) => {
    const { email } = route.params;
    const colors = useTheme();
    const [password, setPassword] = useState<string>('');
    const [confirmPassword, setConfirmPassword] = useState<string>('');

    const handleChangePassword = () => {
        AuthService.changePassword(email, password, confirmPassword)
            .then((result) => {
                if (result.status === 'success') {
                    ToastAndroid.show(result.message, ToastAndroid.SHORT);
                    NavigationService.navigate('PasswordChanged');
                } else {
                    ToastAndroid.show(result.message, ToastAndroid.SHORT);
                }
            })
            .catch((error) => {
                ToastAndroid.show(error.error, ToastAndroid.SHORT);
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
