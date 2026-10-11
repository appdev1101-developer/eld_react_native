import {
    ActivityIndicator,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    SectionList,
    StyleSheet,
    TextInput,
    TextStyle,
    View
} from 'react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSafeAreaInsets,SafeAreaView } from 'react-native-safe-area-context';
import { Container, Icon, Text } from 'react-native-basic-elements';
import AppStatusBar from '../../Components/AppStatusBar';
import LinearGradient from 'react-native-linear-gradient';
import { moderateScale } from '../../Constants/PixelRatio';
import { FONTS } from '../../Constants/Fonts';
import NavigationService from '../../Services/Navigation';
import { RouteProp, useRoute } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { RootState } from '../../Redux/store';
import { ChatMessage, getAvatarSource } from '../../Constants/MessageMockData';
import { ChatThreadParams, WsChatMessage } from '../../Model/Message';
import messageWebSocket, { wsMessageToChatMessage } from '../../Utils/MessageWebSocket';
import moment from 'moment';
import { GRADIENT_HEADER } from '../../Constants/Theme';
import Util from '../../Utils/util';
import { messagingApi } from '../../core/api/services/messagingApi';
import { isSuccess } from '../../core/api/types/common';

type ChatThreadRouteParams = {
    ChatThread: ChatThreadParams;
};

