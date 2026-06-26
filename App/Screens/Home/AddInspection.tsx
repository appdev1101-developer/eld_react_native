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
    AppTextInput,
    Container,
    Icon,
    Text
} from 'react-native-basic-elements';
import LinearGradient from 'react-native-linear-gradient';
import AppStatusBar from '../../Components/AppStatusBar';
import HomeHeader from '../../Components/Headers/HomeHeader';
import { moderateScale } from '../../Constants/PixelRatio';
import { FONTS } from '../../Constants/Fonts';
import NavigationService from '../../Services/Navigation';
import DashboardService from '../../Services/Dashboard';
import { useRoute } from '@react-navigation/native';

const data = [
    {
        label: 'A01',
        description: '2020 PETERBILT 2020'
    },
    {
        label: 'A02',
        description: '2020 PETERBILT 2020'
    },
    {
        label: 'A03',
        description: '2020 PETERBILT 2020'
    },
    {
        label: 'A04',
        description: '2020 PETERBILT 2020'
    },
    {
        label: 'A05',
        description: '2020 PETERBILT 2020'
    },
    {
        label: 'A06',
        description: '2020 PETERBILT 2020'
    },
    {
        label: 'A07',
        description: '2020 PETERBILT 2020'
    },
    {
        label: 'A08',
        description: '2020 PETERBILT 2020'
    }
];
const AddInspection: React.FC = () => {
    const route = useRoute<any>();
    const [search, setSearch] = useState<string>('');
    const [vehicleData, setVehicleData] = useState<any>([]);
    const [date, setDate] = useState<string>('');
    const [loader, setLoader] = useState<boolean>(true);

    useEffect(() => {
        getVehicleData();
    }, []);

    const getVehicleData = async () => {
        DashboardService.getInspactionData()
            .then((res) => {
                if (res.status === 'success') {
                    setVehicleData(res.data.vehicle);
                    setDate(res.data.start_time);
                }
            })
            .catch((err) => {
                console.log(err);
            })
            .finally(() => {
                setLoader(false);
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
                    <View style={styles.header}>
                        <Text style={styles.headerText}>Add Inspection</Text>
                    </View>

                    <AppTextInput
                        inputContainerStyle={{
                            borderWidth: 0,
                            height: moderateScale(63),
                            borderBottomWidth: 1,
                            borderRadius: 0,
                            borderColor: '#E8EDF1'
                        }}
                        inputStyle={{
                            paddingHorizontal: moderateScale(15),
                            color: '#252A31',
                            fontFamily: FONTS.ProductSans.bold,
                            fontSize: moderateScale(12)
                        }}
                        rightAction={
                            <Icon
                                name="closecircle"
                                type="AntDesign"
                                color={'#252A31'}
                                onPress={() => setSearch('')}
                            />
                        }
                        onRightIconPress={() => setSearch('')}
                        placeholder="Search Here"
                        mainContainerStyle={{ height: moderateScale(70) }}
                        value={search}
                        onChangeText={(text) => setSearch(text)}
                    />

                    <FlatList
                        showsVerticalScrollIndicator={false}
                        data={vehicleData.filter((item: any) => {
                            if (search === '') {
                                return item;
                            } else if (
                                item?.vehicle?.name
                                    .toLowerCase()
                                    .includes(search.toLowerCase())
                            ) {
                                return item;
                            }
                        })}
                        keyExtractor={(item, index) => index.toString()}
                        renderItem={({ item }) => (
                            <Pressable
                                style={styles.itemStyle}
                                onPress={() =>
                                    NavigationService.navigate('InspectionInfo', {
                                        vehicleData: item,
                                        date,
                                        inspectionType: route.params.inspectionType
                                    })
                                }
                            >
                                <Image
                                    source={require('../../Assets/Icons/vehicle-icon.png')}
                                    style={{
                                        height: moderateScale(18),
                                        width: moderateScale(18)
                                    }}
                                />
                                <View
                                    style={{
                                        marginLeft: moderateScale(10)
                                    }}
                                >
                                    <Text
                                        style={{
                                            color: '#252A31',
                                            fontFamily: FONTS.ProductSans.bold,
                                            fontSize: moderateScale(12)
                                        }}
                                    >
                                        {item.vehicle.name}
                                    </Text>
                                    <Text
                                        style={{
                                            color: '#4F5E71',
                                            fontFamily: FONTS.ProductSans.bold,
                                            fontSize: moderateScale(12)
                                        }}
                                    >
                                        {item.vehicle.make}
                                    </Text>
                                </View>
                            </Pressable>
                        )}
                        ItemSeparatorComponent={() => {
                            return (
                                <View
                                    style={{
                                        height: moderateScale(2),
                                        backgroundColor: '#E1E1E1',
                                        marginHorizontal: moderateScale(15)
                                    }}
                                />
                            );
                        }}
                    />
                </View>
            </LinearGradient>
        </Container>
    );
};

export default AddInspection;

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
        alignItems: 'center',
        height: moderateScale(35),
        borderBottomWidth: 1,
        borderBottomColor: '#D3CCCC'
    },
    headerText: {
        color: '#33404F',
        fontFamily: FONTS.ProductSans.regular,
        fontSize: moderateScale(17)
    },
    itemStyle: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: moderateScale(10),
        paddingVertical: moderateScale(12)
        // borderBottomWidth: 1,
        // borderBottomColor: '#D3CCCC'
    }
});
