import {
    ActivityIndicator,
    Dimensions,
    Image,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View
} from 'react-native';
import React, { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Container, Icon } from 'react-native-basic-elements';
import AppStatusBar from '../../Components/AppStatusBar';
import LinearGradient from 'react-native-linear-gradient';
import HomeHeader from '../../Components/Headers/HomeHeader';
import { moderateScale } from '../../Constants/PixelRatio';
import NavigationService from '../../Services/Navigation';
import { FONTS } from '../../Constants/Fonts';
import ActivityCard from '../../Components/Compliance/ActivityCard';
import DashboardService from '../../Services/Dashboard';
import moment from 'moment';
import HOSChart from '../../Components/Compliance/HOSChart';
import { HOSChartData } from '../../Model/Dashboard';

const { width } = Dimensions.get('screen');
const Compliance = () => {
    const [todayData, setTodaysData] = useState<Record<string, any> | null>(null);
    const [hosData, setHosData] = useState<Array<any>>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [chartData, setChartData] = useState<HOSChartData>({
        graph_data: [],
        violation_data: {
            Shift_data: [],
            total_shift_time: ''
        }
    });

    const isFirstFocus = useRef(true);

    useFocusEffect(
        useCallback(() => {
            getHOSData(isFirstFocus.current);
            getHOSChartData();
            if (isFirstFocus.current) {
                isFirstFocus.current = false;
            }
        }, [])
    );

    const getHOSChartData = () => {
        return DashboardService.getHOSChartData(moment().format('YYYY-MM-DD'))
            .then((result) => {
                if (result.status === 'success') {
                    setChartData(result.data);
                }
            })
            .catch((error) => {
                console.log('error', error);
            });
    };

    const getHOSData = (showLoading = false) => {
        if (showLoading) {
            setLoading(true);
        }
        return DashboardService.getHOSData(
            moment().format('YYYY-MM-DD'),
            moment().subtract(7, 'days').format('YYYY-MM-DD')
        )
            .then((result) => {
                if (result.status === 'success') {
                    const data = result.log_data;
                    setTodaysData(
                        data.find((item: any) =>
                            Object.keys(item).includes(moment().format('YYYY-MM-DD'))
                        )
                    );

                    setHosData(
                        data.filter(
                            (item: any) =>
                                !Object.keys(item).includes(moment().format('YYYY-MM-DD'))
                        )
                    );
                }
            })
            .catch((error) => {
                console.log('error', error);
            })
            .finally(() => {
                if (showLoading) {
                    setLoading(false);
                }
            });
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        Promise.all([getHOSData(false), getHOSChartData()]).finally(() =>
            setRefreshing(false)
        );
    }, []);

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

                <View style={styles.bodyCard}>
                    <ScrollView
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                                colors={['#392969']}
                                tintColor="#392969"
                            />
                        }
                    >
                        <Text style={styles.headerText}>Last Activity, Today</Text>
                        {todayData && (
                            <ActivityCard
                                date={Object.keys(todayData)[0]}
                                totalShiftTime={
                                    Object.values(todayData)?.[0]?.[0]?.total_shift_time
                                }
                                onPress={() =>
                                    NavigationService.navigate('SingleActivity', {
                                        data: Object.values(todayData)?.[0]?.[0],
                                        date: Object.keys(todayData)[0],
                                        logData: Object.values(todayData)?.[0]?.[2],
                                        fromDetails: Object.values(todayData)?.[0]?.[1],
                                        odometer: Object.values(todayData)?.[0]?.[8],
                                        distance: Object.values(todayData)?.[0]?.[7],
                                        origin: Object.values(todayData)?.[0]?.[9],
                                        destination: Object.values(todayData)?.[0]?.[10],
                                        coDriver: Object.values(todayData)?.[0]?.[5]
                                    })
                                }
                            />
                        )}

                        <HOSChart
                            lineObject={chartData.graph_data.map((item) => {
                                return {
                                    start: item[3],
                                    end: item[4],
                                    status: item[1]
                                };
                            })}
                            violations={chartData.violation_data.Shift_data.map(
                                (item) => {
                                    return {
                                        start: moment(item.violation_startTime).format(
                                            'HH:mm'
                                        ),
                                        end: moment(item.violation_endTime).format(
                                            'HH:mm'
                                        )
                                    };
                                }
                            )}
                            vehicleName={chartData.vehicle?.[0]?.name}
                        />

                        <View
                            style={{
                                backgroundColor: '#D9D9D9',
                                paddingHorizontal: moderateScale(15),
                                paddingVertical: moderateScale(10),
                                marginVertical: moderateScale(8)
                            }}
                        >
                            <Text
                                style={{
                                    color: '#33404F',
                                    fontFamily: FONTS.ProductSans.regular,
                                    fontSize: moderateScale(18)
                                }}
                            >
                                Last 7 days
                            </Text>
                        </View>

                        {hosData.map((item: any, index: number) => {
                            return (
                                <ActivityCard
                                    key={index}
                                    date={Object.keys(item)[0]}
                                    totalShiftTime={
                                        Object.values(item)?.[0]?.[0]?.total_shift_time
                                    }
                                    onPress={() =>
                                        NavigationService.navigate('SingleActivity', {
                                            data: Object.values(item)?.[0]?.[0],
                                            date: Object.keys(item)[0],
                                            logData: Object.values(item)?.[0]?.[2],
                                            fromDetails: Object.values(item)?.[0]?.[1],
                                            odometer: Object.values(item)?.[0]?.[8],
                                            distance: Object.values(item)?.[0]?.[7],
                                            origin: Object.values(item)?.[0]?.[9],
                                            destination: Object.values(item)?.[0]?.[10],
                                            coDriver: Object.values(item)?.[0]?.[5]
                                        })
                                    }
                                />
                            );
                        })}

                        {/* <ActivityCard />
                        <ActivityCard />
                        <ActivityCard />
                        <ActivityCard />
                        <ActivityCard />
                        <ActivityCard /> */}
                    </ScrollView>
                </View>
            </LinearGradient>
        </Container>
    );
};

export default Compliance;

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
        paddingLeft: moderateScale(15)
    },
    headerText: {
        color: '#33404F',
        fontFamily: FONTS.ProductSans.regular,
        fontSize: moderateScale(17),
        marginLeft: moderateScale(15)
    }
});
