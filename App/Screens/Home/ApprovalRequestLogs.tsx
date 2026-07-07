import {
    ActivityIndicator,
    FlatList,
    Image,
    Pressable,
    StyleSheet,
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
import { useDispatch, useSelector } from 'react-redux';
import { dashboardApi } from '../../core/api/services/dashboardApi';
import { isSuccess } from '../../core/api/types/common';
import { ApprovalRequestType } from '../../core/api/endpoints';
import { RootState } from '../../Redux/store';
import { setDashboardBundle } from '../../Redux/reducer/Dashboard';
import { getHomeCache, setHomeCache } from '../../core/cache/homeDataCache';
import Modal from 'react-native-modal';
import SignatureScreen, { SignatureViewRef } from 'react-native-signature-canvas';
import { requireOnline } from '../../core/network/requireOnline';
import { showError, showToast } from '../../Utils/toast';
import { getApiErrorMessage } from '../../Utils/apiErrorMessage';
import { GRADIENT_HEADER } from '../../Constants/Theme';
const ApprovalRequestLogs = () => {
    const route = useRoute<any>();
    const dispatch = useDispatch();
    const approvals = useSelector((state: RootState) => state.Dashboard.approvals);
    const ref = useRef<SignatureViewRef>(null);
    const requestType = route.params?.type as ApprovalRequestType;
    const allApprovalRequests = (approvals[requestType] as Array<any>) ?? [];
    const [selectedLogId, setSelectedLogId] = useState<number[]>([]);
    const [loading, setLoading] = useState<boolean>(
        allApprovalRequests.length === 0
    );

    const refreshApprovals = async () => {
        setLoading(true);
        try {
            const result = await dashboardApi.getApprovalRequests();
            if (isSuccess(result)) {
                dispatch(setDashboardBundle({ approvals: result.data }));
                const cached = getHomeCache();
                if (cached) {
                    setHomeCache({ ...cached, approvals: result.data });
                }
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (allApprovalRequests.length === 0) {
            refreshApprovals();
        }
    }, []);

    const approveSelectedRequests = (status: number) => {
        if (selectedLogId.length === 0) {
            showError('Please select at least one request');
            return;
        }

        if (!requireOnline()) {
            return;
        }

        setLoading(true);
        dashboardApi
            .markApprovalStatus(requestType, status, {
                log_id: selectedLogId.join(',')
            })
            .then((res) => {
                if (isSuccess(res)) {
                    showToast(
                        `${status === 1 ? 'Approved' : 'Rejected'} successfully`
                    );
                    refreshApprovals();
                    setSelectedLogId([]);
                } else {
                    showError(res.message ?? 'Failed to update request');
                }
            })
            .catch((error) => {
                showError(getApiErrorMessage(error, 'Failed to update request'));
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
                colors={GRADIENT_HEADER}
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
