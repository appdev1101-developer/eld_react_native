import React, { useCallback, useMemo } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-basic-elements';
import moment from 'moment-timezone';
import { moderateScale } from '../../Constants/PixelRatio';
import { FONTS } from '../../Constants/Fonts';
import { HosDayRecord } from '../../core/api/types/hosLog';
import Util from '../../Utils/util';


interface Props {
    record?: HosDayRecord;
    timezone: string;
}

const ActivityLogTab: React.FC<Props> = ({ record, timezone }) => {
    const data = record?.log.graph_data ?? [];

    const renderItem = useCallback(({ item }: { item: typeof data[number] }) => (
        <View style={styles.row}>
            <View style={styles.status}>
                <Text style={styles.statusText}>{item.log_name}</Text>
            </View>

            <View style={styles.content}>
                <Text style={styles.time}>
                    {Util.formatLogTimeRange(
                        record?.date ?? '',
                        item.start_log_time,
                        item.end_log_time,
                        timezone || moment.tz.guess()
                    )}
                </Text>

                <Text style={styles.location}>
                    {item.location_start ?? 'No location'}
                </Text>
            </View>
        </View>
    ), [record?.date, timezone]);

    const separator = useMemo(
        () => <View style={styles.separator} />,
        []
    );

    return (
        <FlatList
            data={data}
            keyExtractor={item => String(item.log_id)}
            renderItem={renderItem}
            ItemSeparatorComponent={() => separator}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
                <Text style={styles.empty}>No log records available.</Text>
            }
        />
    );
};

const styles = StyleSheet.create({
    list: {
        paddingBottom: moderateScale(20)
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: moderateScale(10)
    },
    status: {
        width: moderateScale(85),
        alignItems: 'center'
    },
    statusText: {
        color: '#33404F',
        fontSize: moderateScale(12),
        fontFamily: FONTS.ProductSans.regular,
        opacity: 0.5
    },
    content: {
        flex: 1
    },
    time: {
        fontFamily: FONTS.ProductSans.bold,
        fontSize: moderateScale(15),
        color: '#33404F'
    },
    location: {
        fontFamily: FONTS.ProductSans.regular,
        fontSize: moderateScale(12),
        color: '#33404F',
        opacity: 0.5,
        marginTop: moderateScale(5)
    },
    separator: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: '#C4C4C4'
    },
    empty: {
        textAlign: 'center',
        marginTop: moderateScale(20),
        color: '#33404F'
    }
});

export default ActivityLogTab;


