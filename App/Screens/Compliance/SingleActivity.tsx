import {
    Dimensions,
    FlatList,
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    View
} from 'react-native';
import React, { useMemo, useRef, useState } from 'react';
import {
    AppButton,
    AppTextInput,
    Container,
    Picker,
    Text
} from 'react-native-basic-elements';
import LinearGradient from 'react-native-linear-gradient';
import AppStatusBar from '../../Components/AppStatusBar';
import HomeHeader from '../../Components/Headers/HomeHeader';
import { moderateScale } from '../../Constants/PixelRatio';
import ActivityCard from '../../Components/Compliance/ActivityCard';
import { FONTS } from '../../Constants/Fonts';
import { useRoute } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import SignatureScreen, { SignatureViewRef } from 'react-native-signature-canvas';
import moment from 'moment-timezone';
import { HosDayRecord } from '../../core/api/types/hosLog';
import { hosApi } from '../../core/api/services/hosApi';
import { isSuccess } from '../../core/api/types/common';
import HOSChart from '../../Components/Compliance/HOSChart';
import { requireOnline } from '../../core/network/requireOnline';
import { showError, showToast } from '../../Utils/toast';
import { getApiErrorMessage } from '../../Utils/apiErrorMessage';
import { GRADIENT_HEADER } from '../../Constants/Theme';
import { RootState } from '../../Redux/store';
import { useAppConfig } from '../../core/hooks/useAppConfig';

const { width } = Dimensions.get('screen');

/**
 * Formats one graph_data entry's time range for the Log tab, e.g.
 * "12:00 AM MST | 22h 50m". The old endpoint apparently pre-formatted this
 * server-side (the code read it as two positional array fields); the new
 * endpoint only gives raw start/end "HH:mm:ss", so it's built client-side
 * here instead.
 */
function formatLogTimeRange(
    date: string,
    startTime: string,
    endTime: string,
    timezone: string
): string {
    const startMoment = moment.tz(`${date} ${startTime}`, 'YYYY-MM-DD HH:mm:ss', timezone);
    const endMoment = moment.tz(`${date} ${endTime}`, 'YYYY-MM-DD HH:mm:ss', timezone);
    if (!startMoment.isValid()) {
        return `${startTime} - ${endTime}`;
    }

    const zoneAbbr = startMoment.format('z');
    const durationMinutes = Math.max(0, endMoment.diff(startMoment, 'minutes'));
    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;
    const durationLabel = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

    return `${startMoment.format('h:mm A')} ${zoneAbbr} | ${durationLabel}`;
}

