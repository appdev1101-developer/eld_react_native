import {
    ActivityIndicator,
    ColorValue,
    Dimensions,
    Image,
    ImageSourcePropType,
    RefreshControl,
    ScrollView,
    StyleSheet,
    ToastAndroid,
    View,
    DeviceEventEmitter
} from 'react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Container, Icon, Text, useTheme } from 'react-native-basic-elements';
import AppStatusBar from '../../Components/AppStatusBar';
import { moderateScale } from '../../Constants/PixelRatio';
import { useDispatch, useSelector } from 'react-redux';
import LinearGradient from 'react-native-linear-gradient';
import { FONTS } from '../../Constants/Fonts';
import ArcProgressIndicator from '../../Components/UI/ArcProgressIndicator';
import HOSDetails from '../../Components/Home/HOSDetails';
// import LastActivityListItem from '../../Components/Home/LastActivityListItem';
import AllStatus from '../../Components/Home/AllStatus';
import Modal from 'react-native-modal';
import LottieView from 'lottie-react-native';
import HomeHeader from '../../Components/Headers/HomeHeader';
import { RootState } from '../../Redux/store';
import DashboardService from '../../Services/Dashboard';
import { setConfigData, setUserInfo } from '../../Redux/reducer/User';
import HomeMenuCard from '../../Components/Home/HomeMenuCard';
import NavigationService from '../../Services/Navigation';
import { GeoData } from '../../Utils/Geometris';
import GeoDataBackgroundService from '../../Utils/GeoDataService';
import { RECENT_CHATS } from '../../Constants/MessageMockData';

export type ActivityDataType = {
    title: string;
    subTitle: string;
    price: number;
    date: Date;
};

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
        | 'Sleeping Birth'
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
        apiStatus: 'Sleeping Birth'
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

