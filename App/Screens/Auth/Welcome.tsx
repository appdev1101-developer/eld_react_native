import { Image, ImageBackground, StyleSheet, View } from 'react-native';
import React from 'react';
import { AppButton, useTheme } from 'react-native-basic-elements';
import AppStatusBar from '../../Components/AppStatusBar';
import { moderateScale } from '../../Constants/PixelRatio';
import { FONTS } from '../../Constants/Fonts';
import NavigationService from '../../Services/Navigation';
import { THEME } from '../../Constants/Theme';

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
                style={styles.logo}
            />

            <View style={styles.buttonGroup}>
                <AppButton
                    title="Login"
                    style={{ ...styles.btn, ...styles.loginBtn }}
                    textStyle={styles.loginBtnText}
                    onPress={() => NavigationService.navigate('SignIn')}
                />

                <AppButton
                    title="Request login from your Fleet Manager"
                    style={{ ...styles.btn, ...styles.secondaryBtn, borderColor: colors.primaryFontColor }}
                    textStyle={{
                        color: colors.primaryFontColor,
                        fontFamily: FONTS.ProductSans.regular,
                        fontSize: moderateScale(12)
                    }}
                />
            </View>

            {/* <Text style={[styles.buttomText, { color: colors.primaryFontColor }]}>
                Own a Trucking Fleet?{' '}
                <Text
                    onPress={() => NavigationService.navigate('Register')}
                    style={{ color: THEME.colors.accent }}
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
    logo: {
        marginBottom: moderateScale(24),
        height: moderateScale(45),
        resizeMode: 'contain'
    },
    buttonGroup: {
        width: '100%',
        alignItems: 'center',
        paddingBottom: moderateScale(40)
    },
    btn: {
        width: '90%',
        backgroundColor: THEME.colors.surface,
        borderWidth: 1,
        height: moderateScale(48),
        borderRadius: THEME.radius.sm
    },
    loginBtn: {
        marginBottom: moderateScale(12),
        marginTop: moderateScale(48),
        borderWidth: 0,
        backgroundColor: THEME.colors.primary,
        ...THEME.shadow.card
    },
    loginBtnText: {
        color: THEME.colors.textOnDark,
        fontFamily: FONTS.ProductSans.bold,
        fontSize: moderateScale(14)
    },
    secondaryBtn: {
        marginBottom: moderateScale(16)
    },
    buttomText: {
        marginBottom: 30,
        fontFamily: FONTS.ProductSans.regular,
        fontSize: moderateScale(12)
    }
});