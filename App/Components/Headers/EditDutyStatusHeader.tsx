import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Icon, Text } from 'react-native-basic-elements';
import { moderateScale } from '../../Constants/PixelRatio';
import Util from '../../Utils/util';
import { FONTS } from '../../Constants/Fonts';


interface Props {
    onBack: () => void;
    totalShiftTime?: string;
    isInspectionPending?: boolean;
}

/**
 * Deliberately a standalone component, not a reuse of ActivityCard —
 * ActivityCard always renders a checkbox + day/month date row, which
 * doesn't appear in this screen's summary row (just shift time,
 * inspection status, and a chevron). Style conventions (icons, colors,
 * the "Inspection Done"/"No Inspection" wording, Util.convertToTimeFormat)
 * are kept identical to ActivityCard for visual consistency.
 */
const EditDutyStatusHeader: React.FC<Props> = ({
    onBack,
    totalShiftTime = '00:00:00',
    isInspectionPending = false
}) => {
    return (
        <View>
            {/* <Pressable
                style={styles.backRow}
                onPress={onBack}
                hitSlop={moderateScale(10)}
            >
                <Icon
                    name="arrow-left"
                    type="Feather"
                    size={moderateScale(20)}
                    color="#33404F"
                />
                
            </Pressable> */}
            <Text style={styles.title}>Edit Duty Status</Text>
            <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                    <Icon
                        name="clock"
                        type="Feather"
                        size={moderateScale(13)}
                        color="#33404F"
                    />
                    <Text style={styles.summaryText}>
                        {Util.convertToTimeFormat(totalShiftTime)}
                    </Text>
                </View>

                <View style={styles.summaryItem}>
                    <Icon
                        name="tool"
                        type="Feather"
                        size={moderateScale(13)}
                        color={isInspectionPending ? 'green' : 'black'}
                    />
                    <Text style={styles.summaryText}>
                        {isInspectionPending ? 'Inspection Done' : 'No Inspection'}
                    </Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    backRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: moderateScale(20),
        paddingBottom: moderateScale(14)
    },
    title: {
        padding: moderateScale(12),
        color: '#33404F',
        fontFamily: FONTS.ProductSans.regular,
        fontSize: moderateScale(20)
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent:'center',
        paddingVertical: moderateScale(10)
    },
    summaryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: moderateScale(20)
    },
    summaryText: {
        marginLeft: moderateScale(6),
        color: '#33404F',
        fontFamily: FONTS.ProductSans.regular,
        fontSize: moderateScale(12)
    }
});

export default React.memo(EditDutyStatusHeader);