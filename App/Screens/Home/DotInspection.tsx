import { StyleSheet, ToastAndroid, View } from 'react-native';
import React, { useState } from 'react';
import {
    AppButton,
    AppTextInput,
    Container,
    Icon,
    Text
} from 'react-native-basic-elements';
import LinearGradient from 'react-native-linear-gradient';
import AppStatusBar from '../../Components/AppStatusBar';
import HomeHeader from '../../Components/Headers/HomeHeader';
import { moderateScale } from '../../Constants/PixelRatio';
import { FONTS } from '../../Constants/Fonts';
import Modal from 'react-native-modal';
import DashboardService from '../../Services/Dashboard';
import LottieView from 'lottie-react-native';
const DotInspection = () => {
    const [dotInspectionModal, setDotInspectionModal] = useState<boolean>(false);
    const [dotInspectionMailId, setDotInspectionMailId] = useState<string>('');
    const [mailLoader, setMailLoader] = useState<boolean>(false);
    const [showVerifyModal, setShowVerifyModal] = useState<boolean>(false);
    const [verifySuccess, setVerifySuccess] = useState<boolean>(false);

    const sendMail = () => {
        if (dotInspectionMailId === '') {
            ToastAndroid.show('Email Id is Required', ToastAndroid.SHORT);
            return;
        }
        // setMailLoader(true);
        setVerifySuccess(false);
        setShowVerifyModal(true);
        DashboardService.sendMail(dotInspectionMailId)
            .then((result) => {
                if (result.status === 'success') {
                    setDotInspectionModal(false);
                    setDotInspectionMailId('');
                } else {
                    ToastAndroid.show(result.message, ToastAndroid.SHORT);
                }
            })
            .catch((error) => {
                console.log('error', error);
            })
            .finally(() => {
                // setMailLoader(false);
                setVerifySuccess(true);
                setTimeout(() => {
                    setShowVerifyModal(false);
                    setVerifySuccess(true);
                }, 1500);
            });
    };
    return (
        <Container>
            <AppStatusBar />

            <LinearGradient
                colors={['#392969', '#7051CF']}
                style={{ flex: 1 }}
            >
                <HomeHeader showBack />

                <View style={styles.bodyCard}>
                    <View style={styles.header}>
                        <Text style={styles.headerText}>DOT Inspection Mode</Text>
                    </View>

                    <View
                        style={{
                            paddingHorizontal: moderateScale(15),
                            paddingVertical: moderateScale(25),
                            alignItems: 'center',
                            borderBottomColor: '#C4C4C4',
                            borderBottomWidth: 1
                        }}
                    >
                        <AppButton
                            title="Begin Inspection"
                            style={{
                                backgroundColor: '#F3C522',
                                borderWidth: 1,
                                borderColor: '#B19359',
                                width: moderateScale(220)
                            }}
                            textStyle={{
                                color: '#FFFFFF',
                                fontFamily: FONTS.ProductSans.regular,
                                fontSize: moderateScale(18)
                            }}
                        />

                        <Text
                            style={{
                                color: '#33404F',
                                fontFamily: FONTS.ProductSans.regular,
                                fontSize: moderateScale(11),
                                marginTop: moderateScale(8),
                                opacity: 0.5
                            }}
                        >
                            Press and hold to set an access code
                        </Text>
                    </View>

                    <View
                        style={{
                            paddingHorizontal: moderateScale(15),
                            paddingVertical: moderateScale(25),
                            alignItems: 'center',
                            borderBottomColor: '#C4C4C4',
                            borderBottomWidth: 1
                        }}
                    >
                        <Text
                            style={{
                                color: '#33404F',
                                fontFamily: FONTS.ProductSans.bold,
                                fontSize: moderateScale(15)
                            }}
                        >
                            Send ELD Output File to DOT
                        </Text>
                        <Text
                            style={{
                                color: '#33404F',
                                fontFamily: FONTS.ProductSans.regular,
                                fontSize: moderateScale(11),
                                marginVertical: moderateScale(15),
                                textAlign: 'center',
                                opacity: 0.5
                            }}
                        >
                            Send your ELF Output File to the DOT if the officer requests
                            it
                        </Text>
                        <AppButton
                            title="Send Output File"
                            style={{
                                backgroundColor: '#F3C522',
                                borderWidth: 1,
                                borderColor: '#B19359',
                                width: moderateScale(220)
                            }}
                            textStyle={{
                                color: '#FFFFFF',
                                fontFamily: FONTS.ProductSans.regular,
                                fontSize: moderateScale(18)
                            }}
                            onPress={() => setDotInspectionModal(true)}
                        />
                    </View>

                    {/* <View
                        style={{
                            paddingHorizontal: moderateScale(15),
                            paddingVertical: moderateScale(25),
                            alignItems: 'center'
                        }}
                    >
                        <Text
                            style={{
                                color: '#33404F',
                                fontFamily: FONTS.ProductSans.bold,
                                fontSize: moderateScale(15)
                            }}
                        >
                            Send logs of previous 7 days + today
                        </Text>
                        <Text
                            style={{
                                color: '#33404F',
                                fontFamily: FONTS.ProductSans.regular,
                                fontSize: moderateScale(11),
                                marginVertical: moderateScale(15),
                                textAlign: 'center',
                                opacity: 0.5
                            }}
                        >
                            Email your logs to the officer if they request a paper copy of
                            your logs
                        </Text>
                        <AppButton
                            title="Send Logs"
                            style={{
                                backgroundColor: '#F3C522',
                                borderWidth: 1,
                                borderColor: '#B19359',
                                width: moderateScale(220)
                            }}
                            textStyle={{
                                color: '#FFFFFF',
                                fontFamily: FONTS.ProductSans.regular,
                                fontSize: moderateScale(18)
                            }}
                            onPress={() => setDotInspectionModal(true)}
                        />
                    </View> */}
                </View>
            </LinearGradient>

            <Modal
                isVisible={dotInspectionModal}
                style={{
                    margin: 0,
                    justifyContent: 'flex-end'
                }}
                onBackdropPress={() => setDotInspectionModal(false)}
                onBackButtonPress={() => setDotInspectionModal(false)}
            >
                <View
                    style={{
                        height: '60%',
                        backgroundColor: '#FAF0E6',
                        borderTopLeftRadius: moderateScale(30),
                        borderTopRightRadius: moderateScale(30),
                        paddingHorizontal: moderateScale(15),
                        paddingTop: moderateScale(25)
                    }}
                >
                    <AppTextInput
                        title="Enter DOT Officer email address"
                        titleStyle={{
                            color: '#363130',
                            fontFamily: FONTS.ProductSans.regular,
                            fontSize: moderateScale(15)
                        }}
                        inputContainerStyle={{
                            backgroundColor: '#FFFFFF',
                            borderRadius: moderateScale(40),
                            borderWidth: 0
                        }}
                        inputStyle={{
                            paddingHorizontal: moderateScale(20)
                        }}
                        placeholder="example@example.com"
                        value={dotInspectionMailId}
                        onChnageText={(val) => setDotInspectionMailId(val)}
                    />
                    <AppButton
                        title={mailLoader ? '' : 'SEND'}
                        textStyle={{
                            fontFamily: FONTS.ProductSans.bold,
                            fontSize: moderateScale(20),
                            color: '#FFFFFF'
                        }}
                        style={{
                            backgroundColor: '#392969',
                            alignSelf: 'center',
                            width: moderateScale(180),
                            borderRadius: moderateScale(40),
                            marginTop: moderateScale(20)
                        }}
                        // loader={
                        //     mailLoader
                        //         ? {
                        //               position: 'right',
                        //               size: 'small',
                        //               color: '#FFFFFF'
                        //           }
                        //         : undefined
                        // }
                        onPress={sendMail}
                        // disabled={mailLoader}
                    />
                </View>
            </Modal>

            <Modal
                isVisible={showVerifyModal}
                style={{
                    marginHorizontal: 0,
                    alignItems: 'center'
                }}
                animationIn="fadeIn"
                animationOut="fadeOut"
            >
                <View
                    style={{
                        height: moderateScale(230),
                        width: moderateScale(240),
                        backgroundColor: '#FFFFFF',
                        borderRadius: moderateScale(30),
                        justifyContent: 'center',
                        alignItems: 'center'
                    }}
                >
                    {verifySuccess ? (
                        <LottieView
                            source={require('../../Assets/LottieJson/Success.json')}
                            style={{
                                height: moderateScale(60),
                                width: moderateScale(60)
                            }}
                            autoPlay={true}
                            loop={false}
                        />
                    ) : (
                        <LottieView
                            source={require('../../Assets/LottieJson/Loading.json')}
                            style={{
                                height: moderateScale(60),
                                width: moderateScale(60)
                            }}
                            autoPlay={true}
                            loop={true}
                        />
                    )}

                    <Text
                        style={{
                            fontFamily: FONTS.ProductSans.regular,
                            fontSize: moderateScale(13),
                            marginTop: moderateScale(10)
                        }}
                    >
                        {verifySuccess ? 'Success' : 'Sending...'}
                    </Text>
                </View>
            </Modal>
        </Container>
    );
};

export default DotInspection;

const styles = StyleSheet.create({
    bodyCard: {
        backgroundColor: '#fff',
        paddingTop: moderateScale(20),
        flex: 1,
        zIndex: 1,
        borderTopRightRadius: moderateScale(40),
        borderTopLeftRadius: moderateScale(40)
    },
    header: {
        height: moderateScale(35),
        marginHorizontal: moderateScale(15),
        flexDirection: 'row'
    },
    headerText: {
        color: '#33404F',
        fontFamily: FONTS.ProductSans.regular,
        fontSize: moderateScale(17),
        marginLeft: moderateScale(10)
    }
});
