import {
    ActivityIndicator,
    FlatList,
    Image,
    Pressable,
    StyleSheet,
    View
} from 'react-native';
import React, { useEffect, useState } from 'react';
import {
    AppButton,
    AppTextInput,
    Container,
    Icon,
    Picker,
    Text
} from 'react-native-basic-elements';
import LinearGradient from 'react-native-linear-gradient';
import AppStatusBar from '../../Components/AppStatusBar';
import HomeHeader from '../../Components/Headers/HomeHeader';
import { moderateScale } from '../../Constants/PixelRatio';
import { FONTS } from '../../Constants/Fonts';
import { useRoute } from '@react-navigation/native';
import moment from 'moment';
import { inspectionApi } from '../../core/api/services/inspectionApi';
import { isLegacySuccess, isSuccess } from '../../core/api/types/common';
import ImagePicker from 'react-native-image-crop-picker';
import NavigationService from '../../Services/Navigation';
import { requireOnline } from '../../core/network/requireOnline';
import { showError, showToast } from '../../Utils/toast';
import { getApiErrorMessage } from '../../Utils/apiErrorMessage';

const InspectionInfo: React.FC = () => {
    const route = useRoute<any>();
    const [inspectionType, setInspectionType] = useState<Array<any>>([]);
    const [parts, setParts] = useState<Array<any>>([]);
    const [defectType, setDefectType] = useState<Array<any>>([]);
    const [selectedInspectionType, setSelectedInspectionType] = useState<string>(
        route.params.inspectionType ?? ''
    );
    const [submitLoader, setSubmitLoader] = useState<boolean>(false);
    const [loader, setLoader] = useState<boolean>(true);

    useEffect(() => {
        getVehicleData();
    }, []);

    const getVehicleData = async () => {
        inspectionApi.getCreateFormDataLegacy()
            .then((res) => {
                if (isLegacySuccess(res)) {
                    const data = res.data as {
                        inspection_type: Array<any>;
                        parts_type: Array<any>;
                        defect_type: Array<any>;
                    };
                    setInspectionType(data.inspection_type);
                    setParts(data.parts_type);
                    setDefectType(data.defect_type);
                }
            })
            .catch((err) => {
                console.log(err);
            })
            .finally(() => {
                setLoader(false);
            });
    };

    const imageHandler = (index: number) => {
        ImagePicker.openPicker({
            cropping: true,
            width: 300,
            height: 400,
            mediaType: 'photo'
        })
            .then((result) => {
                setParts((state) => {
                    state[index].image = result.path;
                    return JSON.parse(JSON.stringify(state));
                });
            })
            .catch((error) => {
                console.log('error', error);
            });
    };

    const submit = () => {
        if (parts.findIndex((it) => !it.selected && !it.isDefected) >= 0) {
            showError('Please select all parts');
            return;
        }

        if (!requireOnline()) {
            return;
        }

        setSubmitLoader(true);
        let data = {
            inspection_type: selectedInspectionType,
            vehicle_id: route.params.vehicleData.vechile_id,
            inspection_start_time: route.params.date,
            parts_data: parts.reduce((prev, current) => {
                const data: Record<string, unknown> = {
                    parts_id: current.option_id,
                    is_ok: current.selected ? 1 : 2,
                    defect_type: current.defectType?.find((it: any) => it.selected)
                        ?.option_id,
                    notes: current.notes
                };

                if (current.image) {
                    data.defect_image = current.image;
                    data.image = current.image;
                }

                return [...prev, data];
            }, new Array<any>())
        };

        inspectionApi
            .submitInspection(data)
            .then((result) => {
                if (isSuccess(result)) {
                    showToast('Inspection added successfully');
                    NavigationService.navigate('MainHome');
                } else {
                    showError(result.message);
                }
            })
            .catch((error) => {
                showError(getApiErrorMessage(error, 'Failed to submit inspection'));
            })
            .finally(() => {
                setSubmitLoader(false);
            });
    };

    if (loader) {
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
                <HomeHeader showBack />

                <View style={styles.bodyCard}>
                    <View
                        style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginHorizontal: moderateScale(15),
                            marginTop: moderateScale(3)
                        }}
                    >
                        <Text
                            style={{
                                color: '#33404F',
                                fontFamily: FONTS.ProductSans.regular,
                                fontSize: moderateScale(18)
                            }}
                        >
                            General Info
                        </Text>
                        <Image
                            source={require('../../Assets/Icons/edit.png')}
                            style={{
                                width: moderateScale(18),
                                height: moderateScale(18),
                                resizeMode: 'contain'
                            }}
                        />
                    </View>

                    <Text
                        style={{
                            color: '#33404F',
                            fontFamily: FONTS.ProductSans.regular,
                            fontSize: moderateScale(13),
                            marginHorizontal: moderateScale(15),
                            marginVertical: moderateScale(7)
                        }}
                    >
                        {moment(route.params?.date).format('MMM d, YYYY | HH:mm A')}
                        {'\n'}
                        {route.params?.vehicleData.user_info.career_name}
                        {'\n'}
                        {route.params?.vehicleData.vehicle.name}
                        {'\n'}
                        {route.params?.vehicleData.driver.pin_code}
                    </Text>

                    <View
                        style={{
                            borderTopWidth: moderateScale(1),
                            borderBottomWidth: moderateScale(1),
                            borderColor: '#D3CCCC',
                            paddingVertical: moderateScale(5),
                            paddingHorizontal: moderateScale(15)
                        }}
                    >
                        <Text
                            style={{
                                color: '#33404F',
                                fontFamily: FONTS.ProductSans.regular,
                                fontSize: moderateScale(17)
                            }}
                        >
                            Inspection Type
                        </Text>

                        <Picker.Custom
                            selectedValue={selectedInspectionType}
                            options={inspectionType}
                            labelKey="title"
                            valueKey="option_id"
                            renderItem={(item, index, onPress) => (
                                <Pressable
                                    style={{
                                        padding: moderateScale(10),
                                        borderBottomWidth: moderateScale(1),
                                        borderBottomColor: '#EFEFEF'
                                    }}
                                    onPress={onPress}
                                    key={index}
                                >
                                    <Text>{item.title}</Text>
                                </Pressable>
                            )}
                            onValueSelect={(value) => setSelectedInspectionType(value)}
                            placeholder="Select One"
                            inputStyle={{
                                height: moderateScale(33),
                                backgroundColor: '#D9D9D9',
                                borderWidth: moderateScale(1),
                                borderColor: '#000000',
                                borderRadius: moderateScale(4),
                                marginVertical: moderateScale(10)
                            }}
                            inputRightIcon={{
                                name: 'chevron-down',
                                type: 'Entypo',
                                color: '#000000',
                                size: moderateScale(20)
                            }}
                            inputTextStyle={{
                                color: '#33404F',
                                fontFamily: FONTS.ProductSans.regular,
                                fontSize: moderateScale(13)
                            }}
                            modalHeading="Add Inspection"
                        />
                    </View>

                    <View
                        style={{
                            flex: 1,
                            paddingHorizontal: moderateScale(15),
                            marginTop: moderateScale(5)
                        }}
                    >
                        <Text
                            style={{
                                color: '#33404F',
                                fontFamily: FONTS.ProductSans.regular,
                                fontSize: moderateScale(17)
                            }}
                        >
                            Parts
                        </Text>
                        <Text
                            style={{
                                color: '#33404F',
                                fontFamily: FONTS.ProductSans.regular,
                                fontSize: moderateScale(12),
                                marginVertical: moderateScale(5)
                            }}
                        >
                            Your fleet requires you to document inspection of parts marked
                            with asterisk(*).
                        </Text>

                        <FlatList
                            data={parts}
                            contentContainerStyle={{
                                paddingBottom: moderateScale(40)
                            }}
                            keyExtractor={(item, index) => index.toString()}
                            showsVerticalScrollIndicator={false}
                            renderItem={({ item, index }) => (
                                <View>
                                    <View
                                        style={{
                                            flexDirection: 'row',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            marginVertical: moderateScale(5)
                                        }}
                                    >
                                        <Text
                                            style={{
                                                color: '#252A31',
                                                fontSize: moderateScale(12)
                                            }}
                                        >
                                            {item.title}
                                        </Text>

                                        <View
                                            style={{
                                                flexDirection: 'row'
                                            }}
                                        >
                                            <Pressable
                                                style={{
                                                    height: moderateScale(35),
                                                    width: moderateScale(35),
                                                    backgroundColor: item.selected
                                                        ? 'transparent'
                                                        : '#E2E2E2',
                                                    borderRadius: moderateScale(2),
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                    marginLeft: moderateScale(5),
                                                    borderWidth: item.selected ? 1 : 0
                                                }}
                                                onPress={() =>
                                                    setParts((it) => {
                                                        it[index].selected = true;
                                                        it[index].isDefected = false;
                                                        return [...it];
                                                    })
                                                }
                                            >
                                                <Icon
                                                    name="like"
                                                    type="EvilIcon"
                                                    size={moderateScale(26)}
                                                    style={{
                                                        marginTop: -moderateScale(5)
                                                    }}
                                                />
                                            </Pressable>

                                            <Pressable
                                                style={{
                                                    height: moderateScale(35),
                                                    width: moderateScale(35),
                                                    backgroundColor: '#E2E2E2',
                                                    borderRadius: moderateScale(2),
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                    marginLeft: moderateScale(5)
                                                }}
                                                onPress={() =>
                                                    setParts((it) => {
                                                        it[index].isDefected = true;
                                                        it[index].selected = false;

                                                        it[index].defectType = defectType;
                                                        return [...it];
                                                    })
                                                }
                                            >
                                                <Icon
                                                    name="infocirlceo"
                                                    type="AntDesign"
                                                    size={moderateScale(18)}
                                                />
                                            </Pressable>
                                        </View>
                                    </View>

                                    {item.isDefected ? (
                                        <View
                                            style={{
                                                backgroundColor: '#D9D9D9',
                                                borderRadius: moderateScale(3),
                                                padding: moderateScale(10)
                                            }}
                                        >
                                            <View
                                                style={{
                                                    flexDirection: 'row',
                                                    alignItems: 'center'
                                                }}
                                            >
                                                <Text
                                                    style={{
                                                        color: '#33404F',
                                                        fontSize: moderateScale(13),
                                                        fontFamily:
                                                            FONTS.ProductSans.regular
                                                    }}
                                                >
                                                    Defect Type:
                                                </Text>

                                                {item.defectType?.map(
                                                    (defect: any, i: number) => (
                                                        <Pressable
                                                            key={i}
                                                            style={{
                                                                backgroundColor:
                                                                    '#ECC024',
                                                                borderRadius:
                                                                    moderateScale(2),
                                                                justifyContent: 'center',
                                                                alignItems: 'center',
                                                                marginLeft:
                                                                    moderateScale(5),
                                                                height: moderateScale(25),
                                                                paddingHorizontal:
                                                                    moderateScale(8),
                                                                borderWidth:
                                                                    defect.selected
                                                                        ? 1
                                                                        : 0
                                                            }}
                                                            onPress={() =>
                                                                setParts((it) => {
                                                                    const prevSelectded =
                                                                        it[
                                                                            index
                                                                        ].defectType.findIndex(
                                                                            (fil: any) =>
                                                                                fil.selected
                                                                        );
                                                                    if (
                                                                        prevSelectded !==
                                                                        -1
                                                                    ) {
                                                                        it[
                                                                            index
                                                                        ].defectType[
                                                                            prevSelectded
                                                                        ].selected =
                                                                            false;
                                                                    }
                                                                    it[index].defectType[
                                                                        i
                                                                    ].selected = true;
                                                                    return JSON.parse(
                                                                        JSON.stringify(it)
                                                                    );
                                                                })
                                                            }
                                                        >
                                                            <Text
                                                                style={{
                                                                    color: defect.selected
                                                                        ? '#000000'
                                                                        : '#ffffff',
                                                                    fontFamily:
                                                                        FONTS.ProductSans
                                                                            .regular,
                                                                    fontSize:
                                                                        moderateScale(13)
                                                                }}
                                                            >
                                                                {defect.title}
                                                            </Text>
                                                        </Pressable>
                                                    )
                                                )}
                                            </View>

                                            <View
                                                style={{
                                                    flexDirection: 'row',
                                                    alignItems: 'center',
                                                    marginVertical: moderateScale(12)
                                                }}
                                            >
                                                <Text
                                                    style={{
                                                        color: '#33404F',
                                                        fontSize: moderateScale(13),
                                                        fontFamily:
                                                            FONTS.ProductSans.regular
                                                    }}
                                                >
                                                    Notes*
                                                </Text>

                                                <AppTextInput
                                                    style={{
                                                        backgroundColor: '#FFFFFF',
                                                        minHeight: moderateScale(30),
                                                        height: moderateScale(35),
                                                        borderRadius: moderateScale(3)
                                                    }}
                                                    mainContainerStyle={{
                                                        flex: 1,
                                                        marginLeft: moderateScale(10)
                                                    }}
                                                    inputContainerStyle={{
                                                        borderWidth: 0
                                                    }}
                                                    value={item.notes}
                                                    onChnageText={(val) =>
                                                        setParts((state) => {
                                                            state[index].notes = val;

                                                            return JSON.parse(
                                                                JSON.stringify(state)
                                                            );
                                                        })
                                                    }
                                                />
                                            </View>

                                            <Pressable
                                                style={{
                                                    height: moderateScale(40),
                                                    borderWidth: 1,
                                                    borderRadius: moderateScale(5),
                                                    paddingLeft: moderateScale(5),
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}
                                                onPress={() => imageHandler(index)}
                                            >
                                                <Text
                                                    style={{
                                                        color: '#33404F',
                                                        fontSize: moderateScale(13),
                                                        fontFamily:
                                                            FONTS.ProductSans.regular,
                                                        position: 'absolute',
                                                        left: moderateScale(5)
                                                    }}
                                                >
                                                    Images*
                                                </Text>

                                                {item.image ? (
                                                    <Image
                                                        source={{ uri: item.image }}
                                                        style={{
                                                            height: moderateScale(36),
                                                            width: moderateScale(36),
                                                            borderRadius:
                                                                moderateScale(4),
                                                            resizeMode: 'cover'
                                                        }}
                                                    />
                                                ) : (
                                                    <View
                                                        style={{
                                                            flexDirection: 'row',
                                                            alignItems: 'center'
                                                        }}
                                                    >
                                                        <Icon
                                                            name="image-outline"
                                                            type="Ionicon"
                                                            color="#60A5FA"
                                                        />
                                                        <Text
                                                            style={{
                                                                color: '#60A5FA',
                                                                fontSize:
                                                                    moderateScale(13),
                                                                fontFamily:
                                                                    FONTS.ProductSans
                                                                        .regular,
                                                                marginLeft:
                                                                    moderateScale(5)
                                                            }}
                                                        >
                                                            Add Image
                                                        </Text>
                                                    </View>
                                                )}
                                            </Pressable>
                                        </View>
                                    ) : null}
                                </View>
                            )}
                            ItemSeparatorComponent={() => {
                                return (
                                    <View
                                        style={{
                                            height: moderateScale(1),
                                            backgroundColor: '#EFEFEF'
                                        }}
                                    />
                                );
                            }}
                        />
                    </View>
                </View>

                <AppButton
                    title="SAVE"
                    textStyle={{
                        color: '#FFFFFF',
                        fontFamily: FONTS.ProductSans.regular,
                        fontSize: moderateScale(14)
                    }}
                    style={{
                        backgroundColor: '#4ECB71',
                        elevation: 5,
                        position: 'absolute',
                        paddingHorizontal: moderateScale(25),
                        bottom: 10,
                        right: 0,
                        zIndex: 9999999
                    }}
                    onPress={submit}
                    loader={
                        submitLoader
                            ? {
                                  position: 'right',
                                  size: 'small',
                                  color: '#FFFFFF'
                              }
                            : undefined
                    }
                    disabled={submitLoader}
                />
            </LinearGradient>
        </Container>
    );
};

export default InspectionInfo;

const styles = StyleSheet.create({
    bodyCard: {
        backgroundColor: '#fff',
        paddingTop: moderateScale(20),
        flex: 1,
        zIndex: 1,
        borderTopRightRadius: moderateScale(40),
        borderTopLeftRadius: moderateScale(40)
    }
});
