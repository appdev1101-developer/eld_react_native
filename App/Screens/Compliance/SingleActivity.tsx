import {
    Dimensions,
    FlatList,
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    ToastAndroid,
    View
} from 'react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import { useFocusEffect, useRoute } from '@react-navigation/native';
import SignatureScreen, { SignatureViewRef } from 'react-native-signature-canvas';
import AuthService from '../../Services/Auth';
import moment from 'moment';
import { HOSChartData } from '../../Model/Dashboard';
import DashboardService from '../../Services/Dashboard';
import HOSChart from '../../Components/Compliance/HOSChart';

const { width } = Dimensions.get('screen');
const SingleActivity = () => {
    const ref = useRef<SignatureViewRef>(null);
    const route = useRoute<any>();
    const [selectedTab, setSelectedTab] = useState<number>(1);
    const [chartData, setChartData] = useState<HOSChartData>({
        graph_data: [],
        violation_data: {
            Shift_data: [],
            total_shift_time: ''
        }
    });

    const [distance, setDistance] = useState<string>(
        route.params.distance?.toString() || ''
    );
    const [odometer, setOdometer] = useState<string>(
        route.params.odometer?.toString() || ''
    );
    const [driverName, setDriverName] = useState<string>(
        `${route.params.fromDetails?.[0]?.first_name ?? ''} ${
            route.params.fromDetails?.[0]?.last_name ?? ''
        }`.trim()
    );
    const [carrierName, setCarrierName] = useState<string>(
        route.params.fromDetails?.[3]?.career_name ?? ''
    );
    const [mainOfficeAddress, setMainOfficeAddress] = useState<string>(
        route.params.fromDetails?.[3]?.main_office_address ?? ''
    );
    const [homeTerminalAddress, setHomeTerminalAddress] = useState<string>(
        route.params.fromDetails?.[3]?.home_terminal?.address ?? ''
    );
    const [coDriver, setCoDriver] = useState<
        Array<{ id: number; first_name: string; last_name: string }>
    >(route.params.coDriver ?? []);
    const [origin, setOrigin] = useState<string>(route.params.origin ?? 'None');
    const [destination, setDestination] = useState<string>(
        route.params.destination ?? 'None'
    );
    const [selecetdCoDriver, setSelectedCoDriver] = useState<string>('');

    useFocusEffect(
        useCallback(() => {
            getHOSChartData();
        }, [route.params.date])
    );
    // useEffect(() => {
    //     getHOSChartData();
    // }, []);

    const getHOSChartData = () => {
        DashboardService.getHOSChartData(moment(route.params.date).format('YYYY-MM-DD'))
            .then((result) => {
                if (result.status === 'success') {
                    const data = result.data;
                    setChartData(data);
                }
            })
            .catch((error) => {
                console.log('error', error);
            });
    };

    const uploadImage = async (base64String: string) => {
        let token = await AuthService.getToken();
        const mimeTypeMatch = base64String.match(/data:(.*);base64/);
        if (!mimeTypeMatch) {
            console.error('Invalid Base64 format');
            return;
        }

        const mimeType = mimeTypeMatch[1]; // Extract MIME type
        const base64Data = base64String.split(',')[1]; // Extract the Base64 data

        const formData = new FormData();
        formData.append('signature', {
            uri: `data:${mimeType};base64,${base64Data}`,
            name: `signature.${mimeType.split('/')[1]}`, // e.g., image.jpeg
            type: mimeType
        } as any); // `as any` is needed because FormData types in RN may conflict

        const xhr = new XMLHttpRequest();

        xhr.open(
            'POST',
            `https://uat.apnatelelink.us/mobileAPI/hos/log/unsigned/certify/${route.params.date}`,
            true
        );
        xhr.setRequestHeader('Accept', '*/*');
        xhr.setRequestHeader('Content-Type', 'multipart/form-data');
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);

        xhr.onload = () => {
            if (xhr.status === 200) {
                ToastAndroid.show(
                    JSON.parse(xhr.responseText).message,
                    ToastAndroid.SHORT
                );
            } else {
                ToastAndroid.show(
                    JSON.parse(xhr.responseText).message,
                    ToastAndroid.SHORT
                );
            }
        };

        xhr.onerror = (error) => {
            console.log('error', error);
            console.error('Network error:', error);
        };

        xhr.send(formData);
    };

    const handleEditForm = () => {
        const data = {
            first_name: driverName.split(' ')[0],
            last_name: driverName.split(' ')[1],
            date: route.params.date,
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

        DashboardService.editActivityForm(data)
            .then((result) => {
                if (result.status === 'success') {
                    ToastAndroid.show(result.message, ToastAndroid.SHORT);
                } else {
                    ToastAndroid.show(result.message, ToastAndroid.SHORT);
                }
            })
            .catch((error) => {
                console.log('error', error);
            });
    };

    return (
        <Container>
            <AppStatusBar />

            <LinearGradient
                colors={['#392969', '#7051CF']}
                style={{ flex: 1 }}
            >
                <HomeHeader showBack />

                <View style={styles.bodyCard}>
                    {route.params.data && (
                        <ActivityCard
                            date={route.params.date}
                            totalShiftTime={route.params.data?.total_shift_time}
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
                        violations={chartData.violation_data.Shift_data.map((item) => {
                            return {
                                start: moment(item.violation_startTime).format('HH:mm'),
                                end: moment(item.violation_endTime).format('HH:mm')
                            };
                        })}
                        vehicleName={chartData?.vehicle?.[0]?.name}
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
                            data={route.params.logData}
                            keyExtractor={(item, index) => index.toString()}
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
                                                {item[1]}
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
                                                {item[4]} - {item[5]}
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
                                                {item[8]}
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
