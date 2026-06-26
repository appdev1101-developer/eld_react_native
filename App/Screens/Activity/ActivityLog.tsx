import { FlatList, StyleSheet, View } from 'react-native';
import React from 'react';
import { Container, Icon, Text } from 'react-native-basic-elements';
import AppStatusBar from '../../Components/AppStatusBar';
import HomeHeader from '../../Components/Headers/HomeHeader';
import { FONTS } from '../../Constants/Fonts';
import { moderateScale } from '../../Constants/PixelRatio';

const DATA = [
    {
        title: 'Today - Sat, Nov 2nd',
        price: 1
    },
    {
        title: 'Yesterday - Fri, Nov 1st',
        price: 1
    },
    {
        title: 'thu, Oct 31st',
        price: -1
    },
    {
        title: 'Wed, Oct 30th',
        price: 1
    },
    {
        title: 'Wed, Oct 29th',
        price: 1
    }
];
const ActivityLog = () => {
    return (
        <Container>
            <AppStatusBar />
            <HomeHeader theme="light" />

            <Text style={styles.heading}>Activity Log</Text>

            <FlatList
                data={DATA}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => {
                    return (
                        <View style={styles.listItem}>
                            <View
                                style={[
                                    styles.caretContainer,
                                    {
                                        backgroundColor:
                                            item.price >= 0 ? '#00DDA3' : '#33404F'
                                    }
                                ]}
                            >
                                <Icon
                                    name={item.price >= 0 ? 'caretup' : 'caretdown'}
                                    type="AntDesign"
                                    color={'#FFFFFF'}
                                    size={18}
                                />
                            </View>

                            <View
                                style={{
                                    flex: 1,
                                    marginLeft: moderateScale(10)
                                }}
                            >
                                <Text
                                    style={{
                                        fontSize: moderateScale(13),
                                        fontFamily: FONTS.ProductSans.regular
                                    }}
                                >
                                    {item.title}
                                </Text>

                                <View
                                    style={{
                                        flexDirection: 'row',
                                        gap: moderateScale(20),
                                        marginTop: moderateScale(5)
                                    }}
                                >
                                    <View
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center'
                                        }}
                                    >
                                        <Icon
                                            name="circle-with-minus"
                                            type="Entypo"
                                            size={moderateScale(12)}
                                            color={'#FFA800'}
                                        />

                                        <Text
                                            style={{
                                                fontSize: moderateScale(9),
                                                fontFamily: FONTS.ProductSans.regular,
                                                color: '#33404F',
                                                opacity: 0.6,
                                                marginLeft: moderateScale(2)
                                            }}
                                        >
                                            {'>1m'}
                                        </Text>
                                    </View>

                                    <View
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center'
                                        }}
                                    >
                                        <Icon
                                            name="checkcircle"
                                            type="AntDesign"
                                            size={moderateScale(10)}
                                            color={'#00DDA3'}
                                        />

                                        <Text
                                            style={{
                                                fontSize: moderateScale(9),
                                                fontFamily: FONTS.ProductSans.regular,
                                                color: '#33404F',
                                                opacity: 0.6,
                                                marginLeft: moderateScale(2)
                                            }}
                                        >
                                            Form
                                        </Text>
                                    </View>

                                    <View
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center'
                                        }}
                                    >
                                        <Icon
                                            name="closecircle"
                                            type="AntDesign"
                                            size={moderateScale(10)}
                                            color={'#FA1740'}
                                        />

                                        <Text
                                            style={{
                                                fontSize: moderateScale(9),
                                                fontFamily: FONTS.ProductSans.regular,
                                                color: '#33404F',
                                                opacity: 0.6,
                                                marginLeft: moderateScale(2)
                                            }}
                                        >
                                            Certify
                                        </Text>
                                    </View>
                                </View>
                            </View>
                            <Icon
                                name="chevron-right"
                                type="Feather"
                                size={moderateScale(20)}
                            />
                        </View>
                    );
                }}
            />
        </Container>
    );
};

export default ActivityLog;

const styles = StyleSheet.create({
    heading: {
        fontFamily: FONTS.ProductSans.regular,
        fontSize: moderateScale(18),
        marginLeft: moderateScale(12),
        marginVertical: moderateScale(10)
    },
    listItem: {
        marginHorizontal: moderateScale(12),
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: moderateScale(10),
        borderBottomWidth: 1,
        borderColor: '#E8EDF1'
    },
    caretContainer: {
        height: moderateScale(30),
        width: moderateScale(30),
        borderRadius: moderateScale(15),
        justifyContent: 'center',
        alignItems: 'center'
    }
});
