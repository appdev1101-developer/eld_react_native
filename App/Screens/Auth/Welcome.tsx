import { Image, ImageBackground, StyleSheet, Text, View } from 'react-native';
import React from 'react';
import { AppButton, useTheme } from 'react-native-basic-elements';
import AppStatusBar from '../../Components/AppStatusBar';
import { moderateScale } from '../../Constants/PixelRatio';
import { FONTS } from '../../Constants/Fonts';
import NavigationService from '../../Services/Navigation';

const Welcome = () => {
    const colors = useTheme();
    return (
        <ImageBackground
            source={require('../../Assets/LandingBackground.png')}
            resizeMode="cover"
            style={styles.container}
        >
            <AppStatusBar />

            <Image
                source={require('../../Assets/logo-long.png')}
                style={{ marginBottom: 20, height: moderateScale(45), resizeMode: 'contain' }}
            />

            <AppButton
                title="Login"
                style={{ ...styles.btn, ...styles.loginBtn }}
                textStyle={{
                    color: '#FFFFFF',
                    fontFamily: FONTS.ProductSans.regular,
                    fontSize: moderateScale(12)
                }}
                onPress={() => NavigationService.navigate('SignIn')}
            />

            <AppButton
                title="Request login from your Fleet Manager"
                style={{ ...styles.btn, borderColor: colors.primaryFontColor }}
                textStyle={{
                    color: colors.primaryFontColor,
                    fontFamily: FONTS.ProductSans.regular,
                    fontSize: moderateScale(12)
                }}
            />

            {/* <Text style={[styles.buttomText, { color: colors.primaryFontColor }]}>
                Own a Trucking Fleet?{' '}
                <Text
                    onPress={() => NavigationService.navigate('Register')}
                    style={{ color: '#FF9A62' }}
                >
                    Register Now
                </Text>
            </Text> */}
        </ImageBackground>
    );
};

export default Welcome;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'flex-end',
        alignItems: 'center'
    },
    btn: {
        width: '90%',
        backgroundColor: '#fff',
        borderWidth: 1,
        height: moderateScale(45),
        marginBottom: moderateScale(45),
        marginTop: moderateScale(10)
    },
    loginBtn: {
        marginBottom: moderateScale(10),
        marginTop: moderateScale(45),
        borderWidth: 0,
        backgroundColor: '#00DDA3'
    },
    buttomText: {
        marginBottom: 30,
        fontFamily: FONTS.ProductSans.regular,
        fontSize: moderateScale(12)
    }
});