const ChatThread = () => {
    const insets = useSafeAreaInsets();
    const route = useRoute<RouteProp<ChatThreadRouteParams, 'ChatThread'>>();
    const { receiverId, chatName: paramName, isGroup = false, avatar } = route.params;
    const { userData } = useSelector((state: RootState) => state.User);

    const senderId = userData?.id ?? 0;
    const masterId = userData?.master_id ?? senderId;
    const masterCompanyId = userData?.master_company_id ?? masterId;

    const chatName = paramName ?? 'Chat';
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(true);
    const listRef = useRef<SectionList>(null);
    
    const appendMessage = useCallback(
        (msg: WsChatMessage) => {
            const chatMsg = wsMessageToChatMessage(msg, senderId);
            setMessages((prev) => {
                if (prev.some((item) => item.id === chatMsg.id)) {
                    return prev;
                }
                return [...prev, chatMsg];
            });
        },
        [senderId]
    );

    const chatSections = useMemo(() => {
    const chatSectionGroup: { [key: string]: ChatMessage[] } = {};
    messages.forEach((msg) => {
        // Fallback to current time if sent_time is missing
        const title = Util.getSectionTitle(msg.time || new Date().toISOString()); 
        
        if (!chatSectionGroup[title]) {
        chatSectionGroup[title] = [];
        }
        chatSectionGroup[title].push(msg);
    });

    return Object.keys(chatSectionGroup).map((title) => ({
        title,
        data: chatSectionGroup[title],
    }));
    }, [messages]);

    useEffect(() => {
        if (!senderId || !receiverId) {
            setLoading(false);
            return;
        }

        let mounted = true;
        console.log("<<<Load chat ()>>>");
        const loadChat = async () => {
            try {
                await messageWebSocket.ensureConnected();
                messageWebSocket.getPreviousMessages(receiverId, isGroup);
                messageWebSocket.markAsRead({
                    senderId,
                    receiverId,
                    isGroup,
                    userId: senderId
                });
            } catch (error) {
                console.warn('ChatThread load error', error);
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        const unsubPrevious = messageWebSocket.on('previous_message', (payload) => {
            if (!mounted) return;
            appendMessage(payload as WsChatMessage);
        });

        const unsubNew = messageWebSocket.on('new_message', (payload) => {
            if (!mounted) return;
            const msg = payload as WsChatMessage;
            const msgReceiverId = msg.reciever_id ?? msg.receiver_id;
            const isRelevant = isGroup
                ? msg.type === 1 && msgReceiverId === receiverId
                : msg.type === 0 &&
                  ((msg.sender_id === senderId && msgReceiverId === receiverId) ||
                      (msg.sender_id === receiverId && msgReceiverId === senderId));

            if (isRelevant) {
                appendMessage(msg);
            }
        });

        loadChat();

        return () => {
            mounted = false;
            unsubPrevious();
            unsubNew();
        };
    }, [senderId, receiverId, isGroup, appendMessage]);

    useEffect(() => {
        // if (messages.length > 0) {
        //     listRef.current?.scrollToEnd({ animated: true });
        // }
        if (messages.length > 0) {
            // // 1. Get the index of the last section
            // const lastSectionIndex = chatSectionGroup.l - 1;
            
            // // 2. Get the index of the last item inside that section
            // const lastItemIndex = sectionsData[lastSectionIndex].data.length - 1;

            listRef.current?.getScrollResponder()?.scrollToEnd({animated: true});
        }
    }, [messages.length]);

    const handleSelectImage = async () => {
        try
        {
            const asset = await Util.selectImageFromStorage();

            if (!asset) {
                return;
            }
            console.log('Selected image:', asset);
            const uploadImageResponse = await messagingApi.uploadChatImage(asset);
            if (isSuccess(uploadImageResponse)) 
            {
                await sendMessage(uploadImageResponse.data.image_url);
            }
        }
        catch(error)
        {
            console.log('error '+error);
        }
    };

    const sendMessage = async (imageUrl?: string) => {
        const trimmed = inputText.trim();
        if ((!trimmed && !imageUrl) || !senderId || !receiverId) return;

        // const optimistic: ChatMessage = {
        //     id: `local-${Date.now()}`,
        //     senderId: String(senderId),
        //     text: trimmed,
        //     time: new Date().toLocaleDateString(),
        //     isMine: true
        // };

        // console.log("New message : "+JSON.stringify(optimistic));
        // console.log("senderId : "+senderId+" - "+receiverId+" - "+masterId+" - "+masterCompanyId);

        //setMessages((prev) => [...prev, optimistic]);
        setInputText('');

        try {
            await messageWebSocket.ensureConnected();
            if (isGroup) {
                messageWebSocket.sendGroupMessage({
                    senderId,
                    groupId: receiverId,
                    content: trimmed,
                    masterId,
                    imageUrl,
                    masterCompanyId
                });
            } else {
                messageWebSocket.sendPrivateMessage({
                    senderId,
                    receiverId,
                    content: trimmed,
                    masterId,
                    imageUrl,
                    masterCompanyId
                });
            }
        } catch (error) {
            console.warn('Send message failed', error);
            //setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
            setInputText(trimmed);
        }
    };

    const openInfo = () => {
        if (isGroup) {
            NavigationService.navigate('GroupInfo', {
                chatId: `group-${receiverId}`,
                groupName: chatName
            });
        }
    };

    const renderMessage = ({ item }: { item: ChatMessage }) => (
        <View>
            {/* {item.dateLabel ? (
                <View style={styles.dateSeparator}>
                    <Text style={styles.dateText}>{item.dateLabel}</Text>
                </View>
            ) : null} */}
            <View
                style={[
                    styles.messageRow,
                    item.isMine ? styles.messageRowMine : styles.messageRowOther
                ]}
            >
                {!item.isMine ? (
                    <Image
                        source={getAvatarSource(avatar)}
                        style={styles.messageAvatar}
                    />
                ) : null}
                <View
                    style={[
                        styles.bubble,
                        item.isMine ? styles.bubbleMine : styles.bubbleOther
                    ]}
                >
                    {!item.isMine && isGroup && item.senderName ? (
                        <Text style={styles.senderName}>{item.senderName}</Text>
                    ) : null}
                    {item.image ? (
                        <Image
                            source={{ uri: item.image }}
                            style={styles.messageImage}
                        />
                    ) : null}

                    {item.text ? (
                        <Text
                            style={{
                                ...styles.messageText,
                                ...(item.isMine ? styles.messageTextMine
                                    : styles.messageTextOther)
                            }}
                        >
                            {item.text}
                        </Text>
                    ) : null}
                    <Text
                        style={{
                            ...styles.messageTime,
                            ...(item.isMine ? styles.messageTimeMine
                                : styles.messageTimeOther)
                        }}
                    >
                        {Util.getSectionItemTime(item.time)}
                    </Text>
                </View>
            </View>
        </View>
    );

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
                    <Pressable
                        style={styles.headerCenter}
                        onPress={openInfo}
                    >
                        <Image
                            source={getAvatarSource(avatar)}
                            style={styles.headerAvatar}
                        />
                        <Text
                            style={styles.headerTitle}
                            numberOfLines={1}
                        >
                            {chatName}
                        </Text>
                    </Pressable>
                    <View style={styles.headerActions}>
                        <Pressable
                            onPress={openInfo}
                            hitSlop={8}
                        >
                            <Icon
                                name="info"
                                type="Feather"
                                size={moderateScale(20)}
                                color="#fff"
                            />
                        </Pressable>
                    </View>
                </View>
                <KeyboardAvoidingView
                    style={styles.bodyCard}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    keyboardVerticalOffset={moderateScale(10)}
                >
                    {loading ? (
                        <View style={styles.loadingWrap}>
                            <ActivityIndicator
                                size="large"
                                color="#7051CF"
                            />
                        </View>
                    ) : (
                        // <FlatList
                        //     ref={listRef}
                        //     data={messages}
                        //     keyExtractor={(item) => item.id}
                        //     renderItem={renderMessage}
                        //     contentContainerStyle={styles.messageList}
                        //     showsVerticalScrollIndicator={false}
                        //     ListEmptyComponent={
                        //         <View style={styles.emptyWrap}>
                        //             <Text style={styles.emptyText}>
                        //                 No messages yet. Say hello!
                        //             </Text>
                        //         </View>
                        //     }
                        // />
                        <SectionList
                            ref={listRef}
                            sections={chatSections}
                            keyExtractor={(item) => item.id}
                            renderItem={renderMessage}
                            renderSectionHeader={({ section: { title } }) => (
                            <View style={styles.dateSeparator}>
                                        <Text style={styles.dateText}>{title}</Text>
                                    </View>
                            )}
                            contentContainerStyle={styles.messageList}
                            showsVerticalScrollIndicator={false}
                            ListEmptyComponent={
                                <View style={styles.emptyWrap}>
                                    <Text style={styles.emptyText}>
                                        No messages yet. Say hello!
                                    </Text>
                                </View>
                            }
                        />
                    )}

                    <View style={styles.inputBar}>
                        <Pressable style={styles.attachBtn}
                            onPress={handleSelectImage}>
                            <Icon
                                name="plus"
                                type="Feather"
                                size={moderateScale(20)}
                                color="#697386"
                            />
                        </Pressable>
                        <TextInput
                            style={styles.textInput}
                            placeholder="Type a message..."
                            placeholderTextColor="#A5ACB8"
                            value={inputText}
                            onChangeText={setInputText}
                            multiline
                        />
                        {inputText.trim() ? (
                            <Pressable
                                style={styles.sendBtn}
                                onPress={() => sendMessage()}
                            >
                                <Icon
                                    name="send"
                                    type="Feather"
                                    size={moderateScale(18)}
                                    color="#fff"
                                />
                            </Pressable>
                        ) : null}
                    </View>
                </KeyboardAvoidingView>
            </LinearGradient>
        </Container>
        
    );
};

export default ChatThread;

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: moderateScale(10),
        marginBottom: moderateScale(10),
        gap: moderateScale(8)
    },
    headerCenter: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: moderateScale(10)
    },
    headerAvatar: {
        height: moderateScale(36),
        width: moderateScale(36),
        borderRadius: moderateScale(18)
    },
    headerTitle: {
        flex: 1,
        fontFamily: FONTS.ProductSans.bold,
        fontSize: moderateScale(16),
        color: '#fff'
    },
    headerActions: {
        flexDirection: 'row',
        gap: moderateScale(14)
    },
    bodyCard: {
        flex: 1,
        backgroundColor: '#F7F8FA',
        borderTopLeftRadius: moderateScale(30),
        borderTopRightRadius: moderateScale(30)
    },
    loadingWrap: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    emptyWrap: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: moderateScale(60)
    },
    emptyText: {
        fontFamily: FONTS.ProductSans.regular,
        fontSize: moderateScale(14),
        color: '#A5ACB8'
    },
    messageList: {
        padding: moderateScale(15),
        paddingBottom: moderateScale(10),
        flexGrow: 1
    },
    dateSeparator: {
        alignItems: 'center',
        marginVertical: moderateScale(12)
    },
    dateText: {
        fontFamily: FONTS.ProductSans.regular,
        fontSize: moderateScale(12),
        color: '#A5ACB8',
        backgroundColor: '#E4E8EE',
        paddingHorizontal: moderateScale(12),
        paddingVertical: moderateScale(4),
        borderRadius: moderateScale(10)
    },
    messageRow: {
        flexDirection: 'row',
        marginBottom: moderateScale(10),
        alignItems: 'flex-end'
    },
    messageRowMine: {
        justifyContent: 'flex-end'
    },
    messageRowOther: {
        justifyContent: 'flex-start'
    },
    messageAvatar: {
        height: moderateScale(28),
        width: moderateScale(28),
        borderRadius: moderateScale(14),
        marginRight: moderateScale(8)
    },
    bubble: {
        maxWidth: '75%',
        borderRadius: moderateScale(16),
        padding: moderateScale(10)
    },
    bubbleMine: {
        backgroundColor: '#4299E1',
        borderBottomRightRadius: moderateScale(4)
    },
    bubbleOther: {
        backgroundColor: '#fff',
        borderBottomLeftRadius: moderateScale(4),
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2
    },
    senderName: {
        fontFamily: FONTS.ProductSans.bold,
        fontSize: moderateScale(11),
        color: '#7051CF',
        marginBottom: moderateScale(4)
    },
    messageImage: {
        width: moderateScale(200),
        height: moderateScale(130),
        borderRadius: moderateScale(10),
        marginBottom: moderateScale(6)
    },
    messageText: {
        fontFamily: FONTS.ProductSans.regular,
        fontSize: moderateScale(14) as number,
        lineHeight: moderateScale(20) as number
    },
    messageTextMine: {
        color: '#fff'
    },
    messageTextOther: {
        color: '#1A1F36'
    },
    messageTime: {
        fontFamily: FONTS.ProductSans.regular,
        fontSize: moderateScale(10),
        marginTop: moderateScale(4),
        alignSelf: 'flex-end'
    },
    messageTimeMine: {
        color: 'rgba(255,255,255,0.7)'
    },
    messageTimeOther: {
        color: '#A5ACB8'
    },
    inputBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        marginHorizontal: moderateScale(10),
        marginBottom: moderateScale(10),
        borderRadius: moderateScale(25),
        paddingHorizontal: moderateScale(12),
        paddingVertical: moderateScale(6),
        gap: moderateScale(8),
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4
    },
    attachBtn: {
        height: moderateScale(36),
        width: moderateScale(36),
        borderRadius: moderateScale(18),
        backgroundColor: '#F0F2F5',
        justifyContent: 'center',
        alignItems: 'center'
    },
    textInput: {
        flex: 1,
        fontFamily: FONTS.ProductSans.regular,
        fontSize: moderateScale(14),
        color: '#1A1F36',
        maxHeight: moderateScale(80),
        paddingVertical: moderateScale(6)
    },
    micBtn: {
        height: moderateScale(36),
        width: moderateScale(36),
        justifyContent: 'center',
        alignItems: 'center'
    },
    sendBtn: {
        height: moderateScale(36),
        width: moderateScale(36),
        borderRadius: moderateScale(18),
        backgroundColor: '#4299E1',
        justifyContent: 'center',
        alignItems: 'center'
    }
});
