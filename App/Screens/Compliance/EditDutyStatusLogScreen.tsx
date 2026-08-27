import React, { useCallback, useState } from 'react';

import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    View
} from 'react-native';

import { AppButton, Container } from 'react-native-basic-elements';
import LinearGradient from 'react-native-linear-gradient';

import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';

import HOSChart from '../../Components/Compliance/HOSChart';

import { moderateScale } from '../../Constants/PixelRatio';
import { FONTS } from '../../Constants/Fonts';
import {
    transformHOSGraphData,
    transformViolations
} from '../../Utils/hos_chart/hosChartTransformer';
import { EditDutyStatusFormValues, EditDutyStatusNavigationParams } from '../../core/api/types/editDutyStatus';
import { useEditDutyStatus } from '../../core/hooks/useEditDutyStatus';
import { updateLogDutyStatus } from '../../core/api/services/editDutyStatus';
import EditDutyStatusHeader from '../../Components/Headers/EditDutyStatusHeader';
import TimeField from '../../Components/UI/TimeField';
import DutyStatusSelector from '../../Components/UI/DutyStatusSelector';
import LocationField from '../../Components/UI/LocationField';
import NotesField from '../../Components/UI/NotesField';
import AppStatusBar from '../../Components/AppStatusBar';
import HomeHeader from '../../Components/Headers/HomeHeader';
import { GRADIENT_HEADER } from '../../Constants/Theme';
import moment from 'moment';
import Util, { REFERENCE_DATE } from '../../Utils/util';
import ConfirmDutyStatusDialog from '../../Components/EditDutyStatusLog/ConfirmDutyStatusDialog';
import { HosGraphLogEntry } from '../../core/api/types/hosLog';
import { AllStatusData } from '../../core/shift_status';

type RouteParams = {
    EditDutyStatusLog: EditDutyStatusNavigationParams;
};

