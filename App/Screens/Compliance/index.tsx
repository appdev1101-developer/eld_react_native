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
import { THEME, GRADIENT_HEADER } from '../../Constants/Theme';

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

                <View style={styles.bodyCard}>
                    <ScrollView
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={refresh}
                                colors={[THEME.colors.primary]}
                                tintColor={THEME.colors.primary}
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

                        <View style={styles.sectionDivider}>
                            <Text style={styles.sectionTitle}>Last 7 days</Text>
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
        backgroundColor: THEME.colors.surface,
        paddingTop: moderateScale(24),
        flex: 1,
        zIndex: 1,
        borderTopRightRadius: THEME.radius.sheet,
        borderTopLeftRadius: THEME.radius.sheet
    },
    header: {
        height: moderateScale(35),
        paddingLeft: moderateScale(15)
    },
    headerText: {
        color: THEME.colors.textPrimary,
        fontFamily: FONTS.ProductSans.bold,
        fontSize: moderateScale(17),
        marginLeft: moderateScale(15),
        letterSpacing: 0.2
    },
    sectionDivider: {
        backgroundColor: THEME.colors.surfaceElevated,
        paddingHorizontal: moderateScale(15),
        paddingVertical: moderateScale(12),
        marginVertical: moderateScale(8)
    },
    sectionTitle: {
        color: THEME.colors.textPrimary,
        fontFamily: FONTS.ProductSans.bold,
        fontSize: moderateScale(17),
        letterSpacing: 0.2
    }
});