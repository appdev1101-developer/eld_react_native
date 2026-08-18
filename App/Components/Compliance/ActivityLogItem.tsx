import React, { useRef } from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import 
    Swipeable
 from 'react-native-gesture-handler/ReanimatedSwipeable';

import {Icon } from 'react-native-basic-elements';

import moment from 'moment-timezone';

import { moderateScale } from '../../Constants/PixelRatio';
import { FONTS } from '../../Constants/Fonts';
import { HosGraphLogEntry } from '../../core/api/types/hosLog';

interface Props {
    item: HosGraphLogEntry;
    timezone: string;
    onEdit: (item: HosGraphLogEntry) => void;
}

const ActivityLogItem: React.FC<Props> = ({
    item,
    timezone,
    onEdit
}) => {
    const handleEdit = () => {
        onEdit(item);
    };

    const renderRightActions = () => {
        return (
            <TouchableOpacity
                activeOpacity={0.8}
                style={styles.editAction}
                onPress={handleEdit}
            >
                <View style={{flexDirection:'row',}}>
                    <Text style={styles.text}>
                        Edit
                    </Text>
                    <Icon
                        name="edit"
                        type="Feather"
                        size={moderateScale(14)}
                        color="#FFFFFF"
                    />
                </View>
                
            </TouchableOpacity>
        );
    };

    const formatTime = (time: string) => {
        if (!time) {
            return '';
        }

        return moment
            .tz(
                `2000-01-01 ${time}`,
                'YYYY-MM-DD HH:mm:ss',
                timezone
            )
            .format('h:mm A');
    };

    const startTime = formatTime(item.start_log_time);
    const endTime = formatTime(item.end_log_time);

    const duration = `${startTime} | ${endTime}`;

    return (
        <Swipeable
            renderRightActions={renderRightActions}
            rightThreshold={moderateScale(40)}
            overshootRight={false}
            friction={2}
        >
            <View style={styles.container}>
                <View style={styles.statusContainer}>
                    <Text style={styles.status}>
                        {item.log_name}
                    </Text>
                </View>

                <View style={styles.detailsContainer}>
                    <Text style={styles.time}>
                        {duration}
                    </Text>

                    {!!item.location_start && (
                        <Text
                            numberOfLines={1}
                            style={styles.location}
                        >
                            {item.location_start}
                        </Text>
                    )}
                </View>

                {/* <TouchableOpacity
                    activeOpacity={0.7}
                    style={styles.inlineEditButton}
                    onPress={handleEdit}
                >
                    <Icon
                        name="edit"
                        type="Feather"
                        size={moderateScale(14)}
                        color="#FF5A00"
                    />
                </TouchableOpacity> */}
            </View>
        </Swipeable>
    );
};

const styles = StyleSheet.create({
    container: {
        minHeight: moderateScale(82),
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#C8C8C8'
    },

    statusContainer: {
        width: moderateScale(75),
        paddingHorizontal: moderateScale(12)
    },

    status: {
        color: '#929BA8',
        fontFamily: FONTS.ProductSans.regular,
        fontSize: moderateScale(13),
        lineHeight: moderateScale(18)
    },

    detailsContainer: {
        flex: 1,
        paddingVertical: moderateScale(12),
        paddingRight: moderateScale(8)
    },

    time: {
        color: '#33404F',
        fontFamily: FONTS.ProductSans.bold,
        fontSize: moderateScale(17)
    },

    location: {
        marginTop: moderateScale(4),
        color: '#929BA8',
        fontFamily: FONTS.ProductSans.regular,
        fontSize: moderateScale(13)
    },
    text:{
        color: '#33404F',
        fontFamily: FONTS.ProductSans.regular,
        fontSize: moderateScale(14),
        paddingHorizontal: moderateScale(6), 
    },
    inlineEditButton: {
        width: moderateScale(55),
        alignSelf: 'stretch',
        alignItems: 'center',
        justifyContent: 'center'
    },

    editAction: {
        width: moderateScale(70),
        backgroundColor: '#FF5A00',
        alignItems: 'center',
        justifyContent: 'center'
    }
});

export default React.memo(ActivityLogItem);