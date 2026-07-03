import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View
} from 'react-native';
import React, { useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Container } from 'react-native-basic-elements';
import AppStatusBar from '../../Components/AppStatusBar';
import LinearGradient from 'react-native-linear-gradient';
import HomeHeader from '../../Components/Headers/HomeHeader';
import { moderateScale } from '../../Constants/PixelRatio';
import NavigationService from '../../Services/Navigation';
import { FONTS } from '../../Constants/Fonts';
import ActivityCard from '../../Components/Compliance/ActivityCard';
import moment from 'moment';
import HOSChart from '../../Components/Compliance/HOSChart';
import { useCompliance } from '../../core/hooks/useCompliance';
import { HosLogDayRecord } from '../../core/cache/complianceCache';

type HosDaySummary = { total_shift_time?: string };

function getHosDayValues(
    item: HosLogDayRecord | null | undefined
): unknown[] {
    if (!item) {
        return [];
    }
    const values = Object.values(item)[0];
    return Array.isArray(values) ? values : [];
}

function getHosDaySummary(dayValues: unknown[]): HosDaySummary | undefined {
    const summary = dayValues[0];
    if (summary && typeof summary === 'object') {
        return summary as HosDaySummary;
    }
    return undefined;
}

const Compliance = () => {
    const {
        todayData,
        hosData,
        chartData,
        loading,
        refreshing,
        fetchCompliance,
        refresh
    } = useCompliance();

    const isFirstFocus = useRef(true);

    useFocusEffect(
        useCallback(() => {
            fetchCompliance({ showLoading: isFirstFocus.current });
            if (isFirstFocus.current) {
                isFirstFocus.current = false;
            }
        }, [fetchCompliance])
    );

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
                                onRefresh={refresh}
                                colors={['#392969']}
                                tintColor="#392969"
                            />
                        }
                    >
                        <Text style={styles.headerText}>Last Activity, Today</Text>
                        {todayData && (() => {
                            const todayValues = getHosDayValues(todayData);
                            const todaySummary = getHosDaySummary(todayValues);
                            return (
                                <ActivityCard
                                    date={Object.keys(todayData)[0]}
                                    totalShiftTime={
                                        todaySummary?.total_shift_time ?? ''
                                    }
                                    onPress={() =>
                                        NavigationService.navigate('SingleActivity', {
                                            data: todayValues[0],
                                            date: Object.keys(todayData)[0],
                                            logData: todayValues[2],
                                            fromDetails: todayValues[1],
                                            odometer: todayValues[8],
                                            distance: todayValues[7],
                                            origin: todayValues[9],
                                            destination: todayValues[10],
                                            coDriver: todayValues[5]
                                        })
                                    }
                                />
                            );
                        })()}

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

                        {hosData.map((item, index) => {
                            const dayValues = getHosDayValues(item);
                            const daySummary = getHosDaySummary(dayValues);
                            return (
                                <ActivityCard
                                    key={index}
                                    date={Object.keys(item)[0]}
                                    totalShiftTime={
                                        daySummary?.total_shift_time ?? ''
                                    }
                                    onPress={() =>
                                        NavigationService.navigate('SingleActivity', {
                                            data: dayValues[0],
                                            date: Object.keys(item)[0],
                                            logData: dayValues[2],
                                            fromDetails: dayValues[1],
                                            odometer: dayValues[8],
                                            distance: dayValues[7],
                                            origin: dayValues[9],
                                            destination: dayValues[10],
                                            coDriver: dayValues[5]
                                        })
                                    }
                                />
                            );
                        })}
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