// const ActivityData: Array<ActivityDataType> = [
//     {
//         title: 'food & beverage',
//         subTitle: 'five lods',
//         price: 28.11,
//         date: new Date('2024-02-21')
//     },
//     {
//         title: 'shopping',
//         subTitle: 'H&M 1257 ****',
//         price: -157.64,
//         date: new Date('2024-01-14')
//     },
//     {
//         title: 'salary income',
//         subTitle: 'pharaos tech, inc',
//         price: 3800.0,
//         date: new Date('2024-01-13')
//     },
//     {
//         title: 'food & beverage',
//         subTitle: 'five lods',
//         price: 28.11,
//         date: new Date('2024-02-21')
//     },
//     {
//         title: 'shopping',
//         subTitle: 'H&M 1257 ****',
//         price: -157.64,
//         date: new Date('2024-01-14')
//     },
//     {
//         title: 'salary income',
//         subTitle: 'pharaos tech, inc',
//         price: 3800.0,
//         date: new Date('2024-01-13')
//     }
// ];
const { width } = Dimensions.get('screen');
const Home = () => {
    const { userData } = useSelector((state: RootState) => state.User);
    const dispatch = useDispatch();

    const [showStatus, setShowStatus] = useState<boolean>(false);
    const [selectedStatus, setSelectedStatus] = useState<StatusDataType | undefined>(
        undefined
    );
    const [currentStatus, setCurrentStatus] = useState<StatusDataType | undefined>(
        undefined
    );

    const [showVerifyModal, setShowVerifyModal] = useState<boolean>(false);
    const [verifySuccess, setVerifySuccess] = useState<boolean>(false);
    const [unsignedLogCount, setUnsignedLogCount] = useState<number>(0);

    const [hosDetails, setHosDetails] = useState({
        driveTime: '00:00',
        shiftTime: '00:00',
        cycleTime: '00:00'
    });
    const [loading, setLoading] = useState<boolean>(true);
    const [refreshing, setRefreshing] = useState<boolean>(false);

    // Geometris/OBD related state
    const [geoData, setGeoData] = useState<GeoData | null>(null);
    const [isConnected, setIsConnected] = useState<boolean>(false);
    const [allCoDriver, setAllCoDriver] = useState<Array<any>>([]);
    const [allAddLogs, setAllAddLogs] = useState<Array<any>>([]);
    const [allEditLog, setAllEditLog] = useState<Array<any>>([]);
    const [allReassignLog, setAllReassignLog] = useState<Array<any>>([]);
    const [allUnidentifiedDriving, setAllUnidentifiedDriving] = useState<Array<any>>([]);

    const unreadMessageCount = RECENT_CHATS.reduce(
        (total, chat) => total + (chat.unread ?? 0),
        0
    );
    const goToMessages = () => NavigationService.navigate('Messages');

    const isFirstFocus = useRef(true);

    useFocusEffect(
        useCallback(() => {
            getInitData(isFirstFocus.current);
            if (isFirstFocus.current) {
                isFirstFocus.current = false;
            }
        }, [])
    );

    useEffect(() => {
        GeoDataBackgroundService.restoreIfNeeded().catch(() => {});
    }, []);

    useEffect(() => {
        // Set up event listener for GeoData from native module
        const geoDataListener = DeviceEventEmitter.addListener('GeometrisData', (data: GeoData) => {
            console.log('Received GeoData:', data);
            setGeoData(data);
            setIsConnected(true);
        });

        return () => {
            geoDataListener.remove();
        };
    }, []);

    // Simple function to check connection status or navigate to ConnectELD
    // const handleVehicleDataPress = () => {
    //     if (isConnected) {
    //         // If connected, show an alert or navigate to a detailed view
    //         ToastAndroid.show('ELD Device Connected', ToastAndroid.SHORT);
    //     } else {
    //         // If not connected, navigate to ConnectELD page
    //         NavigationService.navigate('ConnectELD');
    //     }
    // };

    const getInitData = (showLoading = false) => {
        if (showLoading) {
            setLoading(true);
        }
        return Promise.all([
            DashboardService.getAllUnsignedLog(),
            DashboardService.getDashboard(),
            DashboardService.getHosDetails(),
            DashboardService.getConfigData(),
            DashboardService.getApprovalRequestIndex()

        ]).then(([unsignedLogs, dashboardData, hosData, configData, approvalData]) => {
            console.log("configData", JSON.stringify(hosData))
            if (unsignedLogs.status === 'success') {
                setUnsignedLogCount(unsignedLogs.data.length);
            }

            if (dashboardData.status === 'success') {
                dispatch(setUserInfo(dashboardData.userInfo));
            }

            if (hosData.status === 'success') {
                setHosDetails({
                    driveTime: hosData.time_left_in_drive
                        .split(':')
                        .splice(0, 2)
                        .join(':'),
                    shiftTime: hosData.time_left_in_shift
                        .split(':')
                        .splice(0, 2)
                        .join(':'),
                    cycleTime: hosData.time_left_in_cycle
                        .split(':')
                        .splice(0, 2)
                        .join(':')
                });
                setCurrentStatus(
                    AllStatusData.find((item) => item.apiStatus == hosData.latest_log)
                );
            }

            if (configData.status === 'success') {
                dispatch(setConfigData(configData));
            }

            if( approvalData.status.toLowerCase() === 'success') {
                setAllCoDriver(approvalData.data.coDriver);
                setAllAddLogs(approvalData.data.addLog);
                setAllEditLog(approvalData.data.editLog);
                setAllReassignLog(approvalData.data.reassignLog);
                setAllUnidentifiedDriving(approvalData.data.unidentifiedDriving);
            }
        })
            .catch((error) => {
                console.log('getInitData error', error);
            })
            .finally(() => {
                setLoading(false);
            });
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        getInitData(false).finally(() => setRefreshing(false));
    }, []);

    const getHosDetails = () => {
        DashboardService.getHosDetails()
            .then((result) => {
                if (result.status === 'success') {
                    setHosDetails({
                        driveTime: result.time_left_in_drive
                            .split(':')
                            .splice(0, 2)
                            .join(':'),
                        shiftTime: result.time_left_in_shift
                            .split(':')
                            .splice(0, 2)
                            .join(':'),
                        cycleTime: result.time_left_in_cycle
                            .split(':')
                            .splice(0, 2)
                            .join(':')
                    });
                    setCurrentStatus(
                        AllStatusData.find((item) => item.apiStatus == result.latest_log)
                    );
                }
            })
            .catch((error) => {
                console.log(error);
            });
    };

    const changeStatus = (data: StatusDataType, remarks: string) => {
        DashboardService.changeHOSStatus(data.id, remarks)
            .then((result) => {
                if (result.status === 'success') {
                    setVerifySuccess(true);
                    setTimeout(() => {
                        getHosDetails();
                        setSelectedStatus(undefined);
                        setShowStatus(false);
                        setShowVerifyModal(false);
                        setVerifySuccess(false);
                    }, 1500);
                }
            })
            .catch((error) => {
                console.log('error', error);
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
                            onRefresh={onRefresh}
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
                            data={AllStatusData}
                            onSelect={setSelectedStatus}
                            onBack={() => setSelectedStatus(undefined)}
                            onConfirm={(val, remarks) => {
                                // if (remarks === '') {
                                //     ToastAndroid.show('Give remark', ToastAndroid.SHORT);
                                // } else {
                                    setShowVerifyModal(true);
                                    changeStatus(val, remarks);
                                // }
                            }}
                        />
                    ) : (
                        <HOSDetails
                            driveTime={hosDetails.driveTime}
                            shiftTime={hosDetails.shiftTime}
                            cycleTime={hosDetails.cycleTime}
                        />
                    )}

                    <View style={styles.bottomCard}>
                        {/* OBD/Geometris Section */}
                        {/* <HomeMenuCard
                            title="Vehicle Data (OBD)"
                            listItems={[
                                {
                                    title: isConnected 
                                        ? `Status: Connected` 
                                        : 'Connect ELD Device',
                                    count: geoData ? Math.round(geoData.speed) : undefined,
                                    onPress: handleVehicleDataPress
                                },
                                ...(geoData ? [
                                    {
                                        title: `Odometer: ${geoData.odometer.toFixed(1)} mi`,
                                        onPress: () => {}
                                    },
                                    {
                                        title: `Engine Hours: ${geoData.engineHours.toFixed(1)} hrs`,
                                        onPress: () => {}
                                    },
                                    {
                                        title: `VIN: ${geoData.vin}`,
                                        onPress: () => {}
                                    }
                                ] : [])
                            ]}
                        /> */}

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
                                    count: allCoDriver.length,
                                    onPress: () =>
                                        NavigationService.navigate('ApprovalRequestLogs', {
                                            name: 'Co-Driver Requests',
                                            type: 'coDriver'
                                        })
                                },
                                {
                                    title: 'Add Logs',
                                    count: allAddLogs.length,
                                    onPress: () =>
                                        NavigationService.navigate('ApprovalRequestLogs', {
                                            name: 'Add Logs',
                                            type: 'addLog'
                                        })
                                },
                                {
                                    title: 'Edit Logs',
                                    count: allEditLog.length,
                                    onPress: () =>
                                        NavigationService.navigate('ApprovalRequestLogs', {
                                            name: 'Edit Logs',
                                            type: 'editLog'
                                        })
                                },
                                {
                                    title: 'Reassign Logs',
                                    count: allReassignLog.length,
                                    onPress: () =>
                                        NavigationService.navigate('ApprovalRequestLogs', {
                                            name: 'Reassign Logs',
                                            type: 'reassignLog'
                                        })
                                },
                                {
                                    title: 'Unidentified Driving',
                                    count: allUnidentifiedDriving.length,
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
