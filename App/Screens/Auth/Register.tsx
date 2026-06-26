import { Image, StyleSheet, View } from 'react-native';
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

const Register = () => {
    const colors = useTheme();

    return (
        <Container>
            <AuthHeader />

            <Text style={styles.welcomeText}>
                Hello! Request Login from your Fleet Manager
            </Text>

            <AppTextInput
                mainContainerStyle={{ marginTop: moderateScale(10), marginBottom: 7.5 }}
                inputContainerStyle={styles.inputContainerStyle}
                inputStyle={{ ...styles.inputStyle, color: colors.primaryFontColor }}
                placeholder="Fleet Number"
                placeholderTextColor="#8391A1"
            />

            <AppTextInput
                mainContainerStyle={{ marginTop: moderateScale(10), marginBottom: 7.5 }}
                inputContainerStyle={styles.inputContainerStyle}
                inputStyle={{ ...styles.inputStyle, color: colors.primaryFontColor }}
                placeholder="Your Email"
                placeholderTextColor="#8391A1"
                keyboardType="email-address"
            />

            <AppTextInput
                mainContainerStyle={{ marginTop: moderateScale(10), marginBottom: 7.5 }}
                inputContainerStyle={styles.inputContainerStyle}
                inputStyle={{ ...styles.inputStyle, color: colors.primaryFontColor }}
                placeholder="Your License"
                placeholderTextColor="#8391A1"
            />

            <AppTextInput
                mainContainerStyle={{ marginTop: moderateScale(10), marginBottom: 7.5 }}
                inputContainerStyle={styles.inputContainerStyle}
                inputStyle={{ ...styles.inputStyle, color: colors.primaryFontColor }}
                placeholder="Confirm password"
                placeholderTextColor="#8391A1"
            />

            <AppButton
                title="Register"
                textStyle={styles.btnTextStyle}
                style={{
                    height: moderateScale(40),
                    marginVertical: moderateScale(15),
                    backgroundColor: '#FF5B00'
                }}
            />

            <View
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginHorizontal: 22,
                    marginVertical: moderateScale(19)
                }}
            >
                <View
                    style={{
                        flex: 1,
                        borderTopWidth: 1.5,
                        borderColor: '#E8ECF4'
                    }}
                />

                <Text
                    style={{
                        color: '#6A707C',
                        fontFamily: FONTS.ProductSans.regular,
                        fontSize: moderateScale(12),
                        marginHorizontal: 15
                    }}
                >
                    Or Register with
                </Text>

                <View
                    style={{
                        flex: 1,
                        borderTopWidth: 1.5,
                        borderColor: '#E8ECF4'
                    }}
                />
            </View>

            <View
                style={{
                    flexDirection: 'row',
                    marginHorizontal: 22,
                    gap: 15,
                    marginTop: 5
                }}
            >
                <View style={styles.socialBtnContainer}>
                    <Image
                        source={require('../../Assets/Icons/facebook.png')}
                        style={{
                            height: moderateScale(18),
                            width: moderateScale(18)
                        }}
                        resizeMode="contain"
                    />
                </View>

                <View style={styles.socialBtnContainer}>
                    <Image
                        source={require('../../Assets/Icons/google.png')}
                        style={{
                            height: moderateScale(18),
                            width: moderateScale(18)
                        }}
                        resizeMode="contain"
                    />
                </View>

                <View style={styles.socialBtnContainer}>
                    <Image
                        source={require('../../Assets/Icons/apple.png')}
                        style={{
                            height: moderateScale(18),
                            width: moderateScale(18)
                        }}
                        resizeMode="contain"
                    />
                </View>
            </View>

            <View
                style={{
                    flex: 1,
                    justifyContent: 'flex-end',
                    alignItems: 'center'
                }}
            >
                <Text style={styles.buttomText}>
                    Already have an account?{' '}
                    <Text
                        onPress={() => NavigationService.navigate('SignIn')}
                        style={{ color: '#35C2C1' }}
                    >
                        Login Now
                    </Text>
                </Text>
            </View>
        </Container>
    );
};

export default Register;

const styles = StyleSheet.create({
    welcomeText: {
        fontFamily: FONTS.ProductSans.regular,
        fontSize: moderateScale(20),
        marginLeft: 22,
        marginRight: 70,
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
        fontSize: 16,
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
    }
});
