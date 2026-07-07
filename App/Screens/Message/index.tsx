import {
    ActivityIndicator,
    FlatList,
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    TextInput,
    View
} from 'react-native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRecentChats } from '../../core/hooks/useRecentChats';
import { Container, Icon, Text } from 'react-native-basic-elements';
import AppStatusBar from '../../Components/AppStatusBar';
import LinearGradient from 'react-native-linear-gradient';
import HomeHeader from '../../Components/Headers/HomeHeader';
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
import { THEME, GRADIENT_HEADER } from '../../Constants/Theme';

const RecentChats = () => {
    const { userData } = useSelector((state: RootState) => state.User);

    const senderId = userData?.id ?? 0;
    const masterId = userData?.master_id ?? senderId;

    const [search, setSearch] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const {
        loading,
        recentChats,
        lastTalkedTo,
        loadChats,
        handleNewMessage
    } = useRecentChats({ senderId, masterId });

    useFocusEffect(
        useCallback(() => {
            loadChats();
        }, [loadChats])
    );

    useEffect(() => {
        const unsub = messageWebSocket.on('new_message', handleNewMessage);
        return unsub;
    }, [handleNewMessage]);

    const filteredChats = useMemo(
        () =>
            recentChats.filter(
                (chat) =>
                    chat.name.toLowerCase().includes(search.toLowerCase()) ||
                    chat.lastMessage.toLowerCase().includes(search.toLowerCase())
            ),
        [recentChats, search]
    );

    const openChat = (chat: ChatPreviewItem) => {
        NavigationService.navigate('ChatThread', {
            receiverId: chat.receiverId,
            chatName: chat.name,
            isGroup: chat.isGroup,
            avatar: chat.avatar
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

                <View style={styles.searchRow}>
                    <View style={styles.searchBox}>
                        <Icon
                            name="search"
                            type="Feather"
                            size={moderateScale(16)}
                            color={THEME.colors.textMuted}
                        />
                        <TextInput
                            placeholder="Search chats..."
                            placeholderTextColor={THEME.colors.textMuted}
                            value={search}
                            onChangeText={setSearch}
                            style={styles.searchInput}
                        />
                    </View>
                </View>

                <View style={styles.bodyCard}>
                    <View style={styles.sectionHeader}>
                        <Image
                            source={require('../../Assets/Icons/talking.png')}
                            style={styles.sectionIcon}
                        />
                        <Text style={styles.sectionTitle}>Last Talked To</Text>
                    </View>

                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.lastTalkedList}
                    >
                        {lastTalkedTo.map((contact) => (
                            <Pressable
                                key={contact.id}
                                style={styles.lastTalkedItem}
                                onPress={() =>
                                    openChat({
                                        id: `chat-${contact.receiverId}`,
                                        receiverId: contact.receiverId,
                                        name: contact.name,
                                        avatar: contact.avatar,
                                        lastMessage: '',
                                        timestamp: '',
                                        isGroup: false
                                    })
                                }
                            >
                                <Image
                                    source={getAvatarSource(contact.avatar)}
                                    style={styles.lastTalkedAvatar}
                                />
                                <Text
                                    style={styles.lastTalkedName}
                                    numberOfLines={1}
                                >
                                    {contact.name}
                                </Text>
                            </Pressable>
                        ))}
                    </ScrollView>

                    <Text style={styles.recentTitle}>Recent Chats</Text>

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
                            contentContainerStyle={{ paddingBottom: moderateScale(90) }}
                            ListEmptyComponent={
                                <View style={styles.emptyWrap}>
                                    <Text style={styles.emptyText}>
                                        No conversations yet
                                    </Text>
                                </View>
                            }
                            renderItem={({ item }) => (
                                <Pressable
                                    style={styles.chatItem}
                                    onPress={() => openChat(item)}
                                >
                                    <Image
                                        source={getAvatarSource(item.avatar)}
                                        style={styles.chatAvatar}
                                    />
                                    <View style={styles.chatContent}>
                                        <View style={styles.chatTopRow}>
                                            <Text
                                                style={styles.chatName}
                                                numberOfLines={1}
                                            >
                                                {item.name}
                                            </Text>
                                            <Text style={styles.chatTime}>
                                                {item.timestamp}
                                            </Text>
                                        </View>
                                        <View style={styles.chatBottomRow}>
                                            <Text
                                                style={styles.chatMessage}
                                                numberOfLines={1}
                                            >
                                                {item.lastMessage}
                                            </Text>
                                            {item.unread ? (
                                                <View style={styles.unreadBadge}>
                                                    <Text style={styles.unreadText}>
                                                        {item.unread}
                                                    </Text>
                                                </View>
                                            ) : null}
                                        </View>
                                    </View>
                                </Pressable>
                            )}
                            ItemSeparatorComponent={() => (
                                <View style={styles.separator} />
                            )}
                        />
                    )}

                    <Pressable
                        style={styles.fab}
                        onPress={() => setShowCreateModal(true)}
                    >
                        <Icon
                            name="plus"
                            type="Feather"
                            size={moderateScale(24)}
                            color={THEME.colors.textOnDark}
                        />
                    </Pressable>
                </View>

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
            </LinearGradient>
        </Container>
    );
};