const SingleActivity = () => {
    const ref = useRef<SignatureViewRef>(null);
    const route = useRoute<any>();
    const record: HosDayRecord | undefined = route.params?.record;
    const { userData } = useSelector((state: RootState) => state.User);
    const { configData } = useAppConfig();

    const [selectedTab, setSelectedTab] = useState<number>(1);

    const [distance, setDistance] = useState<string>(
        record?.log.distance_diffr?.toString() ?? ''
    );
    const [odometer, setOdometer] = useState<string>(
        record?.log.odometer?.toString() ?? ''
    );
    // NOTE: the old positional endpoint included driver/carrier/office
    // details at fromDetails[0]/[3] — the new hos/mobile/log/data response
    // has no equivalent fields at all. Driver name reasonably defaults to
    // the logged-in driver (this form is for their own day's log); carrier
    // name and office addresses have no current source and are left blank
    // pending either a backend field or a separate profile/carrier
    // endpoint — worth flagging to the backend team rather than guessing.
    const [driverName, setDriverName] = useState<string>(
        `${userData?.first_name ?? ''} ${userData?.last_name ?? ''}`.trim()
    );
    const [carrierName, setCarrierName] = useState<string>('');
    const [mainOfficeAddress, setMainOfficeAddress] = useState<string>('');
    const [homeTerminalAddress, setHomeTerminalAddress] = useState<string>('');
    const [coDriver, setCoDriver] = useState<
        Array<{ id: number; first_name: string; last_name: string }>
    >(record?.log.coDriver_list ?? []);
    const [origin, setOrigin] = useState<string>(record?.log.start_location ?? 'None');
    const [destination, setDestination] = useState<string>(
        record?.log.location_end ?? 'None'
    );
    const [selecetdCoDriver, setSelectedCoDriver] = useState<string>('');

    // The day's chart/log/violation data now comes straight from the
    // record passed via navigation (Compliance/index.tsx already has it
    // loaded) — no separate fetch needed here anymore.
    const lineObject = useMemo(
        () =>
            (record?.log.graph_data ?? []).map((entry) => ({
                start: entry.start_log_time,
                end: entry.end_log_time,
                status: entry.shift_id
            })),
        [record]
    );

    const violations = useMemo(
        () =>
            (record?.log.violation_data.Shift_data ?? []).map((violation) => ({
                start: moment(violation.violation_startTime).format('HH:mm'),
                end: moment(violation.violation_endTime).format('HH:mm')
            })),
        [record]
    );

    const uploadImage = async (base64String: string) => {
        const mimeTypeMatch = base64String.match(/data:(.*);base64/);
        if (!mimeTypeMatch) {
            console.error('Invalid Base64 format');
            return;
        }

        const mimeType = mimeTypeMatch[1];
        const base64Data = base64String.split(',')[1];
        const signatureUri = `data:${mimeType};base64,${base64Data}`;

        if (!requireOnline()) {
            return;
        }

        try {
            const result = await hosApi.certifyLogSignature(
                record?.date ?? '',
                signatureUri,
                mimeType
            );
            showToast(result.message);
            if (!isSuccess(result)) {
                return;
            }
        } catch (error: unknown) {
            showError(getApiErrorMessage(error, 'Failed to certify log'));
        }
    };

    const handleEditForm = () => {
        if (!requireOnline()) {
            return;
        }

        const data = {
            first_name: driverName.split(' ')[0],
            last_name: driverName.split(' ')[1],
            date: record?.date ?? '',
            cariier_name: carrierName,
            main_office_address: mainOfficeAddress,
            home_terminal_address: homeTerminalAddress,
            distance: distance,
            odometer: odometer,
            fromLoc: origin,
            toLoc: destination,
            notes: '',
            codriver_id: selecetdCoDriver
        };

        hosApi.editActivity(data)
            .then((result) => {
                showToast(result.message);
                if (!isSuccess(result)) {
                    return;
                }
            })
            .catch((error) => {
                showError(getApiErrorMessage(error, 'Failed to update activity'));
            });
    };

    return (
        <Container>
            <AppStatusBar />

            <LinearGradient
                colors={GRADIENT_HEADER}
                style={{ flex: 1 }}
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
                        lineObject={lineObject}
                        violations={violations}
                        vehicleName={record?.log.vehicle?.[0]?.name}
                    />

                    <View
                        style={{
                            backgroundColor: '#D9D9D9',
                            marginTop: moderateScale(8),
                            height: moderateScale(45),
                            flexDirection: 'row'
                        }}
                    >
                        <Pressable
                            style={{
                                flex: 1,
                                justifyContent: 'center',
                                alignItems: 'center',
                                borderBottomColor: '#392969',
                                borderBottomWidth:
                                    selectedTab === 1 ? moderateScale(7) : 0
                            }}
                            onPress={() => setSelectedTab(1)}
                        >
                            <Text
                                style={{
                                    color: '#33404F',
                                    fontFamily: FONTS.ProductSans.regular,
                                    fontSize: moderateScale(18)
                                }}
                            >
                                Log
                            </Text>
                        </Pressable>

                        <Pressable
                            style={{
                                flex: 1,
                                justifyContent: 'center',
                                alignItems: 'center',
                                borderBottomColor: '#392969',
                                borderBottomWidth:
                                    selectedTab === 2 ? moderateScale(7) : 0
                            }}
                            onPress={() => setSelectedTab(2)}
                        >
                            <Text
                                style={{
                                    color: '#33404F',
                                    fontFamily: FONTS.ProductSans.regular,
                                    fontSize: moderateScale(18)
                                }}
                            >
                                Form
                            </Text>
                        </Pressable>

                        <Pressable
                            style={{
                                flex: 1,
                                justifyContent: 'center',
                                alignItems: 'center',
                                borderBottomColor: '#392969',
                                borderBottomWidth:
                                    selectedTab === 3 ? moderateScale(7) : 0
                            }}
                            onPress={() => setSelectedTab(3)}
                        >
                            <Text
                                style={{
                                    color: '#33404F',
                                    fontFamily: FONTS.ProductSans.regular,
                                    fontSize: moderateScale(18)
                                }}
                            >
                                Sign
                            </Text>
                        </Pressable>
                    </View>

                    {selectedTab === 1 ? (
                        <FlatList
                            data={record?.log.graph_data ?? []}
                            keyExtractor={(item) => String(item.log_id)}
                            renderItem={({ item }) => {
                                return (
                                    <View
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            paddingVertical: moderateScale(10)
                                        }}
                                    >
                                        <View
                                            style={{
                                                width: moderateScale(85),
                                                alignItems: 'center'
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    color: '#33404F',
                                                    fontSize: moderateScale(12),
                                                    fontFamily: FONTS.ProductSans.regular,
                                                    opacity: 0.5
                                                }}
                                            >
                                                {item.log_name}
                                            </Text>
                                        </View>

                                        <View
                                            style={{
                                                flex: 1
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    fontFamily: FONTS.ProductSans.bold,
                                                    fontSize: moderateScale(15),
                                                    color: '#33404F'
                                                }}
                                            >
                                                {formatLogTimeRange(
                                                    record?.date ?? '',
                                                    item.start_log_time,
                                                    item.end_log_time,
                                                    configData?.timezone ?? moment.tz.guess()
                                                )}
                                            </Text>

                                            <Text
                                                style={{
                                                    fontFamily: FONTS.ProductSans.regular,
                                                    fontSize: moderateScale(12),
                                                    color: '#33404F',
                                                    opacity: 0.5,
                                                    marginTop: moderateScale(5)
                                                }}
                                            >
                                                {item.location_start ?? 'No location'}
                                            </Text>
                                        </View>
                                    </View>
                                );
                            }}
                            ItemSeparatorComponent={() => {
                                return (
                                    <View
                                        style={{
                                            borderWidth: 0.5,
                                            borderColor: '#C4C4C4'
                                        }}
                                    />
                                );
                            }}
                        />
                    ) : null}

                    {selectedTab === 2 ? (
                        <ScrollView>
                            <View
                                style={{
                                    backgroundColor: '#eaebeb',
                                    marginBottom: moderateScale(8),
                                    height: moderateScale(45),
                                    justifyContent: 'center',
                                    paddingHorizontal: moderateScale(10)
                                }}
                            >
                                <Text
                                    style={{
                                        color: '#33404F',
                                        fontFamily: FONTS.ProductSans.regular,
                                        fontSize: moderateScale(14),
                                        opacity: 0.7
                                    }}
                                >
                                    GENERAL
                                </Text>
                            </View>

                            <View
                                style={{
                                    borderWidth: 1,
                                    borderColor: '#C4C4C4',
                                    flexDirection: 'row'
                                }}
                            >
                                <View
                                    style={{
                                        flex: 1,
                                        paddingTop: moderateScale(8)
                                    }}
                                >
                                    <AppTextInput
                                        title="Distance"
                                        titleStyle={{
                                            marginBottom: 0,
                                            color: '#33404F',
                                            fontFamily: FONTS.ProductSans.regular,
                                            fontSize: moderateScale(14)
                                        }}
                                        inputContainerStyle={{
                                            borderWidth: 0,
                                            marginTop: 0
                                        }}
                                        inputStyle={{
                                            minHeight: moderateScale(30),
                                            color: '#33404F',
                                            fontFamily: FONTS.ProductSans.regular,
                                            fontSize: moderateScale(14)
                                        }}
                                        value={distance}
                                        onChangeText={(text) => {
                                            setDistance(text);
                                        }}
                                        mainContainerStyle={{
                                            marginHorizontal: moderateScale(10)
                                        }}
                                    />
                                </View>

                                <View
                                    style={{
                                        width: '35%',
                                        borderLeftWidth: 1,
                                        borderColor: '#C4C4C4',
                                        paddingTop: moderateScale(8)
                                    }}
                                >
                                    <AppTextInput
                                        title="Odometers"
                                        titleStyle={{
                                            marginBottom: 0,
                                            color: '#33404F',
                                            fontFamily: FONTS.ProductSans.regular,
                                            fontSize: moderateScale(14)
                                        }}
                                        inputContainerStyle={{
                                            borderWidth: 0,
                                            marginTop: 0
                                        }}
                                        inputStyle={{
                                            minHeight: moderateScale(30),
                                            color: '#33404F',
                                            fontFamily: FONTS.ProductSans.regular,
                                            fontSize: moderateScale(14)
                                        }}
                                        value={odometer}
                                        onChangeText={(text) => {
                                            setOdometer(text);
                                        }}
                                        mainContainerStyle={{
                                            marginHorizontal: moderateScale(10)
                                        }}
                                    />
                                </View>
                            </View>

                            <AppTextInput
                                title="Driver"
                                titleStyle={{
                                    marginBottom: 0,
                                    color: '#33404F',
                                    fontFamily: FONTS.ProductSans.regular,
                                    fontSize: moderateScale(14)
                                }}
                                inputContainerStyle={{
                                    borderWidth: 0,
                                    marginTop: 0
                                }}
                                inputStyle={{
                                    minHeight: moderateScale(30),
                                    color: '#33404F',
                                    fontFamily: FONTS.ProductSans.regular,
                                    fontSize: moderateScale(14)
                                }}
                                value={driverName}
                                onChangeText={(text) => {
                                    setDriverName(text);
                                }}
                                mainContainerStyle={{
                                    marginHorizontal: moderateScale(10),
                                    marginTop: moderateScale(8)
                                }}
                            />

                            <View
                                style={{
                                    backgroundColor: '#eaebeb',
                                    marginBottom: moderateScale(8),
                                    height: moderateScale(45),
                                    justifyContent: 'center',
                                    paddingHorizontal: moderateScale(10)
                                }}
                            >
                                <Text
                                    style={{
                                        color: '#33404F',
                                        fontFamily: FONTS.ProductSans.regular,
                                        fontSize: moderateScale(14),
                                        opacity: 0.7
                                    }}
                                >
                                    CARRIER
                                </Text>
                            </View>

                            <AppTextInput
                                title="Carrier Name"
                                titleStyle={{
                                    marginBottom: 0,
                                    color: '#33404F',
                                    fontFamily: FONTS.ProductSans.regular,
                                    fontSize: moderateScale(14)
                                }}
                                inputContainerStyle={{
                                    borderWidth: 0,
                                    marginTop: 0
                                }}
                                inputStyle={{
                                    minHeight: moderateScale(30),
                                    color: '#33404F',
                                    fontFamily: FONTS.ProductSans.regular,
                                    fontSize: moderateScale(14)
                                }}
                                value={carrierName}
                                onChangeText={(text) => {
                                    setCarrierName(text);
                                }}
                                mainContainerStyle={{
                                    marginHorizontal: moderateScale(10),
                                    marginTop: moderateScale(8)
                                }}
                            />

                            <View
                                style={{
                                    borderWidth: 0.5,
                                    borderColor: '#C4C4C4'
                                }}
                            />

                            <AppTextInput
                                title="Main Office Address"
                                titleStyle={{
                                    marginBottom: 0,
                                    color: '#33404F',
                                    fontFamily: FONTS.ProductSans.regular,
                                    fontSize: moderateScale(14)
                                }}
                                inputContainerStyle={{
                                    borderWidth: 0,
                                    marginTop: 0
                                }}
                                inputStyle={{
                                    minHeight: moderateScale(30),
                                    color: '#33404F',
                                    fontFamily: FONTS.ProductSans.regular,
                                    fontSize: moderateScale(14)
                                }}
                                value={mainOfficeAddress}
                                onChangeText={(text) => {
                                    setMainOfficeAddress(text);
                                }}
                                mainContainerStyle={{
                                    marginHorizontal: moderateScale(10),
                                    marginTop: moderateScale(8)
                                }}
                            />

                            <View
                                style={{
                                    borderWidth: 0.5,
                                    borderColor: '#C4C4C4'
                                }}
                            />

                            <AppTextInput
                                title="Home Terminal Address"
                                titleStyle={{
                                    marginBottom: 0,
                                    color: '#33404F',
                                    fontFamily: FONTS.ProductSans.regular,
                                    fontSize: moderateScale(14)
                                }}
                                inputContainerStyle={{
                                    borderWidth: 0,
                                    marginTop: 0
                                }}
                                inputStyle={{
                                    minHeight: moderateScale(30),
                                    color: '#33404F',
                                    fontFamily: FONTS.ProductSans.regular,
                                    fontSize: moderateScale(14)
                                }}
                                value={homeTerminalAddress}
                                onChangeText={(text) => {
                                    setHomeTerminalAddress(text);
                                }}
                                mainContainerStyle={{
                                    marginHorizontal: moderateScale(10),
                                    marginTop: moderateScale(8)
                                }}
                            />

                            <View
                                style={{
                                    backgroundColor: '#eaebeb',
                                    marginBottom: moderateScale(8),
                                    height: moderateScale(45),
                                    justifyContent: 'center',
                                    paddingHorizontal: moderateScale(10)
                                }}
                            >
                                <Text
                                    style={{
                                        color: '#33404F',
                                        fontFamily: FONTS.ProductSans.regular,
                                        fontSize: moderateScale(14),
                                        opacity: 0.7
                                    }}
                                >
                                    OTHER
                                </Text>
                            </View>

                            {/* <AppTextInput
                                title="Co-Driver"
                                titleStyle={{
                                    marginBottom: 0,
                                    color: '#33404F',
                                    fontFamily: FONTS.ProductSans.regular,
                                    fontSize: moderateScale(14)
                                }}
                                inputContainerStyle={{
                                    borderWidth: 0,
                                    marginTop: 0
                                }}
                                inputStyle={{
                                    minHeight: moderateScale(30),
                                    color: '#33404F',
                                    fontFamily: FONTS.ProductSans.regular,
                                    fontSize: moderateScale(14)
                                }}
                                value="None"
                                mainContainerStyle={{
                                    marginHorizontal: moderateScale(10),
                                    marginTop: moderateScale(8)
                                }}
                            /> */}

                            <Picker
                                options={coDriver.reduce((prev, current) => {
                                    return [
                                        ...prev,
                                        {
                                            label: `${current.first_name} ${current.last_name}`,
                                            value: current.id.toString()
                                        }
                                    ];
                                }, new Array<any>())}
                                selectedValue={selecetdCoDriver}
                                containerStyle={{
                                    borderWidth: 0,
                                    marginTop: 0
                                }}
                                placeholder="Select Co-Driver"
                                onValueChange={(item) => setSelectedCoDriver(item)}
                            />

                            <View
                                style={{
                                    borderWidth: 0.5,
                                    borderColor: '#C4C4C4'
                                }}
                            />

                            <AppTextInput
                                title="Origin"
                                titleStyle={{
                                    marginBottom: 0,
                                    color: '#33404F',
                                    fontFamily: FONTS.ProductSans.regular,
                                    fontSize: moderateScale(14)
                                }}
                                inputContainerStyle={{
                                    borderWidth: 0,
                                    marginTop: 0
                                }}
                                inputStyle={{
                                    minHeight: moderateScale(30),
                                    color: '#33404F',
                                    fontFamily: FONTS.ProductSans.regular,
                                    fontSize: moderateScale(14)
                                }}
                                value={origin}
                                onChangeText={(text) => {
                                    setOrigin(text);
                                }}
                                mainContainerStyle={{
                                    marginHorizontal: moderateScale(10),
                                    marginTop: moderateScale(8)
                                }}
                            />

                            <View
                                style={{
                                    borderWidth: 0.5,
                                    borderColor: '#C4C4C4'
                                }}
                            />

                            <AppTextInput
                                title="Destination"
                                titleStyle={{
                                    marginBottom: 0,
                                    color: '#33404F',
                                    fontFamily: FONTS.ProductSans.regular,
                                    fontSize: moderateScale(14)
                                }}
                                inputContainerStyle={{
                                    borderWidth: 0,
                                    marginTop: 0
                                }}
                                inputStyle={{
                                    minHeight: moderateScale(30),
                                    color: '#33404F',
                                    fontFamily: FONTS.ProductSans.regular,
                                    fontSize: moderateScale(14)
                                }}
                                value={destination}
                                onChangeText={(text) => {
                                    setDestination(text);
                                }}
                                mainContainerStyle={{
                                    marginHorizontal: moderateScale(10),
                                    marginTop: moderateScale(8)
                                }}
                            />

                            <AppButton
                                title="Submit"
                                textStyle={{
                                    fontFamily: FONTS.ProductSans.bold,
                                    fontSize: moderateScale(15),
                                    color: '#fff'
                                }}
                                style={{
                                    backgroundColor: 'green'
                                }}
                                onPress={handleEditForm}
                            />
                        </ScrollView>
                    ) : null}

                    {selectedTab === 3 ? (
                        <View
                            style={{
                                flex: 1,
                                marginVertical: moderateScale(15),
                                marginHorizontal: moderateScale(20)
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: moderateScale(15),
                                    color: '#33404F',
                                    fontFamily: FONTS.ProductSans.regular
                                }}
                            >
                                I hereby certify that my data entries and my record of
                                duty status for this day are true and correct.
                            </Text>

                            <SignatureScreen
                                ref={ref}
                                onEnd={() => {}}
                                onOK={(sig) => {
                                    uploadImage(sig);
                                }}
                                onEmpty={() => {}}
                                // onClear={handleClear}
                                autoClear={true}
                                descriptionText={''}
                                webStyle={`body,html {
                                    height: 200px !important;
                                }
                                .m-signature-pad--footer {
                                    padding: 0px 0px !important;
                                }`}
                                style={{
                                    marginTop: moderateScale(10)
                                }}
                                clearText="Clear Signature"
                                confirmText="Accept"
                            />
                            {/* <View style={{ flex: 1, backgroundColor: 'red' }} /> */}
                        </View>
                    ) : null}
                </View>
            </LinearGradient>
        </Container>
    );
};

export default SingleActivity;

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