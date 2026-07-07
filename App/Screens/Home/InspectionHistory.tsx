import {
    ActivityIndicator,
    FlatList,
    Pressable,
    StyleSheet,
    View
} from 'react-native';
import React, { useEffect, useState } from 'react';
import { Container, Icon, Text } from 'react-native-basic-elements';
import AppStatusBar from '../../Components/AppStatusBar';
import LinearGradient from 'react-native-linear-gradient';
import HomeHeader from '../../Components/Headers/HomeHeader';
import { moderateScale } from '../../Constants/PixelRatio';
import { FONTS } from '../../Constants/Fonts';
import moment from 'moment';
import { inspectionApi } from '../../core/api/services/inspectionApi';
import { isLegacySuccess } from '../../core/api/types/common';
import NavigationService from '../../Services/Navigation';
import { GRADIENT_HEADER } from '../../Constants/Theme';

const InspectionHistory = () => {
    const [inspections, setInspections] = useState<Array<any>>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        getInspectionHistory();
    }, []);

    const getInspectionHistory = () => {
        inspectionApi
            .getHistoryLegacy()
            .then((res) => {
                if (isLegacySuccess(res)) {
                    const sorted = [...((res.data as Array<any>) ?? [])].sort(
                        (a, b) =>
                            moment(b.inspection_date_time).valueOf() -
                            moment(a.inspection_date_time).valueOf()
                    );
                    setInspections(sorted);
                }
            })
            .finally(() => {
                setLoading(false);
            });
    };

    const getDefectCount = (inspection: any) =>
        inspection.inspection_log?.filter((log: any) => log.is_ok === 2).length ?? 0;

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
                        <Text style={styles.headerText}>Inspection History</Text>
                    </View>

                    {inspections.length > 0 ? (
                        <FlatList
                            data={inspections}
                            keyExtractor={(item) => item.id.toString()}
                            renderItem={({ item }) => {
                                const defectCount = getDefectCount(item);

                                return (
                                    <Pressable
                                        style={styles.listItem}
                                        onPress={() =>
                                            NavigationService.navigate(
                                                'InspectionHistoryDetail',
                                                { inspection: item }
                                            )
                                        }
                                    >
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.itemTitle}>
                                                {item.type_inspection?.title ?? 'Inspection'}
                                            </Text>
                                            <Text style={styles.itemSubtitle}>
                                                {item.vehicle?.name ?? 'Unknown vehicle'}
                                            </Text>
                                            <Text style={styles.itemDate}>
                                                {moment(item.inspection_date_time).format(
                                                    'dddd, MMM D, YYYY · h:mm A'
                                                )}
                                            </Text>
                                            {defectCount > 0 ? (
                                                <Text style={styles.defectText}>
                                                    {defectCount} defect
                                                    {defectCount > 1 ? 's' : ''} reported
                                                </Text>
                                            ) : (
                                                <Text style={styles.passText}>
                                                    All parts OK
                                                </Text>
                                            )}
                                        </View>
                                        <Icon
                                            name="chevron-right"
                                            type="Feather"
                                            size={moderateScale(22)}
                                        />
                                    </Pressable>
                                );
                            }}
                            ItemSeparatorComponent={() => (
                                <View style={styles.separator} />
                            )}
                        />
                    ) : (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>No inspection history found</Text>
                        </View>
                    )}
                </View>
            </LinearGradient>
        </Container>
    );
};

export default InspectionHistory;

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
    listItem: {
        marginHorizontal: moderateScale(15),
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: moderateScale(12)
    },
    itemTitle: {
        color: '#33404F',
        fontFamily: FONTS.ProductSans.bold,
        fontSize: moderateScale(15),
        textTransform: 'capitalize'
    },
    itemSubtitle: {
        color: '#33404F',
        fontFamily: FONTS.ProductSans.regular,
        fontSize: moderateScale(13),
        marginTop: moderateScale(2)
    },
    itemDate: {
        color: '#7D8083',
        fontFamily: FONTS.ProductSans.regular,
        fontSize: moderateScale(12),
        marginTop: moderateScale(4)
    },
    defectText: {
        color: '#FA1740',
        fontFamily: FONTS.ProductSans.regular,
        fontSize: moderateScale(12),
        marginTop: moderateScale(4)
    },
    passText: {
        color: '#4ECB71',
        fontFamily: FONTS.ProductSans.regular,
        fontSize: moderateScale(12),
        marginTop: moderateScale(4)
    },
    separator: {
        borderWidth: 0.5,
        borderColor: '#E4E8EE',
        marginHorizontal: moderateScale(15)
    },
    emptyState: {
        justifyContent: 'center',
        alignItems: 'center',
        flex: 1
    },
    emptyText: {
        color: '#33404F',
        fontFamily: FONTS.ProductSans.regular,
        fontSize: moderateScale(13)
    }
});
