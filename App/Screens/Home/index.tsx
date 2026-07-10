import {
    ActivityIndicator,
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
import { useDispatch, useSelector } from 'react-redux';
import LinearGradient from 'react-native-linear-gradient';
import { FONTS } from '../../Constants/Fonts';
import StatusHero from '../../Components/Home/StatusHero';
import HOSDetails from '../../Components/Home/HOSDetails';
import StatusChangeSheet from '../../Components/Home/StatusChangeSheet';
import {
    findDutyStatus,
    StatusDataType
} from '../../Constants/dutyStatus';
import Modal from 'react-native-modal';
import LottieView from 'lottie-react-native';
import HomeHeader from '../../Components/Headers/HomeHeader';
import { RootState } from '../../Redux/store';
import { dashboardApi } from '../../core/api/services/dashboardApi';
import { isLegacySuccess } from '../../core/api/types/common';
import { useDashboard } from '../../core/hooks/useDashboard';
import {
    getDutyStatusCoordinates,
    isDutyStatusLocationValid
} from '../../core/location/getDutyStatusLocation';
import { useDutyStatusLocation } from '../../core/hooks/useDutyStatusLocation';
import HomeMenuCard from '../../Components/Home/HomeMenuCard';
import { DutyStatusIcon } from '../../Components/UI';
import NavigationService from '../../Services/Navigation';
import GeoDataBackgroundService from '../../Utils/GeoDataService';
import { getUnreadMessageCount } from '../../core/cache/messagesCache';
import { prefetchNotifications } from '../../core/hooks/useNotifications';
import { formatLocationLabel } from '../../core/location/formatLocationLabel';
import { requireOnline } from '../../core/network/requireOnline';
import { showError, showSuccess } from '../../Utils/toast';
import { getApiErrorMessage } from '../../Utils/apiErrorMessage';
import { THEME, GRADIENT_HEADER } from '../../Constants/Theme';
import { setDashboardHos } from '../../Redux/reducer/Dashboard';

export type { StatusDataType };

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

    const [statusSheetVisible, setStatusSheetVisible] = useState(false);
    const [showVerifyModal, setShowVerifyModal] = useState<boolean>(false);
    const [verifySuccess, setVerifySuccess] = useState<boolean>(false);
    const [heroStatus, setHeroStatus] = useState<StatusDataType | undefined>();
    const [pendingStatus, setPendingStatus] = useState<StatusDataType | undefined>();

    const [unreadMessageCount, setUnreadMessageCount] = useState(0);
    const { location: dutyStatusLocation, getFreshCoordinates } = useDutyStatusLocation({
        enabled: statusSheetVisible
    });
    const goToMessages = () => NavigationService.navigate('Messages');

    const isFirstFocus = useRef(true);

    const currentStatus = useMemo(
        () =>  findDutyStatus(hos?.latestLog),
        [hos?.latestLog]
    );
    //__DEV__ ? findDutyStatus("Yard moves") : 

    const displayStatus = heroStatus ?? currentStatus;
    useEffect(() => {
        if (
            heroStatus &&
            currentStatus?.apiStatus === heroStatus.apiStatus
        ) {
            setHeroStatus(undefined);
        }
        
    }, [currentStatus?.apiStatus, heroStatus]);


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

    const handleStatusSheetConfirm = (status: StatusDataType, remarks: string) => {
        setPendingStatus(status);
        setShowVerifyModal(true);
        setVerifySuccess(false);
        changeStatus(status, remarks);
    };

    const changeStatus = async (data: StatusDataType, remarks: string) => {
        if (!requireOnline()) {
            setShowVerifyModal(false);
            setPendingStatus(undefined);
            return;
        }

        const freshLocation = await getFreshCoordinates();
        if (!isDutyStatusLocationValid(freshLocation)) {
            setShowVerifyModal(false);
            setPendingStatus(undefined);
            showError('Location unavailable. Enable GPS or connect your ELD device.');
            return;
        }

        const coords = getDutyStatusCoordinates(freshLocation);
        if (!coords) {
            setShowVerifyModal(false);
            setPendingStatus(undefined);
            showError('Location unavailable. Enable GPS or connect your ELD device.');
            return;
        }

        try {
            const result = await dashboardApi.changeDutyStatusLegacy(
                data.id,
                coords.lat,
                coords.lng,
                remarks
            );

            if (isLegacySuccess(result)) {
                setVerifySuccess(true);
                showSuccess(`You are now ${data.name}`);

                setTimeout(() => {
                    setHeroStatus(data);
                    refreshHos();
                    setShowVerifyModal(false);
                    setVerifySuccess(false);
                    setPendingStatus(undefined);
                }, 1200);
                return;
            }

            setShowVerifyModal(false);
            setPendingStatus(undefined);
            showError(result.message ?? 'Failed to change status');
        } catch (error: unknown) {
            setShowVerifyModal(false);
            setPendingStatus(undefined);
            showError(getApiErrorMessage(error, 'Failed to change status'));
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
                    color={THEME.colors.primary}
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

                    <StatusHero
                        strokeWidth={moderateScale(45)}
                        containerStyle={{
                            marginTop: moderateScale(25)
                        }}
                        status={displayStatus}
                        onPressStatusChange={() => setStatusSheetVisible(true)}
                    />

                    <View style={styles.statusTextContainer}>
                        <Icon
                            name="clock"
                            type="Feather"
                            color={THEME.colors.textOnDark}
                        />
                        <Text style={styles.statusText}>
                            Hours of service (HOS)
                        </Text>
                        <View style={{ flex: 1 }} />
                        <Text style={styles.todayLabel}>Today</Text>
                    </View>

                    <HOSDetails
                        driveTime={hosTimes.driveTime}
                        shiftTime={hosTimes.shiftTime}
                        cycleTime={hosTimes.cycleTime}
                        currentDutyStatus={displayStatus?.apiStatus ?? hos?.latestLog}
                        loading={loading || refreshing}
                    />

                    <View
                        style={styles.bottomCardOverlap}
                        pointerEvents="none"
                    />
                    <View
                        style={styles.bottomCard}
                        pointerEvents="box-none"
                    >
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

            <StatusChangeSheet
                visible={statusSheetVisible}
                currentStatus={displayStatus}
                locationLabel={formatLocationLabel(dutyStatusLocation)}
                onClose={() => setStatusSheetVisible(false)}
                onConfirm={handleStatusSheetConfirm}
            />

            <Modal
                isVisible={showVerifyModal}
                style={styles.verifyModalWrapper}
                animationIn="fadeIn"
                animationOut="fadeOut"
            >
                <View style={styles.verifyModal}>
                    {verifySuccess && pendingStatus ? (
                        <View style={styles.verifyStatusIconWrap}>
                            <DutyStatusIcon
                                name={pendingStatus.icon}
                                color={pendingStatus.themeColor}
                                size={moderateScale(36)}
                                strokeWidth={2.2}
                            />
                        </View>
                    ) : null}

                    {verifySuccess ? (
                        <LottieView
                            source={require('../../Assets/LottieJson/Success.json')}
                            style={styles.verifyLottie}
                            autoPlay={true}
                            loop={false}
                        />
                    ) : (
                        <LottieView
                            source={require('../../Assets/LottieJson/Loading.json')}
                            style={styles.verifyLottie}
                            autoPlay={true}
                            loop={true}
                        />
                    )}

                    <Text style={styles.verifyModalTitle}>
                        {verifySuccess
                            ? `Now ${pendingStatus?.name ?? 'Updated'}`
                            : 'Updating status...'}
                    </Text>
                    <Text style={styles.verifyModalText}>
                        {verifySuccess
                            ? 'Your duty status has been saved.'
                            : 'Please wait while we confirm your change.'}
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
    bottomCardOverlap: {
        height: moderateScale(25),
        marginTop: -moderateScale(85),
        marginBottom: -moderateScale(25)
    },
    bottomCard: {
        backgroundColor: THEME.colors.surface,
        paddingTop: moderateScale(85),
        zIndex: 1,
        borderTopRightRadius: THEME.radius.sheet,
        borderTopLeftRadius: THEME.radius.sheet,
        marginBottom: -moderateScale(60)
    },
    verifyModalWrapper: {
        marginHorizontal: 0,
        alignItems: 'center'
    },
    verifyModal: {
        minHeight: moderateScale(230),
        width: moderateScale(260),
        backgroundColor: THEME.colors.surface,
        borderRadius: THEME.radius.lg,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: moderateScale(20),
        paddingVertical: moderateScale(24),
        ...THEME.shadow.card
    },
    verifyStatusIconWrap: {
        height: moderateScale(40),
        width: moderateScale(40),
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: moderateScale(8)
    },
    verifyLottie: {
        height: moderateScale(60),
        width: moderateScale(60)
    },
    verifyModalTitle: {
        fontFamily: FONTS.ProductSans.bold,
        fontSize: moderateScale(16),
        marginTop: moderateScale(10),
        color: THEME.colors.textPrimary,
        textAlign: 'center'
    },
    verifyModalText: {
        fontFamily: FONTS.ProductSans.regular,
        fontSize: moderateScale(12),
        marginTop: moderateScale(6),
        color: THEME.colors.textSecondary,
        textAlign: 'center',
        lineHeight: moderateScale(18)
    }
});