const EditDutyStatusLogScreen: React.FC = () => {
    const navigation = useNavigation();

    const route = useRoute<RouteProp<RouteParams, 'EditDutyStatusLog'>>();
    const { log, record, timezone } = route.params;

    

    const {
        form,
        saving,
        setSaving,
        setStartTime,
        setEndTime,
        setDutyStatus,
        setLocation,
        setNotes
    } = useEditDutyStatus(log);

    // The chart shows the whole day, not just this one log entry — reusing
    // the exact same transformers SingleActivity.tsx uses so this stays in
    // sync with the real chart's data contract rather than duplicating it.
    const chartLines = transformHOSGraphData(record?.log.graph_data);
    const violations = transformViolations(record?.log.violation_data?.Shift_data);
    // const minTime= moment(`${REFERENCE_DATE} ${log.start_log_time}`, "YYYY-MM-DD HH:mm:ss").toDate();
    // const maxTime= moment(`${REFERENCE_DATE} ${log.end_log_time}`, "YYYY-MM-DD HH:mm:ss").toDate();
    
    const [confirmVisible, setConfirmVisible] = useState(false);
    const [editedDailyLog, setEditedDailyLog] = useState<HosGraphLogEntry[]>([]);

    const handleSave = useCallback(() => {
        if (!form.location.trim()) {
            Alert.alert('Validation', 'Location is required.');
            return;
        }

        if (form.endTime.getTime() < form.startTime.getTime()) {
            Alert.alert('Validation', 'End time cannot be earlier than start time.');
            return;
        }

        if (!form.notes.trim()) {
            Alert.alert('Validation', 'Note is required.');
            return;
        }
        const dayLogList= record?.log?.graph_data;
        try{
            const editedLogs= calculateLogAdjustments(dayLogList,form);
            setEditedDailyLog(editedLogs);
            setConfirmVisible(true);
        }
        catch(error: any)
        {
            Alert.alert("Invalid Edit", error.message);
        }
        
        
        
    },[form]);

    /**
     * Calculates the cascading timeline adjustments when a log segment is expanded or moved.
     * Throws errors if FMCSA compliance rules are violated.
     * start time 12:00 -> end time 12:23:08 off duty
     * start time 12:23 -> end time 12:23 on duty
     * start time 12:23 -> end time 12:23 yard moves
     
     */
    
    // function calculateLogAdjustments(
    //     currentLogs: HosGraphLogEntry[],
    //     edit: EditDutyStatusFormValues
    //     ): HosGraphLogEntry[] {
    //     // 1. Sort logs chronologically to ensure adjacent neighbors are correct
    //     const sortedLogs = [...currentLogs].sort(
    //         (a, b) => new Date(a.start_log_time).getTime() - new Date(b.start_log_time).getTime()
    //     );
    //     console.log("<<< Sorted Logs >>> "+[...sortedLogs].map((log)=> `${log.start_log_time} ${log.end_log_time}` ));
    //     const targetIndex = sortedLogs.findIndex((itemLog) => itemLog.log_id === log.log_id);
    //     if (targetIndex === -1) {
    //         throw new Error("Target log segment not found.");
    //     }
    //     console.log("<<< traget Index >>> "+targetIndex);
    //     const targetLog = sortedLogs[targetIndex];
    //     console.log("<<< targetLog >>> "+`${targetLog.start_log_time} ${targetLog.end_log_time}`);
    //     // Convert target edit inputs to timestamps for precise arithmetic
        
    //     const targetNewStart = edit.startTime.getTime();
    //     const targetNewEnd = edit.endTime.getTime();
    //     console.log("<<< targetNewStart >>> "+targetNewStart);
    //     console.log("<<< targetNewEnd >>> "+targetNewEnd);

    //     if (targetNewStart >= targetNewEnd) {
    //         throw new Error("Start time must be before end time.");
    //     }

    //     // 2. Enforce FMCSA Rules on the targeted log itself
    //     if (!targetLog.isLogEditable) {
    //         const originalStart = new Date(targetLog.start_log_time).getUTCMilliseconds();
    //         const originalEnd = new Date(targetLog.end_log_time).getTime();
    //         if (targetNewStart > originalStart || targetNewEnd < originalEnd) {
    //         throw new Error("FMCSA Violation: Automatically recorded driving time cannot be shortened.");
    //         }
    //     }

    //     // 3. Create a deep copy clone of the timeline to manipulate
    //     const updatedLogs: HosGraphLogEntry[] = sortedLogs.map((log) => ({ ...log }));

    //     // Update the target log times directly
    //     updatedLogs[targetIndex].start_log_time = Util.convertDateToTimeStrFormat(edit.startTime); //edit.startTime.toISOString();
    //     updatedLogs[targetIndex].end_log_time = Util.convertDateToTimeStrFormat(edit.endTime); //edit.endTime.toISOString();
    //     updatedLogs[targetIndex].location_start = edit.location;
    //     updatedLogs[targetIndex].shift_id = edit.dutyStatus; 
    //     updatedLogs[targetIndex].log_name = AllStatusData.find((status)=> status.shift_status_id === edit.dutyStatus)?.name ?? ""; 
    //     updatedLogs[targetIndex].notes = edit.notes; 
    //     console.log("<<< target start_log_time >>> "+updatedLogs[targetIndex].start_log_time);
    //     console.log("<<< target end_log_time >>> "+updatedLogs[targetIndex].end_log_time);

    //     // 4. CASCADE BACKWARD: Adjust preceding neighbors (Log 1, Log 2... up to Target)
    //     let currentBoundaryStart = targetNewStart;
    //     for (let i = targetIndex - 1; i >= 0; i--) {
    //         const neighbor = updatedLogs[i];
    //         const neighborStart = new Date(neighbor.start_log_time).getTime();
    //         const neighborEnd = new Date(neighbor.end_log_time).getTime();
    //         console.log("<<< neighbor Index up >>> "+i);
    //         console.log("<<< neighborStart up >>> "+neighborStart);
    //         console.log("<<< neighborEnd up >>> "+neighborEnd);
    //         // If the neighbor's end time is now after our new boundary, it must shrink
    //         if (neighborEnd > currentBoundaryStart) {
    //         if (neighborStart >= currentBoundaryStart) {
    //             // The neighbor is completely swallowed/obliterated by the expansion
    //             if (!neighbor.isLogEditable) {
    //                 throw new Error("FMCSA Violation: Cannot overwrite automated driving log neighbors.");
    //             }
    //             // Mark for deletion by collapsing its time space to zero
    //             neighbor.start_log_time = `${new Date(currentBoundaryStart).getTime()}`;
    //             neighbor.end_log_time = `${new Date(currentBoundaryStart).getTime()}`;
    //         } else {
    //             // Neighbor is partially shrunk
    //             if (!neighbor.isLogEditable) {
    //             throw new Error("FMCSA Violation: Cannot shorten automated driving log neighbors.");
    //             }
    //             neighbor.end_log_time = `${new Date(currentBoundaryStart).getTime()}`;
    //             currentBoundaryStart = neighborStart; // Shift the boundary back
    //         }
    //         } else {
    //             // No overlap found; we can stop cascading backward
    //             break;
    //         }
    //     }

    //     // 5. CASCADE FORWARD: Adjust succeeding neighbors (Target up to Last Log)
    //     let currentBoundaryEnd = targetNewEnd;
    //     for (let i = targetIndex + 1; i < updatedLogs.length; i++) {
    //         const neighbor = updatedLogs[i];

    //         const neighborStart = new Date(neighbor.start_log_time).getTime();
    //         const neighborEnd = new Date(neighbor.end_log_time).getTime();
    //         console.log("<<< neighbor Index down >>> "+i);
    //         console.log("<<< neighborStart down >>> "+ neighbor.start_log_time +" " +neighborStart);
    //         console.log("<<< neighborEnd down >>> "+ neighbor.end_log_time +" "+neighborEnd);
    //         // If the neighbor's start time is now before our new boundary, it must shrink
    //         if (neighborStart < currentBoundaryEnd) {
    //         if (neighborEnd <= currentBoundaryEnd) {
    //             // The neighbor is completely swallowed/obliterated
    //             if (!neighbor.isLogEditable) {
    //             throw new Error("FMCSA Violation: Cannot overwrite automated driving log neighbors.");
    //             }
    //             neighbor.start_log_time = `${new Date(currentBoundaryEnd).getTime()}`;
    //             neighbor.end_log_time = `${new Date(currentBoundaryEnd).getTime()}`;
    //         } else {
    //             // Neighbor is partially shrunk
    //             if (!neighbor.isLogEditable) {
    //             throw new Error("FMCSA Violation: Cannot shorten automated driving log neighbors.");
    //             }
    //             neighbor.start_log_time = `${new Date(currentBoundaryEnd).getTime()}`;
    //             currentBoundaryEnd = neighborEnd; // Shift the boundary forward
    //         }
    //         } else {
    //         // No overlap found; we can stop cascading forward
    //         break;
    //         }
    //     }

    //     // 6. Filter out swallowed segments (start time === end time) unless they are core structural placeholders
    //     return updatedLogs.filter((log) => log.start_log_time !== log.end_log_time);
    // }

    function calculateLogAdjustments(
        currentLogs: HosGraphLogEntry[],
        edit: EditDutyStatusFormValues
        ): HosGraphLogEntry[] {
        // 1. Sort logs chronologically to ensure adjacent neighbors are correct
        const sortedLogs = [...currentLogs].sort(
            (a, b) => Util.getSecondsFromMidnight(a.start_log_time,timezone) - Util.getSecondsFromMidnight(b.start_log_time,timezone)
        );
        //console.log("<<< Sorted Logs >>> "+[...sortedLogs].map((log)=> `${log.start_log_time} ${log.end_log_time}` ));
        const targetIndex = sortedLogs.findIndex((itemLog) => itemLog.log_id === log.log_id);
        if (targetIndex === -1) {
            throw new Error("Target log segment not found.");
        }
        //console.log("<<< traget Index >>> "+targetIndex);
        const targetLog = sortedLogs[targetIndex];
        //console.log("<<< targetLog >>> "+`${targetLog.start_log_time} ${targetLog.end_log_time}`);
        // Convert target edit inputs to timestamps for precise arithmetic
        const edit_start_time = `${edit.startTime.getHours()}:${edit.startTime.getMinutes()}:${edit.startTime.getSeconds()}`;
        const edit_end_time = `${edit.endTime.getHours()}:${edit.endTime.getMinutes()}:${edit.endTime.getSeconds()}`;
        const targetNewStart = Util.getSecondsFromMidnight(edit_start_time,timezone);
        const targetNewEnd = Util.getSecondsFromMidnight(edit_end_time,timezone);
        // console.log("<<< targetNewStart >>> "+targetNewStart);
        // console.log("<<< targetNewEnd >>> "+targetNewEnd);

        if (targetNewStart >= targetNewEnd) {
            throw new Error("Start time must be before end time.");
        }

        // 2. Enforce FMCSA Rules on the targeted log itself
        if (!targetLog.isLogEditable) {
            const originalStart = Util.getSecondsFromMidnight(targetLog.start_log_time,timezone);
            const originalEnd = Util.getSecondsFromMidnight(targetLog.end_log_time,timezone);
            if (targetNewStart > originalStart || targetNewEnd < originalEnd) {
            throw new Error("FMCSA Violation: Automatically recorded driving time cannot be shortened.");
            }
        }

        // 3. Create a deep copy clone of the timeline to manipulate
        const updatedLogs: HosGraphLogEntry[] = sortedLogs.map((log) => ({ ...log }));

        // Update the target log times directly
        updatedLogs[targetIndex].start_log_time = Util.convertDateToTimeStrFormat(edit.startTime); //edit.startTime.toISOString();
        updatedLogs[targetIndex].end_log_time = Util.convertDateToTimeStrFormat(edit.endTime); //edit.endTime.toISOString();
        updatedLogs[targetIndex].location_start = edit.location;
        updatedLogs[targetIndex].shift_id = edit.dutyStatus; 
        updatedLogs[targetIndex].log_name = AllStatusData.find((status)=> status.shift_status_id === edit.dutyStatus)?.name ?? ""; 
        updatedLogs[targetIndex].notes = edit.notes; 
        // console.log("<<< target start_log_time >>> "+updatedLogs[targetIndex].start_log_time);
        // console.log("<<< target end_log_time >>> "+updatedLogs[targetIndex].end_log_time);

        // 4. CASCADE BACKWARD: Adjust preceding neighbors (Log 1, Log 2... up to Target)
        let currentBoundaryStart = targetNewStart;
        for (let i = targetIndex - 1; i >= 0; i--) {
            const neighbor = updatedLogs[i];
            const neighborStart = Util.getSecondsFromMidnight(neighbor.start_log_time,timezone);
            const neighborEnd = Util.getSecondsFromMidnight(neighbor.end_log_time,timezone);
            // console.log("<<< neighbor Index up >>> "+i);
            // console.log("<<< neighborStart up >>> "+neighborStart);
            // console.log("<<< neighborEnd up >>> "+neighborEnd);
            // If the neighbor's end time is now after our new boundary, it must shrink
            if (neighborEnd > currentBoundaryStart) {
            if (neighborStart >= currentBoundaryStart) {
                // The neighbor is completely swallowed/obliterated by the expansion
                if (!neighbor.isLogEditable) {
                    throw new Error("FMCSA Violation: Cannot overwrite automated driving log neighbors.");
                }
                // Mark for deletion by collapsing its time space to zero
                neighbor.start_log_time = `${Util.convertSecondsToTimeString(currentBoundaryStart)}`;
                neighbor.end_log_time = `${Util.convertSecondsToTimeString(currentBoundaryStart)}`;
            } else {
                // Neighbor is partially shrunk
                if (!neighbor.isLogEditable) {
                throw new Error("FMCSA Violation: Cannot shorten automated driving log neighbors.");
                }
                neighbor.end_log_time = `${Util.convertSecondsToTimeString(currentBoundaryStart)}`;
                currentBoundaryStart = neighborStart; // Shift the boundary back
            }
            } else {
                // No overlap found; we can stop cascading backward
                break;
            }
        }

        // 5. CASCADE FORWARD: Adjust succeeding neighbors (Target up to Last Log)
        let currentBoundaryEnd = targetNewEnd;
        for (let i = targetIndex + 1; i < updatedLogs.length; i++) {
            const neighbor = updatedLogs[i];

            const neighborStart = Util.getSecondsFromMidnight(neighbor.start_log_time,timezone);
            const neighborEnd = Util.getSecondsFromMidnight(neighbor.end_log_time,timezone);
            // console.log("<<< neighbor Index down >>> "+i);
            // console.log("<<< neighbor Index down currentBoundaryStart>>> "+currentBoundaryStart);
            // console.log("<<< neighbor Index down currentBoundaryEnd>>> "+currentBoundaryEnd);
            // console.log("<<< neighborStart down >>> "+ neighbor.start_log_time +" " +neighborStart);
            // console.log("<<< neighborEnd down >>> "+ neighbor.end_log_time +" "+neighborEnd);
            // If the neighbor's start time is now before our new boundary, it must shrink
            if (neighborStart < currentBoundaryEnd) {
            if (neighborEnd <= currentBoundaryEnd) {
                // The neighbor is completely swallowed/obliterated
                if (!neighbor.isLogEditable) {
                    throw new Error("FMCSA Violation: Cannot overwrite automated driving log neighbors.");
                }
                neighbor.start_log_time = `${Util.convertSecondsToTimeString(currentBoundaryEnd)}`;
                neighbor.end_log_time = `${Util.convertSecondsToTimeString(currentBoundaryEnd)}`;

                // console.log("<<< neighborStart down after edit >>> "+ neighbor.start_log_time);
                // console.log("<<< neighborEnd down after edit >>> "+ neighbor.end_log_time);
            } else {
                // Neighbor is partially shrunk
                if (!neighbor.isLogEditable) {
                throw new Error("FMCSA Violation: Cannot shorten automated driving log neighbors.");
                }
                neighbor.start_log_time = `${Util.convertSecondsToTimeString(currentBoundaryEnd)}`;
                // console.log("<<< neighborStart down else after edit >>> "+ neighbor.start_log_time);
                currentBoundaryEnd = neighborEnd; // Shift the boundary forward
            }
            } else {
            // No overlap found; we can stop cascading forward
            break;
            }
        }

        // 6. Filter out swallowed segments (start time === end time) unless they are core structural placeholders
        return updatedLogs.filter((log) => log.start_log_time !== log.end_log_time);
    }

    const performSave = useCallback(async () => {
        setConfirmVisible(false);
 
        try {
            setSaving(true);
            
            const result = await updateLogDutyStatus(editedDailyLog, record.date);
 
            if (result.success) {
                Alert.alert('Success', result.message ?? 'Duty status updated successfully.', [
                    {
                        text: 'OK',
                        onPress: () => navigation.goBack()
                    }
                ]);
            } else if (result.message) {
                Alert.alert('Error', result.message);
            }
        } catch (error) {
            if (__DEV__) {
                console.warn('Failed to update duty status', error);
            }
            Alert.alert('Error', 'Unable to update duty status. Please try again.');
        } finally {
            setSaving(false);
        }
    }, [form, log, record?.date, navigation, setSaving]);

    return (
        <Container>
            <AppStatusBar />

            <LinearGradient
                colors={GRADIENT_HEADER}
                style={{flex:1}}
            >
                <HomeHeader showBack />
                <KeyboardAvoidingView
                    style={styles.container}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                >
                    <EditDutyStatusHeader
                        onBack={() => navigation.goBack()}
                        totalShiftTime={record?.log.total_log_time}
                        isInspectionPending={record?.log.inspection_exist}
                    />

                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                        contentContainerStyle={styles.content}
                    >
                        {/*
                            Reuses the existing HOSChart component with the full
                            day's data — this screen does not rebuild or duplicate
                            chart-drawing logic.
                        */}
                        <View style={styles.chartContainer}>
                            <HOSChart
                                lineObject={chartLines}
                                violations={violations}
                                vehicleName={record?.log.vehicle?.[0]?.name}
                            />
                        </View>

                        <View style={styles.timeRow}>
                            <TimeField
                                label="Start Time"
                                value={form.startTime}
                                timezoneLabel={timezone || 'GMT'}
                                // minTime={minTime}
                                // maxTime={maxTime}
                                onChange={setStartTime}
                            />

                            <View style={styles.timeGap} />

                            <TimeField
                                label="End Time"
                                value={form.endTime}
                                timezoneLabel={timezone || 'GMT'}
                                // minTime={minTime}
                                // maxTime={maxTime}
                                onChange={setEndTime}
                            />
                        </View>

                        <DutyStatusSelector
                            value={form.dutyStatus}
                            onChange={setDutyStatus}
                        />

                        <LocationField
                            value={form.location}
                            onChange={setLocation}
                        />

                        <NotesField
                            value={form.notes}
                            onChange={setNotes}
                        />

                        <AppButton
                            title={saving ? 'Saving...' : 'Save'}
                            disabled={saving}
                            onPress={handleSave}
                            style={styles.saveButton}
                            textStyle={styles.saveButtonText}
                        />
                    </ScrollView>

                    {saving && (
                        <View style={styles.loadingOverlay}>
                            <ActivityIndicator size="large" color="#FFFFFF" />
                        </View>
                    )}

                    <ConfirmDutyStatusDialog
                        visible={confirmVisible}
                        message="Do you want to insert a past duty status?"
                        cancelLabel="No"
                        confirmLabel="Yes"
                        onCancel={() => setConfirmVisible(false)}
                        onConfirm={performSave}
                    />

                </KeyboardAvoidingView>
            </LinearGradient>
            </Container>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF'
    },

    content: {
        paddingHorizontal: moderateScale(14),
        paddingBottom: moderateScale(30),
        gap: moderateScale(25)
    },

    chartContainer: {
        marginHorizontal: moderateScale(-14)
    },

    timeRow: {
        flexDirection: 'row'
    },

    timeGap: {
        width: moderateScale(14)
    },

    saveButton: {
        height: moderateScale(56),
        borderRadius: moderateScale(15),
        backgroundColor: '#1475ED'
    },

    saveButtonText: {
        color: '#FFFFFF',
        fontFamily: FONTS.ProductSans.regular,
        fontSize: moderateScale(18)
    },

    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.25)',
        alignItems: 'center',
        justifyContent: 'center'
    }
});

export default EditDutyStatusLogScreen;