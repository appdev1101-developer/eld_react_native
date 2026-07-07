import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import React, { useEffect, useState } from 'react';
import { Container, Text } from 'react-native-basic-elements';
import AppStatusBar from '../../Components/AppStatusBar';
import LinearGradient from 'react-native-linear-gradient';
import HomeHeader from '../../Components/Headers/HomeHeader';
import { moderateScale } from '../../Constants/PixelRatio';
import { FONTS } from '../../Constants/Fonts';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { safetyApi } from '../../core/api/services/safetyApi';
import { isLegacySuccess } from '../../core/api/types/common';
import { useRoute } from '@react-navigation/native';
import moment from 'moment';
import { GRADIENT_HEADER } from '../../Constants/Theme';

const SingleSafety: React.FC = () => {
    const route = useRoute<any>();
    const [safetyData, setSafetyData] = useState<Array<any>>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        getSafetyData();
    }, []);

    const getSafetyData = () => {
        safetyApi
            .getSafetyDataLegacy(route.params.shortName)
            .then((result) => {
                if (isLegacySuccess(result)) {
                    setSafetyData((result.data as Array<any>) ?? []);
                }
            })
            .catch((error) => console.log('error', error))
            .finally(() => {
                setLoading(false);
            });
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
                    color={'#392969'}
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
                <HomeHeader showBack />

                <View style={styles.bodyCard}>
                    <View style={styles.header}>
                        <Text style={styles.headerText}>Safety</Text>
                    </View>

                    {safetyData.length > 0 ? (
                        <View
                            style={{
                                backgroundColor: '#EFEFEF',
                                borderRadius: moderateScale(5),
                                marginHorizontal: moderateScale(10),
                                paddingHorizontal: moderateScale(7),
                                paddingVertical: moderateScale(10)
                            }}
                        >
                            <ScrollView showsVerticalScrollIndicator={false}>
                                <Text
                                    style={{
                                        fontFamily: FONTS.ProductSans.regular,
                                        fontSize: moderateScale(15),
                                        color: '#33404F'
                                    }}
                                >
                                    You have{' '}
                                    <Text
                                        style={{
                                            fontFamily: FONTS.ProductSans.bold,
                                            color: '#FA1740'
                                        }}
                                    >
                                        {safetyData.length} close following
                                    </Text>{' '}
                                    events
                                </Text>

                                {safetyData.map((item, index) => {
                                    return (
                                        <View
                                            style={{
                                                backgroundColor: '#FFFFFF',
                                                borderRadius: moderateScale(7),
                                                overflow: 'hidden',
                                                marginVertical: moderateScale(10)
                                            }}
                                            key={index}
                                        >
                                            <View
                                                style={{
                                                    backgroundColor:
                                                        item.risk === 'high'
                                                            ? '#FA1740'
                                                            : item.risk === 'low'
                                                            ? 'green'
                                                            : '#FF650F',
                                                    paddingHorizontal: moderateScale(15),
                                                    paddingVertical: moderateScale(10)
                                                }}
                                            >
                                                <Text
                                                    style={{
                                                        fontFamily:
                                                            FONTS.ProductSans.regular,
                                                        color: '#ffffff',
                                                        fontSize: moderateScale(15),
                                                        textTransform: 'uppercase'
                                                    }}
                                                >
                                                    {item.risk} RISK
                                                </Text>
                                            </View>

                                            <Text
                                                style={{
                                                    color: '#33404F',
                                                    fontFamily: FONTS.ProductSans.regular,
                                                    fontSize: moderateScale(15),
                                                    margin: moderateScale(10),
                                                    marginBottom: moderateScale(0)
                                                }}
                                            >
                                                {moment(item.timeData).format(
                                                    'DD MMMM YYYY'
                                                )}
                                            </Text>
                                            <Text
                                                style={{
                                                    color: '#7D8083',
                                                    fontFamily: FONTS.ProductSans.regular,
                                                    fontSize: moderateScale(10),
                                                    marginHorizontal: moderateScale(10),
                                                    marginBottom: moderateScale(10)
                                                }}
                                            >
                                                {item.location_name}
                                            </Text>

                                            <View
                                                style={{
                                                    height: moderateScale(150),
                                                    borderRadius: moderateScale(8),
                                                    overflow: 'hidden',
                                                    marginHorizontal: moderateScale(10),
                                                    marginBottom: moderateScale(10)
                                                }}
                                            >
                                                <MapView
                                                    provider={PROVIDER_GOOGLE}
                                                    style={StyleSheet.absoluteFillObject}
                                                    region={{
                                                        latitude: item.lat_lang_data[0],
                                                        longitude: item.lat_lang_data[1],
                                                        latitudeDelta: 0.015,
                                                        longitudeDelta: 0.0121
                                                    }}
                                                    scrollEnabled={false}
                                                >
                                                    <Marker
                                                        coordinate={{
                                                            latitude:
                                                                item.lat_lang_data[0],
                                                            longitude:
                                                                item.lat_lang_data[1]
                                                        }}
                                                    />
                                                </MapView>
                                            </View>
                                        </View>
                                    );
                                })}
                            </ScrollView>
                        </View>
                    ) : (
                        <View
                            style={{
                                justifyContent: 'center',
                                alignItems: 'center',
                                flex: 1
                            }}
                        >
                            <Text
                                style={{
                                    color: '#33404F',
                                    fontFamily: FONTS.ProductSans.regular,
                                    fontSize: moderateScale(13)
                                }}
                            >
                                No Data Found
                            </Text>
                        </View>
                    )}
                </View>
            </LinearGradient>
        </Container>
    );
};

export default SingleSafety;

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
        marginHorizontal: moderateScale(15)
    },
    headerText: {
        color: '#33404F',
        fontFamily: FONTS.ProductSans.regular,
        fontSize: moderateScale(17)
    }
});
