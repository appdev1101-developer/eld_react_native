import {
    ActivityIndicator,
    ColorValue,
    Dimensions,
    Image,
    ImageSourcePropType,
    RefreshControl,
    ScrollView,
    StyleSheet,
    View,
    DeviceEventEmitter
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
import { getDutyStatusCoordinates } from '../../core/location/getDutyStatusLocation';
import HomeMenuCard from '../../Components/Home/HomeMenuCard';
import NavigationService from '../../Services/Navigation';
import { GeoData } from '../../Utils/Geometris';
import GeoDataBackgroundService from '../../Utils/GeoDataService';
import { getUnreadMessageCount } from '../../core/cache/messagesCache';
import { prefetchNotifications } from '../../core/hooks/useNotifications';
import { formatLocationLabel } from '../../core/location/formatLocationLabel';
import { requireOnline } from '../../core/network/requireOnline';
import { showError } from '../../Utils/toast';
import { getApiErrorMessage } from '../../Utils/apiErrorMessage';

export type StatusDataType = {
    id: number;
    icon: ImageSourcePropType;
    name: string;
    description?: string;
    overlayColor?: ColorValue;
    arcColors?: [ColorValue, ColorValue, ColorValue];
    selectedArc?: 1 | 2;
    apiStatus:
        | 'Off duty'
        | 'Sleeping Berth'
        | 'Driving'
        | 'ON duty'
        | 'Personal Conveyance'
        | 'Yard moves';
};

const AllStatusData: Array<StatusDataType> = [
    {
        id: 3,
        icon: require('../../Assets/Icons/drive.png'),
        name: 'Drive',
        // description: '11-Hour Driving Limit',
        overlayColor: '#72f575',
        selectedArc: 1,
        apiStatus: 'Driving'
    },
    {
        id: 6,
        icon: require('../../Assets/Icons/YardMove.png'),
        name: 'Yard Move',
        // description: 'Moving Nearby',
        overlayColor: '#eaf5a3',
        selectedArc: 2,
        apiStatus: 'Yard moves'
    },
    {
        id: 5,
        icon: require('../../Assets/Icons/PersonalUse.png'),
        name: 'Personal use',
        arcColors: ['#6c746e', '#acada5', '#494b4f'],
        apiStatus: 'Personal Conveyance'
    },
    {
        id: 4,
        icon: require('../../Assets/Icons/Break.png'),
        name: 'ON Duty',
        // description: 'Rest please!',
        arcColors: ['#f3c646', '#f5a841', '#b19359'],
        apiStatus: 'ON duty'
    },
    {
        id: 2,
        icon: require('../../Assets/Icons/Sleeper.png'),
        name: 'Sleeper',
        // description: 'Zzz!',
        arcColors: ['#aeaeae', '#e6e4e1', '#818181'],
        apiStatus: 'Sleeping Berth'
    },
    {
        id: 1,
        icon: require('../../Assets/Icons/OffDuty.png'),
        name: 'Off duty',
        // description: 'for Personal Work',
        arcColors: ['#ee4e34', '#f17c3a', '#ed393e'],
        apiStatus: 'Off duty'
    }
];

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

    const [geoData, setGeoData] = useState<GeoData | null>(null);
    const [unreadMessageCount, setUnreadMessageCount] = useState(0);
    const goToMessages = () => NavigationService.navigate('Messages');

    const isFirstFocus = useRef(true);

    const currentStatus = useMemo(
        () => AllStatusData.find((item) => item.apiStatus === hos?.latestLog),
        [hos?.latestLog]
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

    useEffect(() => {
        // Set up event listener for GeoData from native module
        const geoDataListener = DeviceEventEmitter.addListener('GeometrisData', (data: GeoData) => {
            setGeoData(data);
        });

        return () => {
            geoDataListener.remove();
        };
    }, []);

    const changeStatus = (data: StatusDataType, remarks: string) => {
        if (!requireOnline()) {
            setShowVerifyModal(false);
            return;
        }

        const { lat, lng } = getDutyStatusCoordinates(geoData);
        dashboardApi
            .changeDutyStatusLegacy(data.id, lat, lng, remarks)
            .then((result) => {
                if (isLegacySuccess(result)) {
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
                <HomeHeader />
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={refresh}
                            colors={['#392969']}
                            tintColor="#392969"
                        />
                    }
                >
                    <Text
                        style={{
                            color: '#FFFFFF',
                            fontFamily: FONTS.ProductSans.regular,
                            fontSize: moderateScale(25),
                            marginHorizontal: moderateScale(18),
                            marginTop: moderateScale(10)
                        }}
                    >
                        Hi, {userData?.first_name} !{' '}
                        <Text
                            style={{
                                color: '#60A5FA',
                                fontFamily: FONTS.ProductSans.regular,
                                fontSize: moderateScale(20)
                            }}
                        >
                            Welcome Back
                        </Text>
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

                    <View style={styles.statusTextContainer}>
                        <Icon
                            name="clock"
                            type="Feather"
                            color={'#FFFFFF'}
                        />
                        <Text style={styles.statusText}>
                            {showStatus ? 'Choose Your Status' : 'Hours of service (HOS)'}
                        </Text>
                        <View style={{ flex: 1 }} />
                        {!showStatus ? (
                            <Text
                                style={{
                                    fontFamily: FONTS.ProductSans.regular,
                                    color: '#00DDA3',
                                    fontSize: moderateScale(10)
                                }}
                            >
                                Today
                            </Text>
                        ) : null}
                    </View>

                    {showStatus ? (
                        <AllStatus
                            selectedStatus={selectedStatus}
                            locationLabel={formatLocationLabel(geoData)}
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
                        {verifySuccess ? 'Success' : 'Verifying...'}
                    </Text>
                </View>
            </Modal>
        </Container>
    );
};

export default Home;

const styles = StyleSheet.create({
    statusTextContainer: {
        marginHorizontal: moderateScale(18) + 15,
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: moderateScale(15)
    },
    statusText: {
        fontFamily: FONTS.ProductSans.regular,
        color: '#ffffff',
        fontSize: moderateScale(15),
        marginLeft: moderateScale(8)
    },
    bottomCard: {
        backgroundColor: '#fff',
        paddingTop: moderateScale(110),
        top: -moderateScale(85),
        zIndex: 1,
        borderTopRightRadius: moderateScale(40),
        borderTopLeftRadius: moderateScale(40),
        marginBottom: -moderateScale(85)
    },
    textHeading: {
        fontFamily: FONTS.ProductSans.regular,
        fontSize: moderateScale(18),
        marginHorizontal: moderateScale(18) + 15
    }
});
