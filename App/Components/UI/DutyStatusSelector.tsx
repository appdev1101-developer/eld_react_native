import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-basic-elements';
import { HOS_STATUS_ROWS } from '../../core/chart';
import { FONTS } from '../../Constants/Fonts';
import { moderateScale } from '../../Constants/PixelRatio';


interface Props {
    value: number;
    onChange: (statusId: number) => void;
}

/**
 * Only the 4 base duty statuses are selectable here — Personal Conveyance
 * and Yard Move are the dashed-line derived statuses on the chart (see
 * HOS_DASHED_STATUS_CODES in core/chart/hos_chart.config.ts), not directly
 * editable as a log entry's primary status.
 *
 * Labels come from HOS_STATUS_ROWS — the same source the chart itself
 * uses to draw its row labels — so this selector can never drift out of
 * sync with what the chart displays. `row.index + 1` gives the actual
 * duty-status id (see HOS_ROW_INDEX_BY_STATUS: id 1 -> row 0, id 2 -> row
 * 1, etc. for these 4 base statuses).
 */
const DUTY_STATUS_OPTIONS = HOS_STATUS_ROWS.map((row) => ({
    id: row.index + 1,
    label: row.label
}));

const DutyStatusSelector: React.FC<Props> = ({ value, onChange }) => {
    return (
        <View>
            <Text style={styles.label}>Duty Status*</Text>
            <View style={styles.row}>
                {DUTY_STATUS_OPTIONS.map((option) => {
                    const selected = option.id === value;
                    return (
                        <Pressable
                            key={option.id}
                            style={[
                                styles.chip,
                                selected ? styles.chipSelected : styles.chipUnselected
                            ]}
                            onPress={() => onChange(option.id)}
                        >
                            <Text
                                style={{
                                    ...styles.chipText,
                                    ...(selected
                                        ? styles.chipTextSelected
                                        : styles.chipTextUnselected)
                                }}
                            >
                                {option.label}
                            </Text>
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    label: {
        color: '#33404F',
        fontFamily: FONTS.ProductSans.regular,
        fontSize: moderateScale(14),
        marginBottom: moderateScale(8)
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: moderateScale(8)
    },
    chip: {
        flex: 1,
        borderRadius: moderateScale(10),
        paddingVertical: moderateScale(16),
        alignItems: 'center',
        justifyContent: 'center'
    },
    chipSelected: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1.5,
        borderColor: '#1B1B1F'
    },
    chipUnselected: {
        backgroundColor: '#EDEEFB',
        borderWidth: 1.5,
        borderColor: 'transparent'
    },
    chipText: {
        fontFamily: FONTS.ProductSans.bold,
        fontSize: moderateScale(15)
    },
    chipTextSelected: {
        color: '#1B1B1F'
    },
    chipTextUnselected: {
        color: '#4C6EF5'
    }
});

export default React.memo(DutyStatusSelector);