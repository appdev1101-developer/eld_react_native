import { Image, ImageBackground, StyleSheet, View } from 'react-native';
import React from 'react';
import AppStatusBar from '../../Components/AppStatusBar';
import { Button } from '../../Components/UI';
import { moderateScale } from '../../Constants/PixelRatio';
import { FONTS } from '../../Constants/Fonts';
import NavigationService from '../../Services/Navigation';
import { THEME } from '../../Constants/Theme';

const Welcome = () => {
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
                <Button
                    title="Login"
                    fullWidth
                    inset={false}
                    shadow
                    style={styles.loginBtn}
                    onPress={() => NavigationService.navigate('SignIn')}
                />

                <Button
                    title="Request login from your Fleet Manager"
                    variant="outline"
                    size="sm"
                    fullWidth
                    inset={false}
                    textStyle={styles.secondaryBtnText}
                    style={styles.secondaryBtn}
                />
            </View>
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
        paddingHorizontal: THEME.spacing.screen,
        alignItems: 'stretch',
        paddingBottom: moderateScale(40)
    },
    loginBtn: {
        marginBottom: moderateScale(12),
        marginTop: moderateScale(48)
    },
    secondaryBtn: {
        marginBottom: moderateScale(16)
    },
    secondaryBtnText: {
        fontFamily: FONTS.ProductSans.regular,
        fontSize: moderateScale(12),
        color: THEME.colors.textPrimary
    }
});