import {
    ActivityIndicator,
    InteractionManager,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View
} from 'react-native';
import React, { useCallback, useRef, useState } from 'react';
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

import { useCompliance } from '../../core/hooks/useCompliance';
import { HosDayRecord } from '../../core/api/types/hosLog';
import { THEME, GRADIENT_HEADER } from '../../Constants/Theme';
import HOSChart from '../../Components/Compliance/HOSChart';
import { transformHOSGraphData, transformViolations } from '../../Utils/hos_chart/hosChartTransformer';

// Matches HOSChart's natural rendered height (60 + 20 + yGap*2 = 100) so
// the loading placeholder doesn't cause a layout jump when it's swapped
// for the real chart.
const CHART_HEIGHT = moderateScale(100);

const Compliance = () => {
    const {
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

    const [selectedIndex, setSelectedIndex] = useState(0);
    const [chartLoading, setChartLoading] = useState(false);
    const displayedRecord = hosRecords[selectedIndex] ?? null;
 
    /**
     * Re-rendering HOSChart means rebuilding its whole SVG path (every
     * duty-status segment, every violation shade) synchronously — on a
     * slow device with a busy day's data that can take long enough to be
     * felt as a jank/freeze with no feedback. Rather than swap the data
     * directly on press:
     *   1. Show the spinner immediately (cheap render, paints fast).
     *   2. Wait for any in-flight touch/press animation to finish
     *      (InteractionManager) so we're not competing with it.
     *   3. Wait one more frame so the spinner has actually painted before
     *      we trigger the expensive update.
     *   4. Swap the data (the expensive render happens here).
     *   5. Wait one more frame so that render has had a chance to commit
     *      before hiding the spinner.
     */
    const navigateDay = useCallback(
        (nextIndex: number) => {
            if (chartLoading || nextIndex < 0 || nextIndex >= hosRecords.length) {
                return;
            }
 
            setChartLoading(true);
 
            InteractionManager.runAfterInteractions(() => {
                requestAnimationFrame(() => {
                    setSelectedIndex(nextIndex);
                    requestAnimationFrame(() => {
                        setChartLoading(false);
                    });
                });
            });
        },
        [hosRecords.length, chartLoading]
    );
 
    const handlePrevious = useCallback(
        () => navigateDay(selectedIndex - 1),
        [navigateDay, selectedIndex]
    );
    const handleNext = useCallback(
        () => navigateDay(selectedIndex + 1),
        [navigateDay, selectedIndex]
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
                        <Text style={styles.headerText}>
                            {selectedIndex === 0 ? 'Last Activity, Today' : 'Last Activity'}
                        </Text>
                        {displayedRecord ? (
                            <ActivityCard
                                date={displayedRecord.date}
                                totalShiftTime={
                                    displayedRecord.log.total_log_time
                                }
                                isInspectionPending={displayedRecord.log.inspection_exist}
                                onPress={() => openDay(displayedRecord)}
                                onPrevious={handlePrevious}
                                onNext={handleNext}
                                disablePrevious={chartLoading || selectedIndex <= 0}
                                disableNext={
                                    chartLoading || selectedIndex >= hosRecords.length - 1
                                }
                            />
                        ) : null}

                        {/* <HOSChart
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
                        /> */}

                        {chartLoading ? (
                            <View style={styles.chartLoading}>
                                <ActivityIndicator
                                    size="small"
                                    color={THEME.colors.primary}
                                />
                            </View>
                        ) : (
                            <HOSChart
                            lineObject={transformHOSGraphData(displayedRecord?.log.graph_data)}
                            violations={transformViolations(displayedRecord?.log.violation_data.Shift_data)}
                            vehicleName={displayedRecord?.log.vehicle?.[0]?.name}
                        />

                        )}

                        {/* <HOSChart
                            lineObject={transformHOSGraphData(todayRecord?.log.graph_data)}
                            violations={transformViolations(todayRecord?.log.violation_data.Shift_data)}
                            vehicleName={todayRecord?.log.vehicle?.[0]?.name}
                        /> */}

                        <View style={styles.sectionDivider}>
                            <Text style={styles.sectionTitle}>Last 7 days</Text>
                        </View>

                        {hosRecords.map((record,index) => (
                            
                            index!=0?<ActivityCard
                                key={record.date}
                                date={record.date}
                                totalShiftTime={record.log.total_log_time}
                                isInspectionPending={record.log.inspection_exist}
                                onPress={() => openDay(record)}
                            /> : null
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
    chartLoading: {
        height: CHART_HEIGHT,
        justifyContent: 'center',
        alignItems: 'center'
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