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
import React, { useEffect, useMemo, useState } from 'react';
import { Container, Icon, Text } from 'react-native-basic-elements';
import AppStatusBar from '../../Components/AppStatusBar';
import { moderateScale } from '../../Constants/PixelRatio';
import { FONTS } from '../../Constants/Fonts';
import BackHeader from '../../Components/Headers/BackHeader';
import { SUGGESTION_CHIPS, getAvatarSource } from '../../Constants/MessageMockData';
import NavigationService from '../../Services/Navigation';
import { useSelector } from 'react-redux';
import { RootState } from '../../Redux/store';
import messageWebSocket, { wsContactToDisplay } from '../../Utils/MessageWebSocket';
import { WsContact, WsGroup } from '../../Model/Message';

type ContactItem = {
    id: string;
    name: string;
    avatar: string;
    receiverId: number;
};

const CreateGroupChat = () => {
    const { userData } = useSelector((state: RootState) => state.User);
    const senderId = userData?.id ?? 0;
    const masterId = userData?.master_id ?? senderId;
    const masterCompanyId = userData?.master_company_id ?? masterId;

    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState<number[]>([]);
    const [activeChip, setActiveChip] = useState<string | null>(null);
    const [contacts, setContacts] = useState<ContactItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [groupName, setGroupName] = useState('');

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
                console.warn('CreateGroupChat load error', error);
            } finally {
                setLoading(false);
            }
        };

        loadContacts();
    }, [senderId, masterId]);

    const filteredContacts = useMemo(() => {
        let list = contacts;
        if (search.trim()) {
            list = list.filter((c) =>
                c.name.toLowerCase().includes(search.toLowerCase())
            );
        }
        return list;
    }, [contacts, search]);

    const toggleContact = (id: number) => {
        setSelected((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    const handleCreate = async () => {
        if (selected.length < 2 || !senderId || creating) return;

        const names = selected
            .map((id) => contacts.find((c) => c.receiverId === id)?.name)
            .filter(Boolean);
        const resolvedGroupName =
            groupName.trim() ||
            activeChip ||
            names.slice(0, 2).join(', ') ||
            'New Group';

        setCreating(true);

        try {
            await messageWebSocket.ensureConnected();

            const groupResponse = await messageWebSocket.waitForMessages(
                'group_list',
                () =>
                    messageWebSocket.createGroup({
                        senderId,
                        groupName: resolvedGroupName,
                        masterId,
                        masterCompanyId,
                        ids: senderId,
                        userSelected: selected
                    }),
                5000
            );

            const created = groupResponse[0] as WsGroup & { group_id?: number };
            const groupId = created?.group_id ?? created?.id;

            if (groupId) {
                NavigationService.navigate('ChatThread', {
                    receiverId: groupId,
                    chatName: resolvedGroupName,
                    isGroup: true
                });
            }
        } catch (error) {
            console.warn('Create group failed', error);
        } finally {
            setCreating(false);
        }
    };

    return (
        <Container style={styles.container}>
            <AppStatusBar />
            <View style={styles.topBar}>
                <BackHeader title="Create a new Group" />
                <Pressable
                    style={[
                        styles.createBtn,
                        (selected.length < 2 || creating) && styles.createBtnDisabled
                    ]}
                    onPress={handleCreate}
                    disabled={selected.length < 2 || creating}
                >
                    <Text style={styles.createBtnText}>
                        {creating ? 'Creating...' : 'Create'}
                    </Text>
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
                    placeholder="Group name (optional)"
                    placeholderTextColor="#A5ACB8"
                    value={groupName}
                    onChangeText={setGroupName}
                    style={styles.searchInput}
                />
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

            <Text style={styles.sectionLabel}>Suggestions</Text>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipRow}
            >
                {SUGGESTION_CHIPS.map((chip) => (
                    <Pressable
                        key={chip}
                        style={[
                            styles.chip,
                            activeChip === chip && styles.chipActive
                        ]}
                        onPress={() =>
                            setActiveChip(activeChip === chip ? null : chip)
                        }
                    >
                        <Text
                            style={[
                                styles.chipText,
                                activeChip === chip && styles.chipTextActive
                            ]}
                        >
                            {chip}
                        </Text>
                    </Pressable>
                ))}
            </ScrollView>

            <Text style={styles.sectionLabel}>Select contacts</Text>

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
                        const isSelected = selected.includes(item.receiverId);
                        return (
                            <Pressable
                                style={styles.contactRow}
                                onPress={() => toggleContact(item.receiverId)}
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
                />
            )}
        </Container>
    );
};

export default CreateGroupChat;

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
        marginTop: moderateScale(10),
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
        marginTop: moderateScale(15),
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
    chipRow: {
        paddingHorizontal: moderateScale(20),
        gap: moderateScale(8),
        marginBottom: moderateScale(5)
    },
    chip: {
        borderWidth: 1,
        borderColor: '#E4E8EE',
        borderRadius: moderateScale(20),
        paddingHorizontal: moderateScale(16),
        paddingVertical: moderateScale(8),
        backgroundColor: '#F7F8FA'
    },
    chipActive: {
        backgroundColor: '#7051CF',
        borderColor: '#7051CF'
    },
    chipText: {
        fontFamily: FONTS.ProductSans.regular,
        fontSize: moderateScale(13),
        color: '#697386'
    },
    chipTextActive: {
        color: '#fff'
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
