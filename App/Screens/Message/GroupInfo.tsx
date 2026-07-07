import {
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    View
} from 'react-native';
import React, { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Container, Icon, Text } from 'react-native-basic-elements';
import AppStatusBar from '../../Components/AppStatusBar';
import LinearGradient from 'react-native-linear-gradient';
import { moderateScale } from '../../Constants/PixelRatio';
import { FONTS } from '../../Constants/Fonts';
import NavigationService from '../../Services/Navigation';
import { RouteProp, useRoute } from '@react-navigation/native';
import { GRADIENT_HEADER } from '../../Constants/Theme';
import {
    GROUP_INFO,
    GroupMember,
    getAvatarSource
} from '../../Constants/MessageMockData';

type GroupInfoParams = {
    GroupInfo: {
        chatId: string;
    };
};

const GroupInfo = () => {
    const insets = useSafeAreaInsets();
    const route = useRoute<RouteProp<GroupInfoParams, 'GroupInfo'>>();
    const { chatId } = route.params;
    const group = GROUP_INFO[chatId as keyof typeof GROUP_INFO];
    const [notifications, setNotifications] = useState(
        group?.notificationsEnabled ?? true
    );
    const [members, setMembers] = useState<GroupMember[]>(
        group?.members ?? []
    );
    const [activeTab, setActiveTab] = useState<'about' | 'media'>('about');

    if (!group) {
        return (
            <Container style={styles.centered}>
                <Text>Group not found</Text>
            </Container>
        );
    }

    const toggleFollow = (memberId: string) => {
        setMembers((prev) =>
            prev.map((m) =>
                m.id === memberId
                    ? { ...m, isFollowing: !m.isFollowing }
                    : m
            )
        );
    };

    return (
        <Container>
            <AppStatusBar />
            <LinearGradient
                colors={GRADIENT_HEADER}
                style={{ flex: 1 }}
            >
                <View style={[styles.header, { marginTop: insets.top }]}>
                    <Pressable
                        onPress={() => NavigationService.back()}
                        hitSlop={10}
                    >
                        <Icon
                            name="chevron-left"
                            type="Feather"
                            size={moderateScale(22)}
                            color="#fff"
                        />
                    </Pressable>
                    <Text style={styles.headerTitle}>{group.name}</Text>
                    <View style={{ width: moderateScale(22) }} />
                </View>

                <ScrollView
                    style={styles.bodyCard}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.profileSection}>
                        <Image
                            source={getAvatarSource(group.avatar)}
                            style={styles.groupAvatar}
                        />
                        <Text style={styles.groupName}>{group.name}</Text>
                        <View style={styles.locationRow}>
                            <Icon
                                name="map-pin"
                                type="Feather"
                                size={moderateScale(14)}
                                color="#697386"
                            />
                            <Text style={styles.locationText}>
                                {group.distance}
                            </Text>
                        </View>
                        <View style={styles.notificationRow}>
                            <Text style={styles.notificationLabel}>
                                Notifications
                            </Text>
                            <Switch
                                value={notifications}
                                onValueChange={setNotifications}
                                trackColor={{
                                    false: '#E4E8EE',
                                    true: '#7051CF'
                                }}
                                thumbColor="#fff"
                            />
                        </View>
                    </View>

                    <View style={styles.tabRow}>
                        <Pressable
                            style={[
                                styles.tab,
                                activeTab === 'about' && styles.tabActive
                            ]}
                            onPress={() => setActiveTab('about')}
                        >
                            <Text
                                style={[
                                    styles.tabText,
                                    activeTab === 'about' && styles.tabTextActive
                                ]}
                            >
                                About
                            </Text>
                        </Pressable>
                        <Pressable
                            style={[
                                styles.tab,
                                activeTab === 'media' && styles.tabActive
                            ]}
                            onPress={() => {
                                setActiveTab('media');
                                NavigationService.navigate('GroupMedia', {
                                    chatId
                                });
                            }}
                        >
                            <Text
                                style={[
                                    styles.tabText,
                                    activeTab === 'media' && styles.tabTextActive
                                ]}
                            >
                                Media
                            </Text>
                        </Pressable>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>About</Text>
                        <Text style={styles.aboutText}>{group.about}</Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>Events</Text>
                        {group.events.map((event) => (
                            <View
                                key={event.id}
                                style={styles.eventCard}
                            >
                                <Text style={styles.eventTitle}>
                                    {event.title}
                                </Text>
                                <View style={styles.eventDetail}>
                                    <Icon
                                        name="calendar"
                                        type="Feather"
                                        size={moderateScale(14)}
                                        color="#7051CF"
                                    />
                                    <Text style={styles.eventDetailText}>
                                        {event.date} · {event.time}
                                    </Text>
                                </View>
                                <View style={styles.eventDetail}>
                                    <Icon
                                        name="map-pin"
                                        type="Feather"
                                        size={moderateScale(14)}
                                        color="#7051CF"
                                    />
                                    <Text style={styles.eventDetailText}>
                                        {event.location}
                                    </Text>
                                </View>
                            </View>
                        ))}
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>
                            {members.length} People
                        </Text>
                        {members.map((member) => (
                            <View
                                key={member.id}
                                style={styles.memberRow}
                            >
                                <Image
                                    source={getAvatarSource(member.avatar)}
                                    style={styles.memberAvatar}
                                />
                                <Text style={styles.memberName}>
                                    {member.name}
                                </Text>
                                <Pressable
                                    style={[
                                        styles.followBtn,
                                        member.isFollowing &&
                                            styles.followingBtn
                                    ]}
                                    onPress={() => toggleFollow(member.id)}
                                >
                                    <Text
                                        style={[
                                            styles.followText,
                                            member.isFollowing &&
                                                styles.followingText
                                        ]}
                                    >
                                        {member.isFollowing
                                            ? 'Following'
                                            : 'Follow'}
                                    </Text>
                                </Pressable>
                            </View>
                        ))}
                    </View>
                </ScrollView>
            </LinearGradient>
        </Container>
    );
};

