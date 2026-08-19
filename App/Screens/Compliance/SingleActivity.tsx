import React, { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Container } from 'react-native-basic-elements';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSelector } from 'react-redux';

import AppStatusBar from '../../Components/AppStatusBar';
import HomeHeader from '../../Components/Headers/HomeHeader';
import ActivityCard from '../../Components/Compliance/ActivityCard';
import HOSChart from '../../Components/Compliance/HOSChart';
import { moderateScale } from '../../Constants/PixelRatio';
import { GRADIENT_HEADER } from '../../Constants/Theme';
import { HosDayRecord, HosGraphLogEntry } from '../../core/api/types/hosLog';
import { RootState } from '../../Redux/store';
import { useAppConfig } from '../../core/hooks/useAppConfig';
import { transformHOSGraphData, transformViolations } from '../../Utils/hos_chart/hosChartTransformer';
import { showError, showToast } from '../../Utils/toast';
import { SingleActivityTab } from '../../core/api/types/singleActivity';
import { useSingleActivityForm } from '../../core/hooks/useSingleActivityForm';
import { certifyActivityLog, updateActivity } from '../../core/api/services/singleActivity';
import ActivityTabs from '../../Components/Compliance/ActivityTabs';
import SingleActivityContent from '../../Components/Compliance/SingleActivityContent';
import Util from '../../Utils/util';




const SingleActivity = () => {
    const route = useRoute<any>();
    const navigation = useNavigation<any>();
    const record: HosDayRecord | undefined = route.params?.record;
    const { userInfo } = useSelector((state: RootState) => state.User);
    const { configData } = useAppConfig();

    const [selectedTab, setSelectedTab] =
        useState<SingleActivityTab>('log');

    const form = useSingleActivityForm({
        record,
        userInfo
    });

    const handleSubmitForm = useCallback(async () => {
        if (!record?.date) {
            showError('Activity date is unavailable');
            return;
        }

        const result = await updateActivity(
            record.date,
            form.values
        );

        if (result.message) {
            result.success
                ? showToast(result.message)
                : showError(result.message);
        }
    }, [record?.date, form.values]);

    const handleSignature = useCallback(async (signature: string) => {
        if (!record?.date) {
            showError('Activity date is unavailable');
            return;
        }

        const parsed = Util.parseSignatureData(signature);

        if (!parsed) {
            showError('Invalid signature data');
            return;
        }

        const result = await certifyActivityLog(
            record.date,
            parsed.uri,
            parsed.mimeType
        );

        if (result.message) {
            result.success
                ? showToast(result.message)
                : showError(result.message);
        }
    }, [record?.date]);

    const handleEditLog = useCallback(
        (log: HosGraphLogEntry) => {
            if (!record) {
                return;
            }
            navigation.navigate('EditDutyStatusLog', {
                log,
                record,
                timezone: configData?.timezone ?? ''
            });
        },
        [navigation, record, configData?.timezone]
    );

    const chartLines = transformHOSGraphData(
        record?.log.graph_data
    );

    const violations = transformViolations(
        record?.log.violation_data?.Shift_data
    );

    const formChange = {
        distance: form.setDistance,
        odometer: form.setOdometer,
        driverName: form.setDriverName,
        carrierName: form.setCarrierName,
        mainOfficeAddress: form.setMainOfficeAddress,
        homeTerminalAddress: form.setHomeTerminalAddress,
        coDriver: form.setSelectedCoDriver,
        origin: form.setOrigin,
        destination: form.setDestination
    };

    return (
        <Container>
            <AppStatusBar />

            <LinearGradient
                colors={GRADIENT_HEADER}
                style={styles.gradient}
            >
                <HomeHeader showBack />

                <View style={styles.bodyCard}>
                    {record ? (
                        <ActivityCard
                            date={record.date}
                            totalShiftTime={record.log.total_log_time}
                            isInspectionPending={record.log.inspection_exist}
                        />
                    ) : null}

                    <HOSChart
                        lineObject={chartLines}
                        violations={violations}
                        vehicleName={record?.log.vehicle?.[0]?.name}
                    />

                    <ActivityTabs
                        selectedTab={selectedTab}
                        onChange={setSelectedTab}
                    />

                    <SingleActivityContent
                        onEditLog={handleEditLog}
                        tab={selectedTab}
                        record={record?.log.graph_data}
                        timezone={configData?.timezone ?? ''}
                        formValues={form.values}
                        coDrivers={form.coDrivers}
                        onFormChange={formChange}
                        onSubmitForm={handleSubmitForm}
                        onSignature={handleSignature}
                    />
                </View>
            </LinearGradient>
        </Container>
    );
};

const styles = StyleSheet.create({
    gradient: {
        flex: 1
    },
    bodyCard: {
        backgroundColor: '#fff',
        paddingTop: moderateScale(20),
        flex: 1,
        zIndex: 1,
        borderTopRightRadius: moderateScale(40),
        borderTopLeftRadius: moderateScale(40)
    }
});

export default SingleActivity;


