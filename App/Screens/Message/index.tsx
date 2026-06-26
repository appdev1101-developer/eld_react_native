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
import messageWebSocket, { wsTotalMsgToChatPreview } from '../../Utils/MessageWebSocket';
import { WsContact, WsTotalMsg } from '../../Model/Message';

type ChatPreviewItem = {
    id: string;
    receiverId: number;
    name: string;
    avatar: string;
    lastMessage: string;
    timestamp: string;
    unread?: number;
    isGroup: boolean;
    sentTime?: string;
};

const RecentChats = () => {
    const { userData } = useSelector((state: RootState) => state.User);

    console.log("userData", JSON.stringify(userData));
    const senderId = userData?.id ?? 0;
    const masterId = userData?.master_id ?? senderId;

    const [search, setSearch] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [recentChats, setRecentChats] = useState<ChatPreviewItem[]>([]);
    const [lastTalkedTo, setLastTalkedTo] = useState<
        { id: string; name: string; avatar: string; receiverId: number; isGroup: boolean }[]
    >([]);

    const loadData = useCallback(async () => {
        if (!senderId) {
            setLoading(false);
            return;
        }

        setLoading(true);

        try {
            await messageWebSocket.ensureConnected();

            const totalMessages = await messageWebSocket.waitForMessages(
                'totalMsg',
                () => messageWebSocket.fetchTotalMessages(senderId, senderId)
            );

            const chatMap = new Map<string, ChatPreviewItem>();
            (totalMessages as WsTotalMsg[]).forEach((msg) => {
                const preview = wsTotalMsgToChatPreview(msg, senderId);
                const existing = chatMap.get(preview.id);
                if (
                    !existing ||
                    new Date(msg.sent_time).getTime() >
                        new Date(existing.sentTime ?? 0).getTime()
                ) {
                    chatMap.set(preview.id, preview);
                }
            });

            setRecentChats(
                Array.from(chatMap.values()).sort(
                    (a, b) =>
                        new Date(b.sentTime ?? 0).getTime() -
                        new Date(a.sentTime ?? 0).getTime()
                )
            );

            const contacts = await messageWebSocket.waitForMessages(
                ['driver_list', 'user_list', 'master_list'],
                () => messageWebSocket.fetchUserInfo(senderId, masterId),
                5000
            );

            const contactList = (contacts as WsContact[]).slice(0, 6).map((c) => ({
                id: String(c.id),
                receiverId: c.id,
                name: `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim() || 'Unknown',
                avatar: c.image_url ?? '',
                isGroup: false
            }));
            setLastTalkedTo(contactList);
        } catch (error) {
            console.warn('RecentChats load error', error);
        } finally {
            setLoading(false);
        }
    }, [senderId, masterId]);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [loadData])
    );

    useEffect(() => {
        const unsub = messageWebSocket.on('new_message', () => {
            loadData();
        });
        return unsub;
    }, [loadData]);

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
                colors={['#392969', '#7051CF']}
                style={{ flex: 1 }}
            >
                <HomeHeader />

                <View style={styles.searchRow}>
                    <View style={styles.searchBox}>
                        <Icon
                            name="search"
                            type="Feather"
                            size={moderateScale(16)}
                            color="#A5ACB8"
                        />
                        <TextInput
                            placeholder="Search chats..."
                            placeholderTextColor="#A5ACB8"
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
                                color="#7051CF"
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
                            color="#fff"
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
                                color="#392969"
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
                                color="#392969"
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
        marginHorizontal: moderateScale(15),
        marginBottom: moderateScale(10),
        gap: moderateScale(10)
    },
    searchBox: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: moderateScale(12),
        paddingHorizontal: moderateScale(12),
        height: moderateScale(40),
        gap: moderateScale(8)
    },
    searchInput: {
        flex: 1,
        fontFamily: FONTS.ProductSans.regular,
        fontSize: moderateScale(14),
        color: '#fff',
        padding: 0
    },
    bodyCard: {
        backgroundColor: '#fff',
        paddingTop: moderateScale(20),
        flex: 1,
        borderTopRightRadius: moderateScale(40),
        borderTopLeftRadius: moderateScale(40)
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
        color: '#A5ACB8'
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: moderateScale(20),
        gap: moderateScale(8)
    },
    sectionIcon: {
        height: moderateScale(22),
        width: moderateScale(22),
        resizeMode: 'contain'
    },
    sectionTitle: {
        color: '#392969',
        fontFamily: FONTS.ProductSans.bold,
        fontSize: moderateScale(18)
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
        borderColor: '#7051CF'
    },
    lastTalkedName: {
        marginTop: moderateScale(6),
        fontFamily: FONTS.ProductSans.regular,
        fontSize: moderateScale(11),
        color: '#33404F',
        textAlign: 'center'
    },
    recentTitle: {
        marginHorizontal: moderateScale(20),
        marginBottom: moderateScale(10),
        fontFamily: FONTS.ProductSans.bold,
        fontSize: moderateScale(16),
        color: '#33404F'
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
        color: '#1A1F36',
        marginRight: moderateScale(8)
    },
    chatTime: {
        fontFamily: FONTS.ProductSans.regular,
        fontSize: moderateScale(12),
        color: '#A5ACB8'
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
        color: '#697386'
    },
    unreadBadge: {
        backgroundColor: '#4299E1',
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
        color: '#fff'
    },
    separator: {
        height: 1,
        backgroundColor: '#F0F2F5',
        marginHorizontal: moderateScale(20)
    },
    fab: {
        position: 'absolute',
        bottom: moderateScale(20),
        right: moderateScale(20),
        height: moderateScale(56),
        width: moderateScale(56),
        borderRadius: moderateScale(28),
        backgroundColor: '#4299E1',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 6,
        shadowColor: '#4299E1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6
    },
    modal: {
        margin: 0,
        justifyContent: 'flex-end'
    },
    modalSheet: {
        backgroundColor: '#fff',
        borderTopLeftRadius: moderateScale(20),
        borderTopRightRadius: moderateScale(20),
        paddingBottom: moderateScale(30),
        paddingTop: moderateScale(10)
    },
    modalHandle: {
        width: moderateScale(40),
        height: moderateScale(4),
        backgroundColor: '#E4E8EE',
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
        color: '#1A1F36'
    },
    modalDivider: {
        height: 1,
        backgroundColor: '#F0F2F5',
        marginHorizontal: moderateScale(25)
    }
});
