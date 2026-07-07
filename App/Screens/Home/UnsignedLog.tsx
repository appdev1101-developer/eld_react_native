import {
    ActivityIndicator,
    FlatList,
    Image,
    Pressable,
    StyleSheet,
    View
} from 'react-native';
import React, { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { CheckBox, Container, Icon, Text } from 'react-native-basic-elements';
import AppStatusBar from '../../Components/AppStatusBar';
import LinearGradient from 'react-native-linear-gradient';
import HomeHeader from '../../Components/Headers/HomeHeader';
import { moderateScale } from '../../Constants/PixelRatio';
import { FONTS } from '../../Constants/Fonts';
import moment from 'moment';
import { hosApi } from '../../core/api/services/hosApi';
import { dashboardApi } from '../../core/api/services/dashboardApi';
import { isSuccess } from '../../core/api/types/common';
import { RootState } from '../../Redux/store';
import { setDashboardBundle } from '../../Redux/reducer/Dashboard';
import { getHomeCache, setHomeCache } from '../../core/cache/homeDataCache';
import Modal from 'react-native-modal';
import SignatureScreen, { SignatureViewRef } from 'react-native-signature-canvas';
import { requireOnline } from '../../core/network/requireOnline';
import { showError, showToast } from '../../Utils/toast';
import { getApiErrorMessage } from '../../Utils/apiErrorMessage';
import { GRADIENT_HEADER } from '../../Constants/Theme';

const UnsignedLog = () => {
    const dispatch = useDispatch();
    const allUnsignedLogs = useSelector(
        (state: RootState) => state.Dashboard.unsignedLogs
    );
    const ref = useRef<SignatureViewRef>(null);
    const [showSigModal, setShowSigModal] = useState<boolean>(false);
    const [selectedLogId, setSelectedLogId] = useState<number | null>(null);
    const [loading, setLoading] = useState<boolean>(allUnsignedLogs.length === 0);

    const refreshUnsignedLogs = useCallback(async () => {
        const result = await dashboardApi.getUnsignedLogs();
        if (isSuccess(result)) {
            dispatch(
                setDashboardBundle({
                    unsignedLogs: result.data,
                    unsignedLogCount: result.data.length
                })
            );
            const cached = getHomeCache();
            if (cached) {
                setHomeCache({
                    ...cached,
                    unsignedLogs: result.data,
                    unsignedLogCount: result.data.length
                });
            }
        }
        return result;
    }, [dispatch]);

    useFocusEffect(
        useCallback(() => {
            if (allUnsignedLogs.length > 0) {
                setLoading(false);
                return;
            }
            refreshUnsignedLogs().finally(() => setLoading(false));
        }, [allUnsignedLogs.length, refreshUnsignedLogs])
    );

    const uploadImage = async (base64String: string) => {
        if (!requireOnline()) {
            return;
        }

        const mimeTypeMatch = base64String.match(/data:(.*);base64/);
        if (!mimeTypeMatch) {
            showError('Invalid signature format');
            return;
        }

        const mimeType = mimeTypeMatch[1];
        const base64Data = base64String.split(',')[1];
        const signatureUri = `data:${mimeType};base64,${base64Data}`;

        try {
            const result = await hosApi.submitUnsignedLogSignature(
                selectedLogId,
                signatureUri,
                mimeType
            );
            showToast(result.message);
            if (isSuccess(result)) {
                setShowSigModal(false);
                setSelectedLogId(null);
                await refreshUnsignedLogs();
            }
        } catch (error: unknown) {
            showError(getApiErrorMessage(error, 'Failed to upload signature'));
        }
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
                colors={GRADIENT_HEADER}
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
                            keyExtractor={(item: any, index) =>
                                String(item?.id ?? index)
                            }
                            renderItem={({ item }: any) => {
                                return (
                                    <Pressable
                                        style={{
                                            marginHorizontal: moderateScale(15),
                                            flexDirection: 'row',
                                            alignItems: 'center',
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
                                                    fontFamily:
                                                        FONTS.ProductSans.regular,
                                                    textTransform: 'uppercase',
                                                    fontSize: moderateScale(15)
                                                }}
                                            >
                                                <Text
                                                    style={{
                                                        fontFamily:
                                                            FONTS.ProductSans.bold
                                                    }}
                                                >
                                                    {moment(item.timeData).format(
                                                        'dddd'
                                                    )}{' '}
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