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
import { EditDutyStatusNavigationParams } from '../../core/api/types/editDutyStatus';
import { useEditDutyStatus } from '../../core/hooks/useEditDutyStatus';
import { updateDutyStatus } from '../../core/api/services/editDutyStatus';
import EditDutyStatusHeader from '../../Components/Headers/EditDutyStatusHeader';
import TimeField from '../../Components/UI/TimeField';
import DutyStatusSelector from '../../Components/UI/DutyStatusSelector';
import LocationField from '../../Components/UI/LocationField';
import NotesField from '../../Components/UI/NotesField';
import AppStatusBar from '../../Components/AppStatusBar';
import HomeHeader from '../../Components/Headers/HomeHeader';
import { GRADIENT_HEADER } from '../../Constants/Theme';
import moment from 'moment';
import { REFERENCE_DATE } from '../../Utils/util';
import ConfirmDutyStatusDialog from '../../Components/EditDutyStatusLog/ConfirmDutyStatusDialog';

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
    const minTime= moment(`${REFERENCE_DATE} ${log.start_log_time}`, "YYYY-MM-DD HH:mm:ss").toDate();
    const maxTime= moment(`${REFERENCE_DATE} ${log.end_log_time}`, "YYYY-MM-DD HH:mm:ss").toDate();
    
    const [confirmVisible, setConfirmVisible] = useState(false);

    const handleSave = useCallback(() => {
        if (!form.location.trim()) {
            Alert.alert('Validation', 'Location is required.');
            return;
        }

        if (form.endTime.getTime() < form.startTime.getTime()) {
            Alert.alert('Validation', 'End time cannot be earlier than start time.');
            return;
        }
        // Validation passed — ask for confirmation before this actually
        // reaches the endpoint. The API call itself lives in performSave,
        // which is only ever invoked from the dialog's "Yes" button, so
        // there's no path from tapping Save straight to a network request.
        setConfirmVisible(true);
        
    },[form]);


    const performSave = useCallback(async () => {
        setConfirmVisible(false);
 
        try {
            setSaving(true);
 
            const result = await updateDutyStatus(log, record.date, form);
 
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
                                minTime={minTime}
                                maxTime={maxTime}
                                onChange={setStartTime}
                            />

                            <View style={styles.timeGap} />

                            <TimeField
                                label="End Time"
                                value={form.endTime}
                                timezoneLabel={timezone || 'GMT'}
                                minTime={minTime}
                                maxTime={maxTime}
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