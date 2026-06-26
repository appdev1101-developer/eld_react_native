import {
    ActivityIndicator,
    FlatList,
    Image,
    Pressable,
    StyleSheet,
    ToastAndroid,
    View
} from 'react-native';
import React, { useEffect, useRef, useState } from 'react';
import { CheckBox, Container, Icon, Text } from 'react-native-basic-elements';
import AppStatusBar from '../../Components/AppStatusBar';
import LinearGradient from 'react-native-linear-gradient';
import HomeHeader from '../../Components/Headers/HomeHeader';
import { moderateScale } from '../../Constants/PixelRatio';
import { FONTS } from '../../Constants/Fonts';
import moment from 'moment';
import DashboardService from '../../Services/Dashboard';
import Modal from 'react-native-modal';
import SignatureScreen, { SignatureViewRef } from 'react-native-signature-canvas';
import AuthService from '../../Services/Auth';

const UnsignedLog = () => {
    const ref = useRef<SignatureViewRef>(null);
    const [allUnsignedLogs, setAllUnsignedLogs] = useState<Array<any>>([]);
    const [showSigModal, setShowSigModal] = useState<boolean>(false);
    const [selectedLogId, setSelectedLogId] = useState<number | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        getAllUnsignedLog();
    }, []);

    const getAllUnsignedLog = () => {
        DashboardService.getAllUnsignedLog()
            .then((result) => {
                if (result.status === 'success') {
                    setAllUnsignedLogs(result.data);
                }
            })
            .catch((error) => console.log('error', error))
            .finally(() => {
                setLoading(false);
            });
    };

    const uploadImage = async (base64String: string) => {
        let token = await AuthService.getToken();
        const mimeTypeMatch = base64String.match(/data:(.*);base64/);
        if (!mimeTypeMatch) {
            console.error('Invalid Base64 format');
            return;
        }

        const mimeType = mimeTypeMatch[1]; // Extract MIME type
        const base64Data = base64String.split(',')[1]; // Extract the Base64 data

        const formData = new FormData();
        formData.append('signature', {
            uri: `data:${mimeType};base64,${base64Data}`,
            name: `signature.${mimeType.split('/')[1]}`, // e.g., image.jpeg
            type: mimeType
        } as any); // `as any` is needed because FormData types in RN may conflict

        formData.append('id', selectedLogId);
        const xhr = new XMLHttpRequest();
        xhr.open('POST', 'https://uat.apnatelelink.us/mobileAPI/hos/log/unsigned', true);
        xhr.setRequestHeader('Accept', '*/*');
        xhr.setRequestHeader('Content-Type', 'multipart/form-data');
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);

        xhr.onload = () => {
            if (xhr.status === 200) {
                ToastAndroid.show(
                    JSON.parse(xhr.responseText).message,
                    ToastAndroid.SHORT
                );
                setShowSigModal(false);
                setSelectedLogId(null);
                getAllUnsignedLog();
            } else {
                ToastAndroid.show(
                    JSON.parse(xhr.responseText).message,
                    ToastAndroid.SHORT
                );
            }
        };

        xhr.onerror = (error) => {
            console.log('error', error);
            console.error('Network error:', error);
        };

        xhr.send(formData);
    };

    if (loading) {
        return (
            <View
                style={{
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'center'
                }}
            >
                <ActivityIndicator
                    size={'large'}
                    color={'#392969'}
                />
            </View>
        );
    }
    
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
                        <Text style={styles.headerText}>Unassigned Logs</Text>
                    </View>

                    {allUnsignedLogs.length > 0 ? (
                        <FlatList
                            data={allUnsignedLogs}
                            keyExtractor={(item, index) => index.toString()}
                            renderItem={({ item }) => {
                                return (
                                    <Pressable
                                        style={{
                                            marginHorizontal: moderateScale(15),
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            // marginBottom: moderateScale(10),
                                            // marginTop: moderateScale(15),
                                            height: moderateScale(55)
                                        }}
                                        onPress={() => {
                                            setShowSigModal(true);
                                            setSelectedLogId(item.id);
                                        }}
                                    >
                                        <CheckBox
                                            size={moderateScale(18)}
                                            containerStyle={{
                                                borderWidth: 0.8
                                            }}
                                        />
                                        <View
                                            style={{
                                                flex: 1,
                                                marginLeft: moderateScale(15)
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    color: '#33404F',
                                                    fontFamily: FONTS.ProductSans.regular,
                                                    textTransform: 'uppercase',
                                                    fontSize: moderateScale(15)
                                                }}
                                            >
                                                <Text
                                                    style={{
                                                        fontFamily: FONTS.ProductSans.bold
                                                    }}
                                                >
                                                    {moment(item.timeData).format('dddd')}{' '}
                                                </Text>
                                                {moment(item.timeData).format(
                                                    'YYYY-MM-DD'
                                                )}
                                            </Text>
                                        </View>
                                        <Text
                                            style={{
                                                color: '#33404F',
                                                fontSize: moderateScale(11),
                                                fontFamily: FONTS.ProductSans.regular
                                            }}
                                        >
                                            Sign
                                        </Text>
                                        <Image
                                            source={require('../../Assets/Icons/warning-red.png')}
                                            style={{
                                                height: moderateScale(20),
                                                width: moderateScale(20),
                                                marginHorizontal: moderateScale(5)
                                            }}
                                        />
                                        <Icon
                                            name="chevron-right"
                                            type="Feather"
                                            size={moderateScale(22)}
                                        />
                                    </Pressable>
                                );
                            }}
                            ItemSeparatorComponent={() => {
                                return (
                                    <View
                                        style={{
                                            borderWidth: 0.5,
                                            borderColor: '#E4E8EE'
                                        }}
                                    />
                                );
                            }}
                        />
                    ) : (
                        <View
                            style={{
                                justifyContent: 'center',
                                alignItems: 'center',
                                flex: 1
                            }}
                        >
                            <Text
                                style={{
                                    color: '#33404F',
                                    fontFamily: FONTS.ProductSans.regular,
                                    fontSize: moderateScale(13)
                                }}
                            >
                                No Data Found
                            </Text>
                        </View>
                    )}
                </View>
            </LinearGradient>

            <Modal
                isVisible={showSigModal}
                style={{
                    margin: 0,
                    justifyContent: 'flex-end'
                }}
                onBackButtonPress={() => setShowSigModal(false)}
                onBackdropPress={() => setShowSigModal(false)}
            >
                <View
                    style={{
                        paddingVertical: moderateScale(20),
                        paddingHorizontal: moderateScale(20),
                        backgroundColor: '#fff',
                        height: '60%',
                        borderTopLeftRadius: moderateScale(20),
                        borderTopRightRadius: moderateScale(20)
                    }}
                >
                    <Text
                        style={{
                            fontSize: moderateScale(15),
                            color: '#33404F',
                            fontFamily: FONTS.ProductSans.regular
                        }}
                    >
                        I hereby certify that my data entries and my record of duty status
                        for this day are true and correct.
                    </Text>

                    <SignatureScreen
                        ref={ref}
                        onEnd={() => {}}
                        onOK={(sig) => {
                            uploadImage(sig);
                        }}
                        autoClear={true}
                        descriptionText={''}
                        webStyle={`body,html {
                            height: 200px !important;
                        }
                        .m-signature-pad--footer {
                            padding: 0px 0px !important;
                        }`}
                        style={{
                            marginTop: moderateScale(10)
                        }}
                        clearText="Clear Signature"
                        confirmText="Accept"
                    />
                    {/* <View style={{ flex: 1, backgroundColor: 'red' }} /> */}
                </View>
            </Modal>
        </Container>
    );
};

export default UnsignedLog;

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
        marginHorizontal: moderateScale(15)
    },
    headerText: {
        color: '#33404F',
        fontFamily: FONTS.ProductSans.regular,
        fontSize: moderateScale(17)
    }
});
