import {
    ActivityIndicator,
    Dimensions,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    View
} from 'react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Container, Icon, Text } from 'react-native-basic-elements';
import AppStatusBar from '../../Components/AppStatusBar';
import { moderateScale } from '../../Constants/PixelRatio';
import { useSelector } from 'react-redux';
import LinearGradient from 'react-native-linear-gradient';
import { FONTS } from '../../Constants/Fonts';
import ArcProgressIndicator from '../../Components/UI/ArcProgressIndicator';
import HOSDetails from '../../Components/Home/HOSDetails';
import AllStatus from '../../Components/Home/AllStatus';
import Modal from 'react-native-modal';
import LottieView from 'lottie-react-native';
import HomeHeader from '../../Components/Headers/HomeHeader';
import { RootState } from '../../Redux/store';
import { dashboardApi } from '../../core/api/services/dashboardApi';
import { isLegacySuccess } from '../../core/api/types/common';
import { useDashboard } from '../../core/hooks/useDashboard';
// import { realtimeSocket } from '../../core/realtime/realtimeSocket';
// import { DUTY_STATUS_CHANGED_EVENT } from '../../core/realtime/socketConfig';
import {
    getDutyStatusCoordinates,
    isDutyStatusLocationValid
} from '../../core/location/getDutyStatusLocation';
import { useDutyStatusLocation } from '../../core/hooks/useDutyStatusLocation';
import HomeMenuCard from '../../Components/Home/HomeMenuCard';
import NavigationService from '../../Services/Navigation';
import GeoDataBackgroundService from '../../Utils/GeoDataService';
import { getUnreadMessageCount } from '../../core/cache/messagesCache';
import { prefetchNotifications } from '../../core/hooks/useNotifications';
import { formatLocationLabel } from '../../core/location/formatLocationLabel';
import { requireOnline } from '../../core/network/requireOnline';
import { showError } from '../../Utils/toast';
import { getApiErrorMessage } from '../../Utils/apiErrorMessage';
import { THEME, GRADIENT_HEADER } from '../../Constants/Theme';
import { StatusDataType, AllStatusData } from '../../core/shift_status';