export default GroupInfo;

const styles = StyleSheet.create({
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginHorizontal: moderateScale(15),
        marginBottom: moderateScale(10)
    },
    headerTitle: {
        fontFamily: FONTS.ProductSans.bold,
        fontSize: moderateScale(16),
        color: '#fff'
    },
    bodyCard: {
        flex: 1,
        backgroundColor: '#fff',
        borderTopLeftRadius: moderateScale(30),
        borderTopRightRadius: moderateScale(30)
    },
    profileSection: {
        alignItems: 'center',
        paddingVertical: moderateScale(25)
    },
    groupAvatar: {
        height: moderateScale(80),
        width: moderateScale(80),
        borderRadius: moderateScale(40),
        borderWidth: 3,
        borderColor: '#7051CF'
    },
    groupName: {
        fontFamily: FONTS.ProductSans.bold,
        fontSize: moderateScale(20),
        color: '#1A1F36',
        marginTop: moderateScale(12)
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: moderateScale(4),
        marginTop: moderateScale(6)
    },
    locationText: {
        fontFamily: FONTS.ProductSans.regular,
        fontSize: moderateScale(13),
        color: '#697386'
    },
    notificationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '80%',
        marginTop: moderateScale(16),
        paddingHorizontal: moderateScale(10)
    },
    notificationLabel: {
        fontFamily: FONTS.ProductSans.regular,
        fontSize: moderateScale(14),
        color: '#33404F'
    },
    tabRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderColor: '#E4E8EE',
        marginHorizontal: moderateScale(20)
    },
    tab: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: moderateScale(12)
    },
    tabActive: {
        borderBottomWidth: 2,
        borderBottomColor: '#7051CF'
    },
    tabText: {
        fontFamily: FONTS.ProductSans.regular,
        fontSize: moderateScale(14),
        color: '#A5ACB8'
    },
    tabTextActive: {
        fontFamily: FONTS.ProductSans.bold,
        color: '#7051CF'
    },
    section: {
        paddingHorizontal: moderateScale(20),
        paddingVertical: moderateScale(15)
    },
    sectionLabel: {
        fontFamily: FONTS.ProductSans.bold,
        fontSize: moderateScale(16),
        color: '#33404F',
        marginBottom: moderateScale(10)
    },
    aboutText: {
        fontFamily: FONTS.ProductSans.regular,
        fontSize: moderateScale(14),
        color: '#697386',
        lineHeight: moderateScale(22)
    },
    eventCard: {
        backgroundColor: '#F7F8FA',
        borderRadius: moderateScale(12),
        padding: moderateScale(14),
        marginBottom: moderateScale(10)
    },
    eventTitle: {
        fontFamily: FONTS.ProductSans.bold,
        fontSize: moderateScale(14),
        color: '#1A1F36',
        marginBottom: moderateScale(8)
    },
    eventDetail: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: moderateScale(6),
        marginTop: moderateScale(4)
    },
    eventDetailText: {
        fontFamily: FONTS.ProductSans.regular,
        fontSize: moderateScale(13),
        color: '#697386'
    },
    memberRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: moderateScale(10)
    },
    memberAvatar: {
        height: moderateScale(40),
        width: moderateScale(40),
        borderRadius: moderateScale(20)
    },
    memberName: {
        flex: 1,
        marginLeft: moderateScale(12),
        fontFamily: FONTS.ProductSans.regular,
        fontSize: moderateScale(14),
        color: '#1A1F36'
    },
    followBtn: {
        borderWidth: 1,
        borderColor: '#7051CF',
        borderRadius: moderateScale(16),
        paddingHorizontal: moderateScale(14),
        paddingVertical: moderateScale(6)
    },
    followingBtn: {
        backgroundColor: '#7051CF',
        borderColor: '#7051CF'
    },
    followText: {
        fontFamily: FONTS.ProductSans.regular,
        fontSize: moderateScale(12),
        color: '#7051CF'
    },
    followingText: {
        color: '#fff'
    }
});
