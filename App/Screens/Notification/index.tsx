import {
    ActivityIndicator,
    FlatList,
    Image,
    Pressable,
    RefreshControl,
    StyleSheet,
    View
} from 'react-native';
import React, { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Container, Icon, Text } from 'react-native-basic-elements';
import AppStatusBar from '../../Components/AppStatusBar';
import LinearGradient from 'react-native-linear-gradient';
import HomeHeader from '../../Components/Headers/HomeHeader';
import { moderateScale } from '../../Constants/PixelRatio';
import { FONTS } from '../../Constants/Fonts';
import { useNotifications } from '../../core/hooks/useNotifications';
import moment from 'moment';
import Modal from 'react-native-modal';
import { THEME, GRADIENT_HEADER } from '../../Constants/Theme';

const Notification = () => {
    const [selectedTab, setSelectedTab] = useState<'ALL' | 'UNREAD' | 'READ'>('ALL');
    const [filterModal, setFilterModal] = useState<boolean>(false);
    const [selectedFilters, setSelectedFilters] = useState<number | null>(null);
    const {
        allNotifications,
        unreadNotifications,
        readNotifications,
        loading,
        refreshing,
        loadNotifications,
        refresh,
        markAllRead
    } = useNotifications();

    const isFirstFocus = useRef(true);

    useFocusEffect(
        useCallback(() => {
            loadNotifications({ showLoading: isFirstFocus.current });
            if (isFirstFocus.current) {
                isFirstFocus.current = false;
            }
        }, [loadNotifications])
    );

    const handleMarkAllAsRead = () => {
        markAllRead().catch((error) => console.log('error', error));
    };

    const getData = () => {
        const data =
            selectedTab === 'ALL'
                ? allNotifications
                : selectedTab === 'UNREAD'
                ? unreadNotifications
                : readNotifications;
        if (selectedFilters === null) {
            return data;
        } else {
            return data.filter((it) => it.type == selectedFilters);
        }
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
                    color={THEME.colors.primary}
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
                <HomeHeader />

                <View style={styles.bodyCard}>
                    <View style={styles.header}>
                        <View style={styles.headerSideSpacer} />
                        <View style={styles.headerTitleWrap}>
                            <Text style={styles.headerText}>Notification</Text>
                        </View>
                        <Pressable
                            style={styles.headerAction}
                            onPress={() => setFilterModal(true)}
                        >
                            <Icon
                                name="dots-three-vertical"
                                type="Entypo"
                            />
                        </Pressable>
                    </View>

                    {unreadNotifications.length > 0 ? (
                        <Pressable
                            style={{ alignSelf: 'flex-end', marginBottom: 8, marginRight: 16 }}
                            onPress={handleMarkAllAsRead}
                        >
                            <Text
                                style={{
                                    color: THEME.colors.accent,
                                    fontFamily: FONTS.ProductSans.regular,
                                    fontSize: moderateScale(12)
                                }}
                            >
                                Mark all as read
                            </Text>
                        </Pressable>
                    ) : null}

                    <View style={styles.tab}>
                        <Pressable
                            style={[
                                styles.tabItem,
                                {
                                    borderBottomColor: THEME.colors.accent,
                                    borderBottomWidth: selectedTab === 'ALL' ? 1 : 0
                                }
                            ]}
                            onPress={() => setSelectedTab('ALL')}
                        >
                            <Text
                                style={{
                                    color: selectedTab === 'ALL' ? THEME.colors.accent : THEME.colors.textSecondary,
                                    fontFamily: FONTS.ProductSans.regular,
                                    fontSize: moderateScale(16)
                                }}
                            >
                                All
                            </Text>
                        </Pressable>

                        <Pressable
                            style={[
                                styles.tabItem,
                                {
                                    borderBottomColor: THEME.colors.accent,
                                    borderBottomWidth: selectedTab === 'UNREAD' ? 1 : 0
                                }
                            ]}
                            onPress={() => setSelectedTab('UNREAD')}
                        >
                            <Text
                                style={{
                                    color:
                                        selectedTab === 'UNREAD' ? THEME.colors.accent : THEME.colors.textSecondary,
                                    fontFamily: FONTS.ProductSans.regular,
                                    fontSize: moderateScale(16)
                                }}
                            >
                                Unread
                            </Text>

                            {unreadNotifications.length > 0 ? (
                                <View
                                    style={{
                                        height: moderateScale(18),
                                        width: moderateScale(18),
                                        borderRadius: moderateScale(15),
                                        backgroundColor: THEME.colors.badgeMuted,
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        position: 'absolute',
                                        top: 10,
                                        right: -15
                                    }}
                                >
                                    <Text
                                        style={{
                                            fontFamily: FONTS.ProductSans.regular,
                                            color: '#FA1740',
                                            fontSize: moderateScale(12)
                                        }}
                                    >
                                        {unreadNotifications.length}
                                    </Text>
                                </View>
                            ) : null}
                        </Pressable>

                        <Pressable
                            style={[
                                styles.tabItem,
                                {
                                    borderBottomColor: THEME.colors.accent,
                                    borderBottomWidth: selectedTab === 'READ' ? 1 : 0
                                }
                            ]}
                            onPress={() => setSelectedTab('READ')}
                        >
                            <Text
                                style={{
                                    color: selectedTab === 'READ' ? THEME.colors.accent : THEME.colors.textSecondary,
                                    fontFamily: FONTS.ProductSans.regular,
                                    fontSize: moderateScale(16)
                                }}
                            >
                                Read
                            </Text>
                        </Pressable>
                    </View>

                    <FlatList
                        data={getData()}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={refresh}
                                colors={['#392969']}
                                tintColor="#392969"
                            />
                        }
                        keyExtractor={(item, index) => index.toString()}
                        renderItem={({ item }) => {
                            return (
                                <View
                                    style={{
                                        flexDirection: 'row',
                                        paddingVertical: moderateScale(15)
                                    }}
                                >
                                    <View
                                        style={{
                                            marginHorizontal: moderateScale(10)
                                        }}
                                    >
                                        <Image
                                            source={{
                                                uri: 'https://static.vecteezy.com/system/resources/previews/009/292/244/non_2x/default-avatar-icon-of-social-media-user-vector.jpg'
                                            }}
                                            style={{
                                                height: moderateScale(30),
                                                width: moderateScale(30),
                                                borderRadius: moderateScale(15),
                                                resizeMode: 'cover'
                                            }}
                                        />
                                    </View>

                                    <View
                                        style={{
                                            flex: 1
                                        }}
                                    >
                                        <Text
                                            style={{
                                                fontFamily: FONTS.ProductSans.regular,
                                                fontSize: moderateScale(12),
                                                color: '#1A1F36'
                                            }}
                                        >
                                            {item.data?.message}
                                        </Text>

                                        <Text
                                            style={{
                                                fontFamily: FONTS.ProductSans.regular,
                                                fontSize: moderateScale(12),
                                                color: '#A5ACB8',
                                                marginTop: moderateScale(5)
                                            }}
                                        >
                                            {moment(item.created_at).calendar()}
                                        </Text>
                                    </View>

                                    {!item.read_at ? (
                                        <View
                                            style={{
                                                height: moderateScale(7),
                                                width: moderateScale(7),
                                                borderRadius: moderateScale(7),
                                                borderWidth: 0.9,
                                                borderColor: '#4299E1',
                                                backgroundColor: '#90CDF4',
                                                position: 'absolute',
                                                top: moderateScale(6),
                                                left: moderateScale(6)
                                            }}
                                        />
                                    ) : null}
                                </View>
                            );
                        }}
                        ItemSeparatorComponent={() => {
                            return (
                                <View
                                    style={{
                                        borderWidth: 0.5,
                                        borderColor: '#E4E8EE'
                                    }}
                                />
                            );
                        }}
                    />
                </View>

                <Modal
                    isVisible={filterModal}
                    style={{
                        margin: 0,
                        alignItems: 'flex-end',
                        justifyContent: 'flex-start'
                    }}
                    backdropOpacity={0.3}
                    onBackButtonPress={() => setFilterModal(false)}
                    onBackdropPress={() => setFilterModal(false)}
                    animationIn={'fadeIn'}
                    animationOut={'fadeOut'}
                >
                    <View
                        style={{
                            backgroundColor: '#fff',
                            marginTop: moderateScale(100),
                            marginRight: moderateScale(30),
                            borderRadius: moderateScale(2)
                        }}
                    >
                        <Pressable
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                paddingHorizontal: moderateScale(15),
                                paddingVertical: moderateScale(10)
                            }}
                            onPress={() => {
                                setSelectedFilters(1);
                                setFilterModal(false);
                            }}
                        >
                            <Image
                                source={require('../../Assets/Icons/safety.png')}
                                style={{
                                    height: moderateScale(30),
                                    width: moderateScale(30),
                                    resizeMode: 'contain'
                                }}
                            />

                            <Text
                                style={{
                                    fontFamily: FONTS.ProductSans.regular,
                                    color: '#000000',
                                    fontSize: moderateScale(15),
                                    textTransform: 'capitalize',
                                    marginLeft: moderateScale(10)
                                }}
                            >
                                Safety related
                            </Text>
                        </Pressable>

                        <Pressable
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                paddingHorizontal: moderateScale(15),
                                paddingVertical: moderateScale(10),
                                borderTopWidth: 0.7,
                                borderBottomWidth: 0.7,
                                borderColor: '#E4E8EE'
                            }}
                            onPress={() => {
                                setSelectedFilters(2);
                                setFilterModal(false);
                            }}
                        >
                            <Image
                                source={require('../../Assets/Icons/hos.png')}
                                style={{
                                    height: moderateScale(30),
                                    width: moderateScale(30),
                                    resizeMode: 'contain'
                                }}
                            />

                            <Text
                                style={{
                                    fontFamily: FONTS.ProductSans.regular,
                                    color: '#000000',
                                    fontSize: moderateScale(15),
                                    textTransform: 'capitalize',
                                    marginLeft: moderateScale(10)
                                }}
                            >
                                HOS Related
                            </Text>
                        </Pressable>

                        <Pressable
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                paddingHorizontal: moderateScale(15),
                                paddingVertical: moderateScale(10),
                                borderBottomWidth: 0.7,
                                borderColor: '#E4E8EE'
                            }}
                            onPress={() => {
                                setSelectedFilters(3);
                                setFilterModal(false);
                            }}
                        >
                            <Image
                                source={require('../../Assets/Icons/vehicle.png')}
                                style={{
                                    height: moderateScale(30),
                                    width: moderateScale(30),
                                    resizeMode: 'contain'
                                }}
                            />

                            <Text
                                style={{
                                    fontFamily: FONTS.ProductSans.regular,
                                    color: '#000000',
                                    fontSize: moderateScale(15),
                                    textTransform: 'capitalize',
                                    marginLeft: moderateScale(10)
                                }}
                            >
                                Vehicle Information
                            </Text>
                        </Pressable>

                        <Pressable
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                paddingHorizontal: moderateScale(15),
                                paddingVertical: moderateScale(10)
                            }}
                            onPress={() => {
                                setSelectedFilters(4);
                                setFilterModal(false);
                            }}
                        >
                            <Image
                                source={require('../../Assets/Icons/others.png')}
                                style={{
                                    height: moderateScale(30),
                                    width: moderateScale(30),
                                    resizeMode: 'contain'
                                }}
                            />

                            <Text
                                style={{
                                    fontFamily: FONTS.ProductSans.regular,
                                    color: '#000000',
                                    fontSize: moderateScale(15),
                                    textTransform: 'capitalize',
                                    marginLeft: moderateScale(10)
                                }}
                            >
                                Others
                            </Text>
                        </Pressable>
                    </View>
                </Modal>
            </LinearGradient>
        </Container>
    );
};

export default Notification;

const styles = StyleSheet.create({
    bodyCard: {
        backgroundColor: THEME.colors.surface,
        paddingTop: moderateScale(20),
        flex: 1,
        zIndex: 1,
        borderTopRightRadius: THEME.radius.sheet,
        borderTopLeftRadius: THEME.radius.sheet
    },
    header: {
        height: moderateScale(40),
        marginHorizontal: moderateScale(15),
        flexDirection: 'row',
        alignItems: 'center'
    },
    headerSideSpacer: {
        width: moderateScale(40)
    },
    headerTitleWrap: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    headerAction: {
        height: moderateScale(40),
        width: moderateScale(40),
        justifyContent: 'center',
        alignItems: 'center'
    },
    headerText: {
        color: THEME.colors.textPrimary,
        fontFamily: FONTS.ProductSans.bold,
        fontSize: moderateScale(20)
    },
    tab: {
        height: moderateScale(50),
        borderBottomWidth: 0.9,
        borderColor: '#E4E8EE',
        flexDirection: 'row',
        justifyContent: 'center'
    },
    tabItem: {
        justifyContent: 'center',
        marginHorizontal: moderateScale(10)
    }
});
