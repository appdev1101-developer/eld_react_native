import { FlatList, Image, ScrollView, StyleSheet, View } from 'react-native';
import React from 'react';
import { Container, Icon, Text } from 'react-native-basic-elements';
import AppStatusBar from '../../Components/AppStatusBar';
import LinearGradient from 'react-native-linear-gradient';
import HomeHeader from '../../Components/Headers/HomeHeader';
import { moderateScale } from '../../Constants/PixelRatio';
import { FONTS } from '../../Constants/Fonts';
import moment from 'moment';
import { useRoute } from '@react-navigation/native';
import { MAIN_BASE_URL } from '../../Utils/EnvVariables';

const getInspectionImageUrl = (imageUrl?: string | null) => {
    if (!imageUrl) {
        return null;
    }
    if (imageUrl.startsWith('http')) {
        return imageUrl;
    }
    return `${MAIN_BASE_URL}/uploads/${imageUrl}`;
};

const InspectionHistoryDetail = () => {
    const route = useRoute<any>();
    const inspection = route.params?.inspection;
    const inspectionLog = inspection?.inspection_log ?? [];
    const defectCount = inspectionLog.filter((log: any) => log.is_ok === 2).length;

    return (
        <Container>
            <AppStatusBar />

            <LinearGradient
                colors={['#392969', '#7051CF']}
                style={{ flex: 1 }}
            >
                <HomeHeader showBack />

                <View style={styles.bodyCard}>
                    <ScrollView showsVerticalScrollIndicator={false}>
                        <View style={styles.header}>
                            <Text style={styles.headerText}>Inspection Details</Text>
                        </View>

                        <View style={styles.summaryCard}>
                            <Text style={styles.summaryTitle}>
                                {inspection?.type_inspection?.title ?? 'Inspection'}
                            </Text>
                            <Text style={styles.summaryRow}>
                                Vehicle: {inspection?.vehicle?.name ?? '—'}
                            </Text>
                            <Text style={styles.summaryRow}>
                                Date:{' '}
                                {moment(inspection?.inspection_date_time).format(
                                    'dddd, MMM D, YYYY'
                                )}
                            </Text>
                            <Text style={styles.summaryRow}>
                                Time:{' '}
                                {moment(inspection?.inspection_date_time).format('h:mm A')}
                            </Text>
                            <Text
                                style={[
                                    styles.summaryRow,
                                    defectCount > 0 ? styles.defectSummary : styles.passSummary
                                ]}
                            >
                                {defectCount > 0
                                    ? `${defectCount} defect${defectCount > 1 ? 's' : ''} reported`
                                    : 'All parts passed inspection'}
                            </Text>
                        </View>

                        <FlatList
                            data={inspectionLog}
                            scrollEnabled={false}
                            keyExtractor={(item, index) =>
                                `${item.inspection_id}-${item.parts_id}-${index}`
                            }
                            renderItem={({ item }) => {
                                const isOk = item.is_ok === 1;
                                const imageUri = getInspectionImageUrl(item.image_url);

                                return (
                                    <View style={styles.partCard}>
                                        <View style={styles.partHeader}>
                                            <Text style={styles.partTitle}>
                                                {item.parts?.title ?? 'Unknown part'}
                                            </Text>
                                            <View
                                                style={[
                                                    styles.statusBadge,
                                                    isOk
                                                        ? styles.statusOk
                                                        : styles.statusDefect
                                                ]}
                                            >
                                                <Icon
                                                    name={isOk ? 'like' : 'infocirlceo'}
                                                    type={isOk ? 'EvilIcon' : 'AntDesign'}
                                                    size={moderateScale(isOk ? 20 : 14)}
                                                    color={isOk ? '#4ECB71' : '#FA1740'}
                                                />
                                                <Text
                                                    style={[
                                                        styles.statusText,
                                                        isOk
                                                            ? styles.statusTextOk
                                                            : styles.statusTextDefect
                                                    ]}
                                                >
                                                    {isOk ? 'OK' : 'Defect'}
                                                </Text>
                                            </View>
                                        </View>

                                        {!isOk ? (
                                            <View style={styles.defectDetails}>
                                                {item.defect?.title ? (
                                                    <Text style={styles.defectRow}>
                                                        Defect type: {item.defect.title}
                                                    </Text>
                                                ) : null}
                                                {item.notes ? (
                                                    <Text style={styles.defectRow}>
                                                        Notes: {item.notes}
                                                    </Text>
                                                ) : null}
                                                {imageUri ? (
                                                    <Image
                                                        source={{ uri: imageUri }}
                                                        style={styles.defectImage}
                                                        resizeMode="cover"
                                                    />
                                                ) : null}
                                            </View>
                                        ) : null}
                                    </View>
                                );
                            }}
                            ItemSeparatorComponent={() => (
                                <View style={styles.separator} />
                            )}
                        />
                    </ScrollView>
                </View>
            </LinearGradient>
        </Container>
    );
};

