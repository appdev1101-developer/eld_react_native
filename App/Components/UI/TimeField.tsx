import React, { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { Icon, Text } from 'react-native-basic-elements';
import DateTimePicker, {
    DateTimePickerEvent
} from '@react-native-community/datetimepicker';
import moment from 'moment';
import { moderateScale } from '../../Constants/PixelRatio';
import { FONTS } from '../../Constants/Fonts';
import { logger } from '../../core/logger';


interface Props {
    label: string;
    value: Date;
    timezoneLabel?: string;
    onChange: (date: Date) => void;
    disabled?: boolean;
    minTime: Date;
    maxTime: Date;
}

/**
 * Android's native time picker is a self-dismissing dialog — onChange
 * fires once with the result and the dialog closes itself. iOS's inline
 * spinner does neither, so it needs to live inside our own Modal with an
 * explicit "Done" to close, and its onChange fires continuously as the
 * user scrolls (so we apply the value live but don't close until Done).
 */
const TimeField: React.FC<Props> = ({
    label,
    value,
    timezoneLabel = 'GMT',
    onChange,
    disabled,
    minTime,
    maxTime,
}) => {
    const [pickerVisible, setPickerVisible] = useState(false);
    const [draftValue, setDraftValue] = useState(value);

    const displayValue = `${moment(value).format('h:mm:ss a')} ${timezoneLabel}`;

    const openPicker = () => {
        if (disabled) return;
        setDraftValue(value);
        setPickerVisible(true);
    };

    const handleAndroidChange = (event: DateTimePickerEvent, selected?: Date) => {
        setPickerVisible(false);
        
        if (event.type === 'set' && selected && (selected.getTime() >= minTime.getTime() && selected.getTime() < maxTime.getTime())) {
            onChange(selected);
        }
    };

    const handleIosChange = (_event: DateTimePickerEvent, selected?: Date) => {
        if (selected) {
            setDraftValue(selected);
        }
    };

    const confirmIos = () => {
        onChange(draftValue);
        setPickerVisible(false);
    };

    const cancelIos = () => {
        setPickerVisible(false);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.label}>{label}*</Text>

            <Pressable
                style={[styles.field, disabled && styles.fieldDisabled]}
                onPress={openPicker}
            >
                <Text style={styles.value}>{displayValue}</Text>
                <Icon
                    name="lock"
                    type="Feather"
                    size={moderateScale(14)}
                    color="#929BA8"
                />
            </Pressable>

            {pickerVisible && Platform.OS === 'android' ? (
                <DateTimePicker
                    value={value}
                    mode="time"
                    is24Hour={false}
                    display="default"
                    onChange={handleAndroidChange}
                />
            ) : null}

            {Platform.OS === 'ios' ? (
                <Modal
                    visible={pickerVisible}
                    transparent
                    animationType="slide"
                    onRequestClose={cancelIos}
                >
                    <Pressable style={styles.backdrop} onPress={cancelIos}>
                        <Pressable style={styles.sheet}>
                            <View style={styles.sheetHeader}>
                                <Pressable onPress={cancelIos} hitSlop={moderateScale(8)}>
                                    <Text style={styles.sheetAction}>Cancel</Text>
                                </Pressable>
                                <Pressable onPress={confirmIos} hitSlop={moderateScale(8)}>
                                    <Text
                                        style={{...styles.sheetAction, ...styles.sheetActionDone}}
                                    >
                                        Done
                                    </Text>
                                </Pressable>
                            </View>
                            <DateTimePicker
                                value={draftValue}
                                mode="time"
                                is24Hour={false}
                                display="spinner"
                                onChange={handleIosChange}
                            />
                        </Pressable>
                    </Pressable>
                </Modal>
            ) : null}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1
    },
    label: {
        color: '#33404F',
        fontFamily: FONTS.ProductSans.regular,
        fontSize: moderateScale(14),
        marginBottom: moderateScale(8)
    },
    field: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: '#D9D9D9',
        borderRadius: moderateScale(10),
        paddingHorizontal: moderateScale(14),
        paddingVertical: moderateScale(14)
    },
    fieldDisabled: {
        opacity: 0.5
    },
    value: {
        color: '#33404F',
        fontFamily: FONTS.ProductSans.regular,
        fontSize: moderateScale(14)
    },
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'flex-end'
    },
    sheet: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: moderateScale(16),
        borderTopRightRadius: moderateScale(16)
    },
    sheetHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: moderateScale(16),
        paddingVertical: moderateScale(12),
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#D9D9D9'
    },
    sheetAction: {
        color: '#929BA8',
        fontFamily: FONTS.ProductSans.regular,
        fontSize: moderateScale(15)
    },
    sheetActionDone: {
        color: '#1475ED',
        fontFamily: FONTS.ProductSans.bold
    }
});

export default React.memo(TimeField);