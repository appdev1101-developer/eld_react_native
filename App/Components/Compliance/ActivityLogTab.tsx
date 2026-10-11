import React, { useCallback, useMemo } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-basic-elements';
import { moderateScale } from '../../Constants/PixelRatio';
import { FONTS } from '../../Constants/Fonts';
import ActivityLogItem from './ActivityLogItem';
import { HosGraphLogEntry } from '../../core/api/types/hosLog';


interface Props {
    logs: HosGraphLogEntry[];
    timezone: string;
    onEditLog: (log: HosGraphLogEntry) => void;
}


const ActivityLogTab: React.FC<Props> = ({logs,timezone, onEditLog }) => {
    
    const renderItem = useCallback(({item,index}: { item: HosGraphLogEntry,index:number }) => (
        <ActivityLogItem
                item={item}
                timezone={timezone}
                onEdit={onEditLog}
                shouldBounce={index === 0}
            />
    ), [timezone, onEditLog]);

    const keyExtractor = useCallback(
        (item: HosGraphLogEntry,index: number) => String(index),
        []
    );

    if (!logs.length) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                    No activity logs found.
                </Text>
            </View>
        );
    }
    
    return (
        <FlatList
            data={logs}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            removeClippedSubviews
        />
    );
};

const styles = StyleSheet.create({
    listContent: {
        paddingBottom: moderateScale(20)
    },

    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center'
    },

    emptyText: {
        color: '#929BA8',
        fontFamily: FONTS.ProductSans.regular,
        fontSize: moderateScale(14)
    }
});


export default ActivityLogTab;