const { width } = Dimensions.get('screen');
const Home = () => {
    const { userData } = useSelector((state: RootState) => state.User);
    const {
        unsignedLogCount,
        approvals,
        loading,
        refreshing,
        hosTimes,
        fetchDashboard,
        refresh,
        refreshHos,
        hos
    } = useDashboard();

    const [showStatus, setShowStatus] = useState<boolean>(false);
    const [selectedStatus, setSelectedStatus] = useState<StatusDataType | undefined>(
        undefined
    );
    const [showVerifyModal, setShowVerifyModal] = useState<boolean>(false);
    const [verifySuccess, setVerifySuccess] = useState<boolean>(false);

    const [unreadMessageCount, setUnreadMessageCount] = useState(0);
    const { location: dutyStatusLocation, getFreshCoordinates } = useDutyStatusLocation({
        enabled: showStatus
    });
    const goToMessages = () => NavigationService.navigate('Messages');

    const isFirstFocus = useRef(true);

    const currentStatus = useMemo(
        () => AllStatusData.find((item) => item.shift_status_id === hos?.shift_id),
        [hos?.shift_id]
    );

    useFocusEffect(
        useCallback(() => {
            setUnreadMessageCount(getUnreadMessageCount());
            prefetchNotifications();
            fetchDashboard({ showLoading: isFirstFocus.current });
            if (isFirstFocus.current) {
                isFirstFocus.current = false;
            }
        }, [fetchDashboard])
    );

    useEffect(() => {
        GeoDataBackgroundService.restoreIfNeeded().catch(() => {});
    }, []);

    const changeStatus = async (data: StatusDataType, remarks: string) => {
        if (!requireOnline()) {
            setShowVerifyModal(false);
            return;
        }

        const freshLocation = await getFreshCoordinates();
        if (!isDutyStatusLocationValid(freshLocation)) {
            setShowVerifyModal(false);
            showError('Location unavailable. Enable GPS or connect your ELD device.');
            return;
        }

        const coords = getDutyStatusCoordinates(freshLocation);
        if (!coords) {
            setShowVerifyModal(false);
            showError('Location unavailable. Enable GPS or connect your ELD device.');
            return;
        }
        dashboardApi
            .changeDutyStatusLegacy(""+data.shift_status_id, ""+coords.lat, ""+coords.lng, remarks)
            .then((result) => {
                if (isLegacySuccess(result)) 
                {
                    
                    setVerifySuccess(true);
                    setTimeout(() => {
                        refreshHos();
                        setSelectedStatus(undefined);
                        setShowStatus(false);
                        setShowVerifyModal(false);
                        setVerifySuccess(false);
                    }, 1500);
                }
            })
            .catch((error) => {
                setShowVerifyModal(false);
                showError(getApiErrorMessage(error, 'Failed to change status'));
            });
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
                    color={THEME.colors.primary}
                />
            </View>
        );
    }

    ////////////////////// DEV only to test the update duty status received from websocket ///////////////////
    // const devTestIndex = useRef(0);
    // const simulateDutyStatusEvent = () => {
    //     const devTestPayload=[
    //     {sendType:DUTY_STATUS_CHANGED_EVENT,driverId:100,vehicle:{id:10,name:"PB13"},shiftStatus:5,startLogTime:"2026-08-11T22:40:38.000000Z",endLogTime:"2026-08-11T22:42:08.000000Z",duration:"00:01:30",locationName:"3018 N Old Hwy 91, Cedar City, UT 84721, USA",shift_time:"13:57:00",cycle_time:"69:57:00",break_time:"07:58:30",drive_time:"10:57:00",odometer:"1827417.0",engineHours:"25140.2"},
    //     {sendType:DUTY_STATUS_CHANGED_EVENT,driverId:100,vehicle:{id:10,name:"PB13"},shiftStatus:3,startLogTime:"2026-08-11T22:40:38.000000Z",endLogTime:"2026-08-11T22:42:08.000000Z",duration:"00:01:30",locationName:"3018 N Old Hwy 91, Cedar City, UT 84721, USA",shift_time:"13:57:00",cycle_time:"69:57:00",break_time:"07:58:30",drive_time:"10:57:00",odometer:"1827417.0",engineHours:"25140.2"},
    //     {sendType:DUTY_STATUS_CHANGED_EVENT,driverId:100,vehicle:{id:10,name:"PB13"},shiftStatus:2,startLogTime:"2026-08-11T22:40:38.000000Z",endLogTime:"2026-08-11T22:42:08.000000Z",duration:"00:01:30",locationName:"3018 N Old Hwy 91, Cedar City, UT 84721, USA",shift_time:"13:57:00",cycle_time:"69:57:00",break_time:"07:58:30",drive_time:"10:57:00",odometer:"1827417.0",engineHours:"25140.2"},
    // ];
    //     const payload = devTestPayload[devTestIndex.current];
    //     devTestIndex.current = (devTestIndex.current + 1) % devTestPayload.length;
    //     if (__DEV__) {
    //         console.log('[dev] simulating realtime duty-status event', payload);
    //     }
    //     realtimeSocket.simulateIncomingMessage(payload);
    // };
    ////////////////////// DEV only ///////////////////

    return (
        <Container>
            <AppStatusBar />

            <LinearGradient
                colors={GRADIENT_HEADER}
                style={{ flex: 1 }}
            >
                <HomeHeader />
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={refresh}
                            colors={[THEME.colors.primary]}
                            tintColor={THEME.colors.primary}
                        />
                    }
                >
                    <Text style={styles.greeting}>
                        Hi, {userData?.first_name} !{' '}
                        <Text style={styles.greetingAccent}>Welcome Back</Text>
                    </Text>

                    <ArcProgressIndicator
                        strokeWidth={moderateScale(45)}
                        colors={
                            currentStatus?.arcColors ?? ['#bae6fc', '#60a5f8', '#1d4ed8']
                        }
                        size={width - moderateScale(18) * 2}
                        containerStyle={{
                            marginTop: moderateScale(25)
                        }}
                        selectedArc={currentStatus?.selectedArc ?? 0}
                        overlayColor={currentStatus?.overlayColor ?? '#72f575'}
                        selectedArcColor="#1d4ed8"
                        onPressStatusChange={() => setShowStatus((state) => !state)}
                        modeName={currentStatus?.name ?? 'No Shift'}
                    />
                     {/* {__DEV__ ? (
                        <Pressable
                            onPress={simulateDutyStatusEvent}
                        >
                            <Text style={styles.statusText}>
                                DEV: Simulate realtime duty-status event
                            </Text>
                        </Pressable>
                    ) : null} */}
                    <View style={styles.statusTextContainer}>
                        <Icon
                            name="clock"
                            type="Feather"
                            color={THEME.colors.textOnDark}
                        />
                        <Text style={styles.statusText}>
                            {showStatus ? 'Choose Your Status' : 'Hours of service (HOS)'}
                        </Text>
                        <View style={{ flex: 1 }} />
                        {!showStatus ? (
                            <Text style={styles.todayLabel}>Today</Text>
                        ) : null}
                    </View>

                    {showStatus ? (
                        <AllStatus
                            selectedStatus={selectedStatus}
                            locationLabel={formatLocationLabel(dutyStatusLocation)}
                            data={AllStatusData}
                            onSelect={setSelectedStatus}
                            onBack={() => setSelectedStatus(undefined)}
                            onConfirm={(val, remarks) => {
                                setShowVerifyModal(true);
                                changeStatus(val, remarks);
                            }}
                        />
                    ) : (
                        <HOSDetails
                            driveTime={hosTimes.driveTime}
                            shiftTime={hosTimes.shiftTime}
                            cycleTime={hosTimes.cycleTime}
                        />
                    )}
                   
                    <View style={styles.bottomCard}>
                        <HomeMenuCard
                            title="Compliance"
                            listItems={[
                                {
                                    title: 'Unsigned Logs',
                                    count: unsignedLogCount,
                                    onPress: () =>
                                        NavigationService.navigate('UnsignedLog')
                                },
                                {
                                    title: 'Co-Driver Requests',
                                    count: approvals.coDriver.length,
                                    onPress: () =>
                                        NavigationService.navigate('ApprovalRequestLogs', {
                                            name: 'Co-Driver Requests',
                                            type: 'coDriver'
                                        })
                                },
                                {
                                    title: 'Add Logs',
                                    count: approvals.addLog.length,
                                    onPress: () =>
                                        NavigationService.navigate('ApprovalRequestLogs', {
                                            name: 'Add Logs',
                                            type: 'addLog'
                                        })
                                },
                                {
                                    title: 'Edit Logs',
                                    count: approvals.editLog.length,
                                    onPress: () =>
                                        NavigationService.navigate('ApprovalRequestLogs', {
                                            name: 'Edit Logs',
                                            type: 'editLog'
                                        })
                                },
                                {
                                    title: 'Reassign Logs',
                                    count: approvals.reassignLog.length,
                                    onPress: () =>
                                        NavigationService.navigate('ApprovalRequestLogs', {
                                            name: 'Reassign Logs',
                                            type: 'reassignLog'
                                        })
                                },
                                {
                                    title: 'Unidentified Driving',
                                    count: approvals.unidentifiedDriving.length,
                                    onPress: () =>
                                        NavigationService.navigate('ApprovalRequestLogs', {
                                            name: 'Unidentified Driving',
                                            type: 'unidentifiedDriving'
                                        })
                                }
                            ]}
                            onRightIconPress={() =>
                                NavigationService.navigate('Compliance')
                            }
                        />

                        <HomeMenuCard
                            title="Maintenance"
                            listItems={[
                                {
                                    title: 'Pre-trip Vehicle Inspection',
                                    onPress: () =>
                                        NavigationService.navigate('AddInspection', {
                                            inspectionType: '1'
                                        })
                                },
                                {
                                    title: 'Post-Trip Vehicle Inspection',
                                    onPress: () =>
                                        NavigationService.navigate('AddInspection', {
                                            inspectionType: '2'
                                        })
                                },
                                {
                                    title: 'Inspection History',
                                    onPress: () =>
                                        NavigationService.navigate('InspectionHistory')
                                }
                            ]}
                        />

                        <HomeMenuCard
                            title="Messages"
                            listItems={[
                                {
                                    title:
                                        unreadMessageCount > 0
                                            ? `${unreadMessageCount} unread Messages`
                                            : 'No unread Messages',
                                    count:
                                        unreadMessageCount > 0
                                            ? unreadMessageCount
                                            : undefined,
                                    onPress: goToMessages
                                }
                            ]}
                            onRightIconPress={goToMessages}
                        />

                        <HomeMenuCard
                            title="Safety"
                            listItems={[
                                {
                                    title: 'Safety Tasks',
                                    onPress: () => NavigationService.navigate('Safety')
                                }
                            ]}
                        />
                    </View>
                </ScrollView>
            </LinearGradient>

            <Modal
                isVisible={showVerifyModal}
                style={{
                    marginHorizontal: 0,
                    alignItems: 'center'
                }}
                animationIn="fadeIn"
                animationOut="fadeOut"
            >
                <View style={styles.verifyModal}>
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

                    <Text style={styles.verifyModalText}>
                        {verifySuccess ? 'Success' : 'Verifying...'}
                    </Text>
                </View>
            </Modal>
        </Container>
    );
};

