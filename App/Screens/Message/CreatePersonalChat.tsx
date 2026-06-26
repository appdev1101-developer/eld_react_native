import {
    ActivityIndicator,
    FlatList,
    Image,
    Pressable,
    StyleSheet,
    TextInput,
    View
} from 'react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { Container, Icon, Text } from 'react-native-basic-elements';
import AppStatusBar from '../../Components/AppStatusBar';
import { moderateScale } from '../../Constants/PixelRatio';
import { FONTS } from '../../Constants/Fonts';
import BackHeader from '../../Components/Headers/BackHeader';
import { getAvatarSource } from '../../Constants/MessageMockData';
import NavigationService from '../../Services/Navigation';
import { useSelector } from 'react-redux';
import { RootState } from '../../Redux/store';
import messageWebSocket, { wsContactToDisplay } from '../../Utils/MessageWebSocket';
import { WsContact } from '../../Model/Message';

type ContactItem = {
    id: string;
    name: string;
    avatar: string;
    receiverId: number;
};

const CreatePersonalChat = () => {
    const { userData } = useSelector((state: RootState) => state.User);
    const senderId = userData?.id ?? 0;
    const masterId = userData?.master_id ?? senderId;

    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState<number | null>(null);
    const [contacts, setContacts] = useState<ContactItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!senderId) {
            setLoading(false);
            return;
        }

        const loadContacts = async () => {
            try {
                await messageWebSocket.ensureConnected();
                const results = await messageWebSocket.waitForMessages(
                    ['driver_list', 'user_list', 'master_list'],
                    () => messageWebSocket.fetchUserInfo(senderId, masterId)
                );

                const merged = new Map<number, ContactItem>();
                (results as WsContact[]).forEach((item) => {
                    if (item.id === senderId) return;
                    const display = wsContactToDisplay(item);
                    merged.set(item.id, {
                        id: display.id,
                        name: display.name,
                        avatar: display.avatar,
                        receiverId: item.id
                    });
                });

                setContacts(Array.from(merged.values()));
            } catch (error) {
                console.warn('CreatePersonalChat load error', error);
            } finally {
                setLoading(false);
            }
        };

        loadContacts();
    }, [senderId, masterId]);

    const filteredContacts = useMemo(
        () =>
            contacts.filter((c) =>
                c.name.toLowerCase().includes(search.toLowerCase())
            ),
        [contacts, search]
    );

    const handleCreate = () => {
        if (!selected) return;
        const contact = contacts.find((c) => c.receiverId === selected);
        NavigationService.navigate('ChatThread', {
            receiverId: selected,
            chatName: contact?.name ?? 'New Chat',
            isGroup: false,
            avatar: contact?.avatar
        });
    };

    return (
        <Container style={styles.container}>
            <AppStatusBar />
            <View style={styles.topBar}>
                <BackHeader title="Create a new Chat" />
                <Pressable
                    style={[
                        styles.createBtn,
                        !selected && styles.createBtnDisabled
                    ]}
                    onPress={handleCreate}
                    disabled={!selected}
                >
                    <Text style={styles.createBtnText}>Create</Text>
                </Pressable>
            </View>

            <View style={styles.searchBox}>
                <Icon
                    name="search"
                    type="Feather"
                    size={moderateScale(16)}
                    color="#A5ACB8"
                />
                <TextInput
                    placeholder="Search contacts..."
                    placeholderTextColor="#A5ACB8"
                    value={search}
                    onChangeText={setSearch}
                    style={styles.searchInput}
                />
            </View>

            <Text style={styles.sectionLabel}>Select a contact</Text>

            {loading ? (
                <View style={styles.loadingWrap}>
                    <ActivityIndicator
                        size="large"
                        color="#7051CF"
                    />
                </View>
            ) : (
                <FlatList
                    data={filteredContacts}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => {
                        const isSelected = selected === item.receiverId;
                        return (
                            <Pressable
                                style={styles.contactRow}
                                onPress={() => setSelected(item.receiverId)}
                            >
                                <Image
                                    source={getAvatarSource(item.avatar)}
                                    style={styles.avatar}
                                />
                                <Text style={styles.contactName}>{item.name}</Text>
                                <View
                                    style={[
                                        styles.checkbox,
                                        isSelected && styles.checkboxSelected
                                    ]}
                                >
                                    {isSelected ? (
                                        <Icon
                                            name="check"
                                            type="Feather"
                                            size={moderateScale(14)}
                                            color="#fff"
                                        />
                                    ) : null}
                                </View>
                            </Pressable>
                        );
                    }}
                    ItemSeparatorComponent={() => (
                        <View style={styles.separator} />
                    )}
                    ListEmptyComponent={
                        <View style={styles.emptyWrap}>
                            <Text style={styles.emptyText}>No contacts found</Text>
                        </View>
                    }
                />
            )}
        </Container>
    );
};

export default CreatePersonalChat;

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        flex: 1
    },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingRight: moderateScale(15)
    },
    createBtn: {
        backgroundColor: '#7051CF',
        borderRadius: moderateScale(8),
        paddingHorizontal: moderateScale(16),
        paddingVertical: moderateScale(8)
    },
    createBtnDisabled: {
        opacity: 0.4
    },
    createBtnText: {
        fontFamily: FONTS.ProductSans.bold,
        fontSize: moderateScale(14),
        color: '#fff'
    },
    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F7F8FA',
        borderRadius: moderateScale(12),
        marginHorizontal: moderateScale(20),
        marginVertical: moderateScale(15),
        paddingHorizontal: moderateScale(12),
        height: moderateScale(42),
        gap: moderateScale(8)
    },
    searchInput: {
        flex: 1,
        fontFamily: FONTS.ProductSans.regular,
        fontSize: moderateScale(14),
        color: '#1A1F36',
        padding: 0
    },
    sectionLabel: {
        marginHorizontal: moderateScale(20),
        marginBottom: moderateScale(10),
        fontFamily: FONTS.ProductSans.bold,
        fontSize: moderateScale(14),
        color: '#33404F'
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
    contactRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: moderateScale(20),
        paddingVertical: moderateScale(12)
    },
    avatar: {
        height: moderateScale(44),
        width: moderateScale(44),
        borderRadius: moderateScale(22)
    },
    contactName: {
        flex: 1,
        marginLeft: moderateScale(12),
        fontFamily: FONTS.ProductSans.regular,
        fontSize: moderateScale(15),
        color: '#1A1F36'
    },
    checkbox: {
        height: moderateScale(24),
        width: moderateScale(24),
        borderRadius: moderateScale(6),
        borderWidth: 2,
        borderColor: '#E4E8EE',
        justifyContent: 'center',
        alignItems: 'center'
    },
    checkboxSelected: {
        backgroundColor: '#7051CF',
        borderColor: '#7051CF'
    },
    separator: {
        height: 1,
        backgroundColor: '#F0F2F5',
        marginHorizontal: moderateScale(20)
    }
});
