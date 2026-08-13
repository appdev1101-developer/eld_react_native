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
import { HosDayRecord } from '../../core/api/types/hosLog';
import { THEME, GRADIENT_HEADER } from '../../Constants/Theme';

const Compliance = () => {
    const {
        todayRecord,
        hosRecords,
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

    const openDay = (record: HosDayRecord) => {
        // Pass the full record — the day's graph/violation/vehicle data is
        // already loaded here, so SingleActivity no longer needs its own
        // redundant fetch just to show the chart for a day we already have.
        NavigationService.navigate('SingleActivity', { record });
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
                        {todayRecord ? (
                            <ActivityCard
                                date={todayRecord.date}
                                totalShiftTime={
                                    todayRecord.log.total_log_time
                                }
                                isInspectionPending={todayRecord.log.inspection_exist}
                                onPress={() => openDay(todayRecord)}
                            />
                        ) : null}

                        <HOSChart
                            lineObject={(todayRecord?.log.graph_data ?? []).map((entry) => ({
                                start: entry.start_log_time,
                                end: entry.end_log_time,
                                status: entry.shift_id
                            }))}
                            violations={(
                                todayRecord?.log.violation_data.Shift_data ?? []
                            ).map((violation) => ({
                                start: moment(violation.violation_startTime).format('HH:mm'),
                                end: moment(violation.violation_endTime).format('HH:mm')
                            }))}
                            vehicleName={todayRecord?.log.vehicle?.[0]?.name}
                        />

                        <View style={styles.sectionDivider}>
                            <Text style={styles.sectionTitle}>Last 7 days</Text>
                        </View>

                        {hosRecords.map((record) => (
                            <ActivityCard
                                key={record.date}
                                date={record.date}
                                totalShiftTime={record.log.total_log_time}
                                isInspectionPending={record.log.inspection_exist}
                                onPress={() => openDay(record)}
                            />
                        ))}
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