export default Home;

const styles = StyleSheet.create({
    greeting: {
        color: THEME.colors.textOnDark,
        fontFamily: FONTS.ProductSans.regular,
        fontSize: moderateScale(25),
        marginHorizontal: moderateScale(18),
        marginTop: moderateScale(10)
    },
    greetingAccent: {
        color: THEME.colors.textAccent,
        fontFamily: FONTS.ProductSans.regular,
        fontSize: moderateScale(20)
    },
    statusTextContainer: {
        marginHorizontal: moderateScale(18) + 15,
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: moderateScale(15)
    },
    statusText: {
        fontFamily: FONTS.ProductSans.regular,
        color: THEME.colors.textOnDark,
        fontSize: moderateScale(15),
        marginLeft: moderateScale(8)
    },
    todayLabel: {
        fontFamily: FONTS.ProductSans.regular,
        color: THEME.colors.successSoft,
        fontSize: moderateScale(10),
        textTransform: 'uppercase',
        letterSpacing: 0.8
    },
    bottomCard: {
        backgroundColor: THEME.colors.surface,
        paddingTop: moderateScale(110),
        top: -moderateScale(85),
        zIndex: 1,
        borderTopRightRadius: THEME.radius.sheet,
        borderTopLeftRadius: THEME.radius.sheet,
        marginBottom: -moderateScale(85)
    },
    verifyModal: {
        height: moderateScale(230),
        width: moderateScale(240),
        backgroundColor: THEME.colors.surface,
        borderRadius: THEME.radius.lg,
        justifyContent: 'center',
        alignItems: 'center',
        ...THEME.shadow.card
    },
    verifyModalText: {
        fontFamily: FONTS.ProductSans.regular,
        fontSize: moderateScale(13),
        marginTop: moderateScale(10),
        color: THEME.colors.textPrimary
    },
    textHeading: {
        fontFamily: FONTS.ProductSans.regular,
        fontSize: moderateScale(18),
        marginHorizontal: moderateScale(18) + 15
    }
});
