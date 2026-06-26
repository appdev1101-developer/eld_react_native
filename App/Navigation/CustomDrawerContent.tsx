import {
    ColorValue,
    Image,
    ImageSourcePropType,
    Pressable,
    StyleSheet,
    View
} from 'react-native';
import React, { useState } from 'react';
import {
    DrawerContentComponentProps,
    DrawerContentScrollView
} from '@react-navigation/drawer';
import { moderateScale } from '../Constants/PixelRatio';
import { Icon, Text } from 'react-native-basic-elements';
import NavigationService from '../Services/Navigation';
import LinearGradient from 'react-native-linear-gradient';
import { FONTS } from '../Constants/Fonts';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../Redux/reducer/User';
import { RootState } from '../Redux/store';
import { getUserAvatarSource } from '../Constants/ProfileImage';

type DrawerListItem = {
    title: string;
    source: ImageSourcePropType;
    onPress?: () => void;
    color?: ColorValue;
};
type Props = DrawerContentComponentProps;
const CustomDrawerContent: React.FC<Props> = (props) => {
    const { userData } = useSelector((state: RootState) => state.User);

    const dispatch = useDispatch();
    const DrawerList: Array<DrawerListItem> = [
        // {
        //     title: 'DVIR',
        //     source: require('../Assets/Icons/error.png')
        // },
        {
            title: 'Connect ELD',
            source: require('../Assets/Icons/Device.png'),
            onPress: () => {
                NavigationService.closeDrawer();
                NavigationService.navigate('ConnectELD');
            }
        },
        {
            title: 'DOT Inspection',
            source: require('../Assets/Icons/checklist.png'),
            onPress: () => NavigationService.navigate('DotInspection')
        },
        {
            title: 'Safety',
            source: require('../Assets/Icons/rules.png'),
            onPress: () => NavigationService.navigate('Safety')
        },
        {
            title: 'Messages',
            source: require('../Assets/Icons/messages.png'),
            onPress: () => {
                NavigationService.closeDrawer();
                NavigationService.navigate('Meaasge', {
                    screen: 'RecentChats',
                    params: { showBack: true }
                });
            }
        },
        {
            title: 'Documents',
            source: require('../Assets/Icons/document.png')
        },
        // {
        //     title: 'Information Packet',
        //     source: require('../Assets/Icons/FAQ.png')
        // },
        {
            title: 'Log Out',
            source: require('../Assets/Icons/logout.png'),
            color: '#FA1740',
            onPress: () => {
                dispatch(logout());
            }
        }
    ];
    return (
        <DrawerContentScrollView {...props}>
            <View style={styles.headerContainer}>
                <Icon
                    name="chevron-right"
                    type="Feather"
                    size={moderateScale(22)}
                    color="#392969"
                    onPress={() => NavigationService.closeDrawer()}
                />

                <Icon
                    name="settings"
                    type="Feather"
                    size={moderateScale(22)}
                    color="#392969"
                    onPress={() => {
                        NavigationService.closeDrawer();
                        NavigationService.navigate('AccountSetting');
                    }}
                />
            </View>

            <Pressable
                onPress={() => {
                    NavigationService.closeDrawer();
                    NavigationService.navigate('AccountSetting');
                }}
            >
                <LinearGradient
                    colors={['rgba(217, 217, 217, 0.4)', 'rgba(115, 115, 115, 0.41)']}
                    style={styles.profileContainer}
                >
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center'
                        }}
                    >
                        <Image
                            source={getUserAvatarSource(userData?.avatar_image)}
                            style={{
                                height: moderateScale(65),
                                width: moderateScale(65),
                                borderRadius: moderateScale(65 / 2)
                            }}
                            resizeMode="cover"
                        />

                        <Text
                            style={{
                                fontFamily: FONTS.ProductSans.regular,
                                fontSize: moderateScale(20),
                                width: '50%',
                                marginLeft: moderateScale(13)
                            }}
                        >
                            {`${userData?.first_name} ${userData?.last_name}`}
                        </Text>
                    </View>

                    <Text
                        style={{
                            marginLeft: moderateScale(78),
                            fontFamily: FONTS.ProductSans.regular,
                            fontSize: moderateScale(10)
                        }}
                    >
                        Account Settings
                    </Text>
                </LinearGradient>
            </Pressable>

            {DrawerList.map((item, index) => {
                return (
                    <Pressable
                        style={styles.itemContainer}
                        key={index}
                        onPress={item.onPress}
                    >
                        <Image
                            source={item.source}
                            style={styles.imgStyle}
                            tintColor={item.color}
                        />

                        <Text
                            style={[
                                styles.itemText,
                                {
                                    color: item.color ?? '#392969'
                                }
                            ]}
                        >
                            {item.title}
                        </Text>
                    </Pressable>
                );
            })}
        </DrawerContentScrollView>
    );
};

export default CustomDrawerContent;

const styles = StyleSheet.create({
    headerContainer: {
        height: moderateScale(50),
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingLeft: moderateScale(20),
        paddingRight: moderateScale(10)
    },
    profileContainer: {
        paddingHorizontal: moderateScale(20),
        paddingVertical: moderateScale(10),
        marginHorizontal: moderateScale(9),
        borderRadius: moderateScale(20),
        marginBottom: moderateScale(15)
    },
    itemContainer: {
        height: moderateScale(53),
        marginHorizontal: moderateScale(30),
        flexDirection: 'row',
        alignItems: 'center'
    },
    imgStyle: {
        height: moderateScale(20),
        width: moderateScale(20),
        resizeMode: 'contain'
    },
    itemText: {
        fontFamily: FONTS.ProductSans.regular,
        fontSize: moderateScale(14),
        marginLeft: moderateScale(15)
    }
});
