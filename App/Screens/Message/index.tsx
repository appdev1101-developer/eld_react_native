import {
    ActivityIndicator,
    FlatList,
    Image,
    Pressable,
    RefreshControl,
    StyleSheet,
    TextInput,
    View
} from 'react-native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import LinearGradient from 'react-native-linear-gradient';
import HomeHeader from '../../Components/Headers/HomeHeader';
import { useRecentChats } from '../../core/hooks/useRecentChats';
import { Container, Icon, Text } from 'react-native-basic-elements';
import AppStatusBar from '../../Components/AppStatusBar';
import { moderateScale } from '../../Constants/PixelRatio';
import { FONTS } from '../../Constants/Fonts';
import { getAvatarSource } from '../../Constants/MessageMockData';
import NavigationService from '../../Services/Navigation';
import Modal from 'react-native-modal';
import { useSelector } from 'react-redux';
import { RootState } from '../../Redux/store';
import { useFocusEffect } from '@react-navigation/native';
import messageWebSocket from '../../Utils/MessageWebSocket';
import { ChatPreviewItem } from '../../core/cache/messagesCache';
import { GRADIENT_HEADER, THEME } from '../../Constants/Theme';
import Util from '../../Utils/util';
import { ChatListItem } from '../../Model/Message';

type ChatTab = 'all' | 'groups';

const PRESENCE_COLORS: Record<string, string> = {
    online: '#3DCB6C',
    away: '#F5B93D'
    // 'offline' / undefined -> no dot at all
};