export default RecentChats;

const styles = StyleSheet.create({
    searchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: moderateScale(18),
        marginBottom: moderateScale(12),
        gap: moderateScale(10)
    },
    searchBox: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderRadius: THEME.radius.sm,
        paddingHorizontal: moderateScale(14),
        height: moderateScale(42),
        gap: moderateScale(8),
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)'
    },
    searchInput: {
        flex: 1,
        fontFamily: FONTS.ProductSans.regular,
        fontSize: moderateScale(14),
        color: THEME.colors.textOnDark,
        padding: 0
    },
    bodyCard: {
        backgroundColor: THEME.colors.surface,
        paddingTop: moderateScale(24),
        flex: 1,
        borderTopRightRadius: THEME.radius.sheet,
        borderTopLeftRadius: THEME.radius.sheet
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
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: moderateScale(20),
        gap: moderateScale(10)
    },
    sectionIcon: {
        height: moderateScale(22),
        width: moderateScale(22),
        resizeMode: 'contain'
    },
    sectionTitle: {
        color: THEME.colors.primary,
        fontFamily: FONTS.ProductSans.bold,
        fontSize: moderateScale(17),
        letterSpacing: 0.2
    },
    lastTalkedList: {
        paddingHorizontal: moderateScale(15),
        paddingVertical: moderateScale(15),
        gap: moderateScale(12)
    },
    lastTalkedItem: {
        alignItems: 'center',
        width: moderateScale(64)
    },
    lastTalkedAvatar: {
        height: moderateScale(52),
        width: moderateScale(52),
        borderRadius: moderateScale(26),
        borderWidth: 2,
        borderColor: THEME.colors.primaryLight
    },
    lastTalkedName: {
        marginTop: moderateScale(6),
        fontFamily: FONTS.ProductSans.regular,
        fontSize: moderateScale(11),
        color: THEME.colors.textPrimary,
        textAlign: 'center'
    },
    recentTitle: {
        marginHorizontal: moderateScale(20),
        marginBottom: moderateScale(12),
        fontFamily: FONTS.ProductSans.bold,
        fontSize: moderateScale(16),
        color: THEME.colors.textPrimary,
        letterSpacing: 0.2
    },
    chatItem: {
        flexDirection: 'row',
        paddingHorizontal: moderateScale(20),
        paddingVertical: moderateScale(12),
        alignItems: 'center'
    },
    chatAvatar: {
        height: moderateScale(48),
        width: moderateScale(48),
        borderRadius: moderateScale(24)
    },
    chatContent: {
        flex: 1,
        marginLeft: moderateScale(12)
    },
    chatTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    chatName: {
        flex: 1,
        fontFamily: FONTS.ProductSans.bold,
        fontSize: moderateScale(15),
        color: THEME.colors.textPrimary,
        marginRight: moderateScale(8)
    },
    chatTime: {
        fontFamily: FONTS.ProductSans.regular,
        fontSize: moderateScale(12),
        color: THEME.colors.textMuted
    },
    chatBottomRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: moderateScale(4)
    },
    chatMessage: {
        flex: 1,
        fontFamily: FONTS.ProductSans.regular,
        fontSize: moderateScale(13),
        color: THEME.colors.textSecondary
    },
    unreadBadge: {
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
    separator: {
        height: 1,
        backgroundColor: THEME.colors.borderLight,
        marginHorizontal: moderateScale(20)
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