export default InspectionHistoryDetail;

const styles = StyleSheet.create({
    bodyCard: {
        backgroundColor: '#fff',
        paddingTop: moderateScale(20),
        flex: 1,
        zIndex: 1,
        borderTopRightRadius: moderateScale(40),
        borderTopLeftRadius: moderateScale(40),
        paddingBottom: moderateScale(20)
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
    summaryCard: {
        backgroundColor: '#EFEFEF',
        borderRadius: moderateScale(5),
        marginHorizontal: moderateScale(15),
        marginBottom: moderateScale(15),
        paddingHorizontal: moderateScale(12),
        paddingVertical: moderateScale(12)
    },
    summaryTitle: {
        color: '#33404F',
        fontFamily: FONTS.ProductSans.bold,
        fontSize: moderateScale(15),
        textTransform: 'capitalize',
        marginBottom: moderateScale(8)
    },
    summaryRow: {
        color: '#33404F',
        fontFamily: FONTS.ProductSans.regular,
        fontSize: moderateScale(13),
        marginTop: moderateScale(2)
    },
    defectSummary: {
        color: '#FA1740',
        marginTop: moderateScale(8)
    },
    passSummary: {
        color: '#4ECB71',
        marginTop: moderateScale(8)
    },
    partCard: {
        marginHorizontal: moderateScale(15),
        paddingVertical: moderateScale(10)
    },
    partHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    partTitle: {
        color: '#252A31',
        fontFamily: FONTS.ProductSans.regular,
        fontSize: moderateScale(13),
        flex: 1,
        marginRight: moderateScale(10)
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: moderateScale(3),
        paddingHorizontal: moderateScale(8),
        paddingVertical: moderateScale(4)
    },
    statusOk: {
        backgroundColor: '#E8F8EE'
    },
    statusDefect: {
        backgroundColor: '#FDE8EC'
    },
    statusText: {
        fontFamily: FONTS.ProductSans.regular,
        fontSize: moderateScale(12),
        marginLeft: moderateScale(4)
    },
    statusTextOk: {
        color: '#4ECB71'
    },
    statusTextDefect: {
        color: '#FA1740'
    },
    defectDetails: {
        backgroundColor: '#D9D9D9',
        borderRadius: moderateScale(3),
        padding: moderateScale(10),
        marginTop: moderateScale(8)
    },
    defectRow: {
        color: '#33404F',
        fontFamily: FONTS.ProductSans.regular,
        fontSize: moderateScale(12),
        marginBottom: moderateScale(4)
    },
    defectImage: {
        height: moderateScale(120),
        width: '100%',
        borderRadius: moderateScale(4),
        marginTop: moderateScale(6)
    },
    separator: {
        height: moderateScale(1),
        backgroundColor: '#EFEFEF',
        marginHorizontal: moderateScale(15)
    }
});