const RecentChats = () => {
    const { userData } = useSelector((state: RootState) => state.User);

    const senderId = userData?.id ?? 0;
    const masterId = userData?.master_id ?? senderId;

    const [search, setSearch] = useState('');
    const [searchVisible, setSearchVisible] = useState(false);
    const [activeTab, setActiveTab] = useState<ChatTab>('all');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const {
        loading,
        recentChats,
        loadChats,
        refresh,
        handleNewMessage,
        driverList,
        groupList,
    } = useRecentChats({ senderId, masterId });

    // useFocusEffect(
    //     useCallback(() => {
    //         loadChats();
    //     }, [loadChats])
    // );

    useEffect(() => {
    loadChats();
}, [loadChats]);

    useEffect(() => {
        const unsub = messageWebSocket.on('new_message', handleNewMessage);
        return unsub;
    }, [handleNewMessage]);

    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        await refresh();
        setRefreshing(false);
    }, [refresh]);

    const filteredChats = useMemo(
        () => 
        {
            const recentIds = new Set(
                recentChats.map((chat) => String(chat.id))
            );

            const driversWithoutRecentChat = driverList
            .filter(
                (driver) =>
                    !recentIds.has(String(driver.id))
            )
            .map((driver): ChatPreviewItem => ({
                id: String(driver.id),
                receiverId: driver.id,
                name: driver?.first_name+" "+driver?.last_name,
                avatar: driver?.image_url ?? '',
                isGroup: false,

                // Defaults for a driver without a conversation
                lastMessage: '',
                timestamp: '',
                unread: 0,
            }));

            const groupsWithoutRecentChat = groupList
            .filter(
                (group) =>
                    !recentIds.has(String(group.id))
            )
            .map((group): ChatPreviewItem => ({
                id: String(group.id),
                receiverId: group.id,
                name: group?.group_name ?? 'Unknown',
                avatar: group?.image_url ?? '',
                isGroup: true,

                // Defaults for a driver without a conversation
                lastMessage: '',
                timestamp: '',
                unread: 0,
            }));



            const allChats = [
                ...recentChats,
                ...driversWithoutRecentChat,
                ...groupsWithoutRecentChat,
            ];

            const searchText = search.toLowerCase();

            return allChats
            .filter((chat) =>
                activeTab === 'groups'
                    ? chat.isGroup
                    : !chat.isGroup
            )
            .filter((chat) => {
                const name =
                    chat.name?.toLowerCase() ?? '';

                const lastMessage =
                    chat.lastMessage?.toLowerCase() ?? '';

                return (
                    name.includes(searchText) ||
                    lastMessage.includes(searchText)
                );
            });

        }, [recentChats, driverList,groupList, search, activeTab]
    );

    const openChat = (chat: ChatPreviewItem) => {
        NavigationService.navigate('ChatThread', {
            receiverId: chat.receiverId,
            chatName: chat.name,
            isGroup: chat.isGroup,
            avatar: chat.avatar
        });
    };

    const toggleSearch = () => {
        setSearchVisible((visible) => {
            if (visible) {
                setSearch('');
            }
            return !visible;
        });
    };

    return (
        <Container>
            <AppStatusBar />
            <LinearGradient
                colors={GRADIENT_HEADER}
                style={{ flex: 1 }}
            >
            <HomeHeader />
            <View style={styles.screen}>
                <View style={styles.headerRow}>
                    <Text style={styles.headerTitle}>Recent Chats</Text>
                    <Pressable
                        onPress={toggleSearch}
                        hitSlop={moderateScale(10)}
                    >
                        <Icon
                            name={searchVisible ? 'x' : 'search'}
                            type="Feather"
                            size={moderateScale(22)}
                            color={THEME.colors.textPrimary}
                        />
                    </Pressable>
                </View>

                {searchVisible ? (
                    <View style={styles.searchBox}>
                        <Icon
                            name="search"
                            type="Feather"
                            size={moderateScale(15)}
                            color={THEME.colors.textMuted}
                        />
                        <TextInput
                            autoFocus
                            placeholder="Search chats..."
                            placeholderTextColor={THEME.colors.textMuted}
                            value={search}
                            onChangeText={setSearch}
                            style={styles.searchInput}
                        />
                    </View>
                ) : null}

                <View style={styles.tabsRow}>
                    <Pressable
                        style={[styles.tabChip, activeTab === 'all' && styles.tabChipActive]}
                        onPress={() => setActiveTab('all')}
                    >
                        <Text
                            style={{
                                ...styles.tabChipText,
                                ...(activeTab === 'all' && styles.tabChipTextActive)
                            }}
                        >
                            All chats
                        </Text>
                    </Pressable>
                    <Pressable
                        style={{
                            ...styles.tabChip,
                            ...(activeTab === 'groups' && styles.tabChipActive)
                        }}
                        onPress={() => setActiveTab('groups')}
                    >
                        <Text
                            style={{
                                ...styles.tabChipText,
                                ...(activeTab === 'groups' && styles.tabChipTextActive)
                            }}
                        >
                            Groups
                        </Text>
                    </Pressable>
                </View>

                {loading ? (
                    <View style={styles.loadingWrap}>
                        <ActivityIndicator
                            size="large"
                            color={THEME.colors.primaryLight}
                        />
                    </View>
                ) : (
                    <FlatList
                        data={filteredChats}
                        keyExtractor={(item) => item.id}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.listContent}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={handleRefresh}
                                colors={[THEME.colors.primary]}
                                tintColor={THEME.colors.primary}
                            />
                        }
                        ListEmptyComponent={
                            <View style={styles.emptyWrap}>
                                <Text style={styles.emptyText}>
                                    No conversations yet
                                </Text>
                            </View>
                        }
                        renderItem={({ item }) => {
                            // const presenceColor = item.presence
                            //     ? PRESENCE_COLORS[item.presence]
                            //     : undefined;
                            return (
                                <Pressable
                                    style={styles.chatItem}
                                    onPress={() => openChat(item)}
                                >
                                    <View style={styles.avatarWrap}>
                                        <Image
                                            source={getAvatarSource(item.avatar)}
                                            style={styles.chatAvatar}
                                        />
                                        {/* {presenceColor ? (
                                            <View
                                                style={[
                                                    styles.presenceDot,
                                                    { backgroundColor: presenceColor }
                                                ]}
                                            />
                                        ) : null} */}
                                    </View>

                                    <View style={styles.chatContent}>
                                        <Text
                                            style={styles.chatName}
                                            numberOfLines={1}
                                        >
                                            {item.name}
                                        </Text>
                                        <Text
                                            style={styles.chatMessage}
                                            numberOfLines={1}
                                        >
                                            {item.lastMessage || ''}
                                        </Text>
                                    </View>

                                    <View style={styles.chatMeta}>
                                        {item.timestamp ? (
                                            <Text style={styles.chatTime}>{Util.getSectionItemTime(item.timestamp)}</Text>
                                            ):null}
                                        {item.unread ? (
                                            <View style={styles.unreadBadge}>
                                                <Text style={styles.unreadText}>
                                                    {item.unread}
                                                </Text>
                                            </View>
                                        ) : null}
                                    </View>
                                </Pressable>
                            );
                        }}
                    />
                )}

                <Pressable
                    style={styles.fab}
                    onPress={() => setShowCreateModal(true)}
                >
                    <Icon
                        name="message-circle"
                        type="Feather"
                        size={moderateScale(24)}
                        color={THEME.colors.textOnDark}
                    />
                </Pressable>

                <Modal
                    isVisible={showCreateModal}
                    style={styles.modal}
                    backdropOpacity={0.4}
                    onBackdropPress={() => setShowCreateModal(false)}
                    onBackButtonPress={() => setShowCreateModal(false)}
                    animationIn="slideInUp"
                    animationOut="slideOutDown"
                >
                    <View style={styles.modalSheet}>
                        <View style={styles.modalHandle} />
                        <Pressable
                            style={styles.modalOption}
                            onPress={() => {
                                setShowCreateModal(false);
                                NavigationService.navigate('CreateGroupChat');
                            }}
                        >
                            <Icon
                                name="users"
                                type="Feather"
                                size={moderateScale(20)}
                                color={THEME.colors.primary}
                            />
                            <Text style={styles.modalOptionText}>
                                Create a Message group
                            </Text>
                        </Pressable>
                        <View style={styles.modalDivider} />
                        <Pressable
                            style={styles.modalOption}
                            onPress={() => {
                                setShowCreateModal(false);
                                NavigationService.navigate('CreatePersonalChat');
                            }}
                        >
                            <Icon
                                name="message-circle"
                                type="Feather"
                                size={moderateScale(20)}
                                color={THEME.colors.primary}
                            />
                            <Text style={styles.modalOptionText}>
                                Start a Personal Chat
                            </Text>
                        </Pressable>
                    </View>
                </Modal>
            </View>
            </LinearGradient>
        </Container>
    );
};

