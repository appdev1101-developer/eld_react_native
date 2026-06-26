import { StyleSheet, View } from 'react-native';
import React from 'react';
import { AppButton, Container, Text } from 'react-native-basic-elements';
import AppStatusBar from '../../Components/AppStatusBar';
import LottieView from 'lottie-react-native';
import { moderateScale } from '../../Constants/PixelRatio';
import { FONTS } from '../../Constants/Fonts';
import { useNavigation } from '@react-navigation/native';
import NavigationService from '../../Services/Navigation';

const PasswordChanged = () => {
    return (
        <Container
            style={{
                justifyContent: 'center',
                alignItems: 'center'
            }}
        >
            <AppStatusBar />
            <LottieView
                source={require('../../Assets/LottieJson/Success.json')}
                style={{
                    height: moderateScale(150),
                    width: moderateScale(150)
                }}
                autoPlay={true}
                loop={false}
            />

            <Text style={styles.titleText}>Password Changed!</Text>
            <Text style={styles.subTitleText}>
                Your password has been changed successfully.
            </Text>

            <AppButton
                title="Back to Login"
                textStyle={styles.btnTextStyle}
                style={{
                    height: moderateScale(40),
                    width: '90%',
                    marginTop: moderateScale(15)
                }}
                onPress={() => NavigationService.navigate('SignIn')}
            />
        </Container>
    );
};

export default PasswordChanged;

const styles = StyleSheet.create({
    btnTextStyle: {
        fontFamily: FONTS.ProductSans.regular,
        fontSize: moderateScale(12),
        color: '#fff'
    },
    titleText: {
        fontFamily: FONTS.ProductSans.regular,
        fontSize: moderateScale(20),
        marginVertical: moderateScale(12),
        lineHeight: moderateScale(35)
    },
    subTitleText: {
        fontFamily: FONTS.ProductSans.regular,
        marginHorizontal: '20%',
        color: '#8391A1',
        fontSize: moderateScale(14),
        lineHeight: moderateScale(20),
        textAlign: 'center'
    }
});
