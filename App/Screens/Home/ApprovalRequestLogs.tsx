import {
    ActivityIndicator,
    FlatList,
    Image,
    Pressable,
    StyleSheet,
    ToastAndroid,
    View
} from 'react-native';
import React, { useEffect, useRef, useState } from 'react';
import { useRoute } from '@react-navigation/native';
import { CheckBox, Container, Icon, Text } from 'react-native-basic-elements';
import AppStatusBar from '../../Components/AppStatusBar';
import LinearGradient from 'react-native-linear-gradient';
import HomeHeader from '../../Components/Headers/HomeHeader';
import { moderateScale } from '../../Constants/PixelRatio';
import { FONTS } from '../../Constants/Fonts';
import moment from 'moment';
import DashboardService from '../../Services/Dashboard';
import Modal from 'react-native-modal';
import SignatureScreen, { SignatureViewRef } from 'react-native-signature-canvas';
import AuthService from '../../Services/Auth';

const ApprovalRequestLogs = () => {
    const route = useRoute<any>();
    const ref = useRef<SignatureViewRef>(null);
    const [allApprovalRequests, setAllApprovalRequests] = useState<Array<any>>([]);
    const [selectedLogId, setSelectedLogId] = useState<number[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        getApprovalRequests();
    }, []);

    const getApprovalRequests = () => {
        DashboardService.getApprovalRequestIndex()
            .then((res) => {
                if (res.status.toLowerCase() === 'success') {
                    setAllApprovalRequests(res.data[route.params?.type]);
                }
            })
            .finally(() => {
                setLoading(false);
            });
    };

    const approveSelectedRequests = (status: number) => {
        DashboardService.changeApprovalRequestStatus(route.params?.type, status, {
            log_id: selectedLogId.join(',')
        })
            .then((res) => {
                if (res.status.toLowerCase() === 'success') {
                    ToastAndroid.show(`${status === 1 ? 'Approved' : 'Rejected'} successfully`, ToastAndroid.SHORT);
                    getApprovalRequests();
                    setSelectedLogId([]);
                }
            })
            .finally(() => {
                setLoading(false);
            });
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
                    color={'#392969'}
                />
            </View>
        );
    }

    return (
        <Container>
            <AppStatusBar />

            <LinearGradient
                colors={['#392969', '#7051CF']}
                style={{ flex: 1 }}
            >
                <HomeHeader showBack />

                <View style={styles.bodyCard}>
                    <View style={styles.header}>
                        <Text style={styles.headerText}>{route.params?.name}</Text>
                    </View>

                    {allApprovalRequests.length > 0 ? (
                        <FlatList
                            data={allApprovalRequests}
                            keyExtractor={(item, index) => index.toString()}
                            renderItem={({ item }) => {
                                return (
                                    <Pressable
                                        style={{
                                            marginHorizontal: moderateScale(15),
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            // marginBottom: moderateScale(10),
                                            // marginTop: moderateScale(15),
                                            height: moderateScale(55)
                                        }}
                                        onPress={() => {
                                            if (selectedLogId.includes(item.id)) {
                                                setSelectedLogId(
                                                    selectedLogId.filter(
                                                        (id) => id !== item.id
                                                    )
                                                );
                                            } else {
                                                setSelectedLogId([
                                                    ...selectedLogId,
                                                    item.id
                                                ]);
                                            }
                                        }}
                                    >
                                        <CheckBox
                                            size={moderateScale(18)}
                                            checked={selectedLogId.includes(item.id)}
                                            containerStyle={{
                                                borderWidth: 0.8
                                            }}
                                            onChange={() => {
                                                if (selectedLogId.includes(item.id)) {
                                                    setSelectedLogId(
                                                        selectedLogId.filter(
                                                            (id) => id !== item.id
                                                        )
                                                    );
                                                } else {
                                                    setSelectedLogId([
                                                        ...selectedLogId,
                                                        item.id
                                                    ]);
                                                }
                                            }}
                                        />
                                        <View
                                            style={{
                                                flex: 1,
                                                marginLeft: moderateScale(15)
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    color: '#33404F',
                                                    fontFamily: FONTS.ProductSans.regular,
                                                    textTransform: 'uppercase',
                                                    fontSize: moderateScale(15)
                                                }}
                                            >
                                                <Text
                                                    style={{
                                                        fontFamily: FONTS.ProductSans.bold
                                                    }}
                                                >
                                                    {moment(item.start_log_time).format(
                                                        'dddd'
                                                    )}{' '}
                                                </Text>
                                                {moment(item.start_log_time).format(
                                                    'YYYY-MM-DD'
                                                )}
                                            </Text>
                                        </View>
                                        <Icon
                                            name="chevron-right"
                                            type="Feather"
                                            size={moderateScale(22)}
                                        />
                                    </Pressable>
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
                    ) : (
                        <View
                            style={{
                                justifyContent: 'center',
                                alignItems: 'center',
                                flex: 1
                            }}
                        >
                            <Text
                                style={{
                                    color: '#33404F',
                                    fontFamily: FONTS.ProductSans.regular,
                                    fontSize: moderateScale(13)
                                }}
                            >
                                No Data Found
                            </Text>
                        </View>
                    )}
                </View>

                {/* Floating Action Buttons */}
                {selectedLogId.length > 0 && (
                    <View style={styles.floatingButtonContainer}>
                        <Pressable
                            style={[styles.floatingButton, styles.approveButton]}
                            onPress={() => {
                                approveSelectedRequests(1);
                            }}
                        >
                            <Text style={styles.floatingButtonText}>✓</Text>
                        </Pressable>
                        <Pressable
                            style={[styles.floatingButton, styles.rejectButton]}
                            onPress={() => {
                                approveSelectedRequests(2);
                            }}
                        >
                            <Text style={styles.floatingButtonText}>✕</Text>
                        </Pressable>
                    </View>
                )}
            </LinearGradient>
        </Container>
    );
};

export default ApprovalRequestLogs;

const styles = StyleSheet.create({
    bodyCard: {
        backgroundColor: '#fff',
        paddingTop: moderateScale(20),
        flex: 1,
        zIndex: 1,
        borderTopRightRadius: moderateScale(40),
        borderTopLeftRadius: moderateScale(40)
    },
    header: {
        height: moderateScale(35),
        marginHorizontal: moderateScale(15)
    },
    headerText: {
        color: '#33404F',
        fontFamily: FONTS.ProductSans.regular,
        fontSize: moderateScale(17)
    },
    floatingButtonContainer: {
        position: 'absolute',
        bottom: moderateScale(10),
        right: moderateScale(15),
        flexDirection: 'row',
        gap: moderateScale(15),
        zIndex: 10
    },
    floatingButton: {
        width: moderateScale(40),
        height: moderateScale(40),
        borderRadius: moderateScale(8),
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84
    },
    approveButton: {
        backgroundColor: '#4CAF50'
    },
    rejectButton: {
        backgroundColor: '#F44336'
    },
    floatingButtonText: {
        color: '#fff',
        fontSize: moderateScale(16),
        fontWeight: 'bold'
    }
});