export default RecentChats;

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: THEME.colors.surface,
        borderTopRightRadius: THEME.radius.sheet,
        borderTopLeftRadius: THEME.radius.sheet
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: moderateScale(20),
        paddingTop: moderateScale(22),
        paddingBottom: moderateScale(16)
    },
    headerTitle: {
        color: THEME.colors.textPrimary,
        fontFamily: FONTS.ProductSans.bold,
        fontSize: moderateScale(22)
    },
    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: THEME.colors.surfaceElevated,
        borderRadius: THEME.radius.sm,
        marginHorizontal: moderateScale(20),
        marginBottom: moderateScale(12),
        paddingHorizontal: moderateScale(14),
        height: moderateScale(42),
        gap: moderateScale(8)
    },
    searchInput: {
        flex: 1,
        fontFamily: FONTS.ProductSans.regular,
        fontSize: moderateScale(14),
        color: THEME.colors.textPrimary,
        padding: 0
    },
    tabsRow: {
        flexDirection: 'row',
        gap: moderateScale(10),
        paddingHorizontal: moderateScale(20),
        marginBottom: moderateScale(18)
    },
    tabChip: {
        paddingHorizontal: moderateScale(18),
        paddingVertical: moderateScale(9),
        borderRadius: moderateScale(18),
        backgroundColor: THEME.colors.surfaceElevated
    },
    tabChipActive: {
        backgroundColor: THEME.colors.primary
    },
    tabChipText: {
        fontFamily: FONTS.ProductSans.regular,
        fontSize: moderateScale(14),
        color: THEME.colors.textMuted
    },
    tabChipTextActive: {
        color: THEME.colors.textOnDark,
        fontFamily: FONTS.ProductSans.bold
    },
    loadingWrap: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    emptyWrap: {
        paddingTop: moderateScale(40),
        alignItems: 'center'
    },
    emptyText: {
        fontFamily: FONTS.ProductSans.regular,
        fontSize: moderateScale(14),
        color: THEME.colors.textMuted
    },
    listContent: {
        paddingHorizontal: moderateScale(20),
        paddingBottom: moderateScale(100)
    },
    chatItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: moderateScale(14)
    },
    avatarWrap: {
        position: 'relative'
    },
    chatAvatar: {
        height: moderateScale(52),
        width: moderateScale(52),
        borderRadius: moderateScale(26)
    },
    presenceDot: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: moderateScale(13),
        height: moderateScale(13),
        borderRadius: moderateScale(7),
        borderWidth: 2,
        borderColor: THEME.colors.surface
    },
    chatContent: {
        flex: 1,
        marginLeft: moderateScale(14)
    },
    chatName: {
        fontFamily: FONTS.ProductSans.bold,
        fontSize: moderateScale(16),
        color: THEME.colors.textPrimary
    },
    chatMessage: {
        marginTop: moderateScale(3),
        fontFamily: FONTS.ProductSans.regular,
        fontSize: moderateScale(13),
        color: THEME.colors.textMuted
    },
    chatMeta: {
        alignItems: 'flex-end',
        marginLeft: moderateScale(8)
    },
    chatTime: {
        fontFamily: FONTS.ProductSans.regular,
        fontSize: moderateScale(12),
        color: THEME.colors.textMuted
    },
    unreadBadge: {
        marginTop: moderateScale(6),
        backgroundColor: THEME.colors.primary,
        borderRadius: moderateScale(10),
        minWidth: moderateScale(20),
        height: moderateScale(20),
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: moderateScale(6)
    },
    unreadText: {
        fontFamily: FONTS.ProductSans.bold,
        fontSize: moderateScale(11),
        color: THEME.colors.textOnDark
    },
    fab: {
        position: 'absolute',
        bottom: moderateScale(20),
        right: moderateScale(20),
        height: moderateScale(56),
        width: moderateScale(56),
        borderRadius: moderateScale(28),
        backgroundColor: THEME.colors.accent,
        justifyContent: 'center',
        alignItems: 'center',
        ...THEME.shadow.fab
    },
    modal: {
        margin: 0,
        justifyContent: 'flex-end'
    },
    modalSheet: {
        backgroundColor: THEME.colors.surface,
        borderTopLeftRadius: THEME.radius.lg,
        borderTopRightRadius: THEME.radius.lg,
        paddingBottom: moderateScale(30),
        paddingTop: moderateScale(10)
    },
    modalHandle: {
        width: moderateScale(40),
        height: moderateScale(4),
        backgroundColor: THEME.colors.border,
        borderRadius: moderateScale(2),
        alignSelf: 'center',
        marginBottom: moderateScale(15)
    },
    modalOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: moderateScale(25),
        paddingVertical: moderateScale(16),
        gap: moderateScale(15)
    },
    modalOptionText: {
        fontFamily: FONTS.ProductSans.regular,
        fontSize: moderateScale(16),
        color: THEME.colors.textPrimary
    },
    modalDivider: {
        height: 1,
        backgroundColor: THEME.colors.borderLight,
        marginHorizontal: moderateScale(25)
    }
});