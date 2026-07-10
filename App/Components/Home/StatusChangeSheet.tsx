import React, { useCallback, useEffect, useState } from 'react';
import {
    Pressable,
    ScrollView,
    StyleSheet,
    View
} from 'react-native';
import Modal from 'react-native-modal';
import { Icon, Text } from 'react-native-basic-elements';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ALL_DUTY_STATUSES, StatusDataType } from '../../Constants/dutyStatus';
import { FONTS } from '../../Constants/Fonts';
import { moderateScale } from '../../Constants/PixelRatio';
import { THEME } from '../../Constants/Theme';
import { Button, DutyStatusIcon, EditField } from '../UI';
import { showError } from '../../Utils/toast';
import { required } from '../../Utils/validators';

type SheetStep = 'select' | 'confirm';

type Props = {
    visible: boolean;
    currentStatus?: StatusDataType;
    locationLabel?: string;
    onClose: () => void;
    onConfirm: (status: StatusDataType, remarks: string) => void;
};

const StatusChangeSheet: React.FC<Props> = ({
    visible,
    currentStatus,
    locationLabel = 'Location unavailable — enable GPS or connect ELD',
    onClose,
    onConfirm
}) => {
    const insets = useSafeAreaInsets();

    const [step, setStep] = useState<SheetStep>('select');
    const [selectedStatus, setSelectedStatus] = useState<
        StatusDataType | undefined
    >();
    const [remarks, setRemarks] = useState('');
    const [remarksError, setRemarksError] = useState('');

    const resetSheet = useCallback(() => {
        setStep('select');
        setSelectedStatus(undefined);
        setRemarks('');
        setRemarksError('');
    }, []);

    useEffect(() => {
        if (!visible) {
            resetSheet();
        }
    }, [visible, resetSheet]);

    const handleClose = useCallback(() => {
        resetSheet();
        onClose();
    }, [onClose, resetSheet]);

    const handleSelectStatus = (item: StatusDataType) => {
        setSelectedStatus(item);
        setStep('confirm');
    };

    const handleConfirm = () => {
        if (!selectedStatus) {
            return;
        }

        const trimmedRemarks = remarks.trim();
        const remarksValidation = required(trimmedRemarks, 'Remarks');
        if (!remarksValidation.valid) {
            setRemarksError(remarksValidation.message);
            showError(remarksValidation.message);
            return;
        }

        setRemarksError('');
        onClose();
        onConfirm(selectedStatus, trimmedRemarks);
    };

    const previewStatus = selectedStatus ?? currentStatus;

    return (
        <Modal
            isVisible={visible}
            style={styles.modal}
            backdropOpacity={0.45}
            onBackdropPress={handleClose}
            onBackButtonPress={handleClose}
            onSwipeComplete={handleClose}
            swipeDirection={['down']}
            propagateSwipe
            animationIn="slideInUp"
            animationOut="slideOutDown"
            useNativeDriver
            hideModalContentWhileAnimating
        >
            <View style={styles.sheet}>
                <View style={styles.handle} />
                <ScrollView
                    contentContainerStyle={[
                        styles.content,
                        { paddingBottom: insets.bottom + moderateScale(24) }
                    ]}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {step === 'select' ? (
                        <>
                            <Text style={styles.title}>Choose Your Status</Text>
                            <Text style={styles.subtitle}>
                                Select the duty status that matches your current
                                activity.
                            </Text>

                            <View style={styles.list}>
                                {ALL_DUTY_STATUSES.map((item) => {
                                    const isCurrent =
                                        item.apiStatus ===
                                        currentStatus?.apiStatus;

                                    return (
                                        <Pressable
                                            key={item.id}
                                            style={({ pressed }) => [
                                                styles.statusRow,
                                                pressed && styles.statusRowPressed,
                                                isCurrent && styles.statusRowCurrent
                                            ]}
                                            onPress={() => handleSelectStatus(item)}
                                        >
                                            <View
                                                style={[
                                                    styles.colorBar,
                                                    {
                                                        backgroundColor:
                                                            item.themeColor
                                                    }
                                                ]}
                                            />
                                            <View style={styles.rowIconWrap}>
                                                <DutyStatusIcon
                                                    name={item.icon}
                                                    color={item.themeColor}
                                                    size={moderateScale(28)}
                                                />
                                            </View>
                                            <View style={styles.rowText}>
                                                <Text style={styles.rowTitle}>
                                                    {item.name}
                                                </Text>
                                                {item.description ? (
                                                    <Text
                                                        style={styles.rowSubtitle}
                                                        numberOfLines={1}
                                                    >
                                                        {item.description}
                                                    </Text>
                                                ) : null}
                                            </View>
                                            {isCurrent ? (
                                                <View style={styles.currentBadge}>
                                                    <Text
                                                        style={styles.currentBadgeText}
                                                    >
                                                        Current
                                                    </Text>
                                                </View>
                                            ) : (
                                                <Icon
                                                    name="chevron-right"
                                                    type="Feather"
                                                    size={moderateScale(18)}
                                                    color={THEME.colors.textMuted}
                                                />
                                            )}
                                        </Pressable>
                                    );
                                })}
                            </View>
                        </>
                    ) : (
                        <>
                            <Pressable
                                style={styles.backLink}
                                onPress={() => {
                                    setStep('select');
                                    setRemarksError('');
                                }}
                            >
                                <Icon
                                    name="chevron-left"
                                    type="Feather"
                                    size={moderateScale(16)}
                                    color={THEME.colors.primary}
                                />
                                <Text style={styles.backLinkText}>
                                    Choose a different status
                                </Text>
                            </Pressable>

                            {previewStatus ? (
                                <View
                                    style={[
                                        styles.previewCard,
                                        {
                                            borderColor: previewStatus.themeColor,
                                            backgroundColor: `${previewStatus.themeColor}18`
                                        }
                                    ]}
                                >
                                    <View style={styles.previewIconWrap}>
                                        <DutyStatusIcon
                                            name={previewStatus.icon}
                                            color={previewStatus.themeColor}
                                            size={moderateScale(32)}
                                            strokeWidth={2.2}
                                        />
                                    </View>
                                    <View style={styles.previewText}>
                                        <Text style={styles.previewLabel}>
                                            Switching to
                                        </Text>
                                        <Text style={styles.previewName}>
                                            {previewStatus.name}
                                        </Text>
                                    </View>
                                    <View
                                        style={[
                                            styles.previewDot,
                                            {
                                                backgroundColor:
                                                    previewStatus.themeColor
                                            }
                                        ]}
                                    />
                                </View>
                            ) : null}

                            <EditField
                                inset={false}
                                leftIcon={{
                                    name: 'location-sharp',
                                    type: 'Ionicon',
                                    color: THEME.colors.accent,
                                    size: moderateScale(22)
                                }}
                                inputContainerStyle={styles.locationInput}
                                inputStyle={styles.locationInputText}
                                value={locationLabel}
                                editable={false}
                            />

                            <EditField
                                inset={false}
                                label="Remarks"
                                placeholder="Add remarks for this status change"
                                error={remarksError}
                                value={remarks}
                                onChangeText={(val) => {
                                    setRemarks(val);
                                    if (remarksError) {
                                        setRemarksError('');
                                    }
                                }}
                            />

                            <Button
                                title="Confirm Status Change"
                                variant="success"
                                fullWidth
                                inset={false}
                                style={styles.confirmButton}
                                onPress={handleConfirm}
                            />
                        </>
                    )}
                </ScrollView>
            </View>
        </Modal>
    );
};

export default StatusChangeSheet;

const styles = StyleSheet.create({
    modal: {
        margin: 0,
        justifyContent: 'flex-end'
    },
    sheet: {
        backgroundColor: THEME.colors.surface,
        borderTopLeftRadius: THEME.radius.sheet,
        borderTopRightRadius: THEME.radius.sheet,
        maxHeight: '72%'
    },
    handle: {
        alignSelf: 'center',
        backgroundColor: THEME.colors.border,
        width: moderateScale(40),
        height: moderateScale(4),
        borderRadius: moderateScale(2),
        marginTop: moderateScale(10),
        marginBottom: moderateScale(4)
    },
    content: {
        paddingHorizontal: THEME.spacing.screen,
        paddingTop: moderateScale(8)
    },
    title: {
        fontFamily: FONTS.ProductSans.bold,
        fontSize: moderateScale(20),
        color: THEME.colors.textPrimary
    },
    subtitle: {
        fontFamily: FONTS.ProductSans.regular,
        fontSize: moderateScale(13),
        color: THEME.colors.textSecondary,
        marginTop: moderateScale(6),
        marginBottom: moderateScale(16),
        lineHeight: moderateScale(18)
    },
    list: {
        gap: moderateScale(10)
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: THEME.colors.surfaceMuted,
        borderRadius: THEME.radius.md,
        borderWidth: 1,
        borderColor: THEME.colors.borderLight,
        overflow: 'hidden',
        minHeight: moderateScale(64)
    },
    statusRowPressed: {
        opacity: 0.92
    },
    statusRowCurrent: {
        borderColor: THEME.colors.primary,
        backgroundColor: THEME.colors.badgeMuted
    },
    colorBar: {
        width: moderateScale(5),
        alignSelf: 'stretch'
    },
    rowIconWrap: {
        width: moderateScale(36),
        height: moderateScale(36),
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: moderateScale(10)
    },
    rowText: {
        flex: 1,
        marginLeft: moderateScale(12),
        marginRight: moderateScale(8)
    },
    rowTitle: {
        fontFamily: FONTS.ProductSans.bold,
        fontSize: moderateScale(15),
        color: THEME.colors.textPrimary,
        textTransform: 'capitalize'
    },
    rowSubtitle: {
        fontFamily: FONTS.ProductSans.regular,
        fontSize: moderateScale(11),
        color: THEME.colors.textSecondary,
        marginTop: moderateScale(2)
    },
    currentBadge: {
        backgroundColor: THEME.colors.badgeMuted,
        paddingHorizontal: moderateScale(8),
        paddingVertical: moderateScale(4),
        borderRadius: THEME.radius.pill,
        marginRight: moderateScale(12)
    },
    currentBadgeText: {
        fontFamily: FONTS.ProductSans.bold,
        fontSize: moderateScale(10),
        color: THEME.colors.badge
    },
    backLink: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: moderateScale(14)
    },
    backLinkText: {
        fontFamily: FONTS.ProductSans.regular,
        fontSize: moderateScale(13),
        color: THEME.colors.primary,
        marginLeft: moderateScale(4)
    },
    previewCard: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: THEME.radius.md,
        padding: moderateScale(14),
        marginBottom: moderateScale(16)
    },
    previewIconWrap: {
        width: moderateScale(40),
        height: moderateScale(40),
        alignItems: 'center',
        justifyContent: 'center'
    },
    previewText: {
        flex: 1,
        marginLeft: moderateScale(12)
    },
    previewLabel: {
        fontFamily: FONTS.ProductSans.regular,
        fontSize: moderateScale(11),
        color: THEME.colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.8
    },
    previewName: {
        fontFamily: FONTS.ProductSans.bold,
        fontSize: moderateScale(18),
        color: THEME.colors.textPrimary,
        marginTop: moderateScale(2)
    },
    previewDot: {
        height: moderateScale(12),
        width: moderateScale(12),
        borderRadius: moderateScale(6)
    },
    locationInput: {
        borderWidth: 0,
        backgroundColor: THEME.colors.surfaceElevated,
        height: moderateScale(42),
        borderRadius: THEME.radius.pill
    },
    locationInputText: {
        fontFamily: FONTS.ProductSans.regular,
        color: THEME.colors.textSecondary,
        fontSize: moderateScale(11)
    },
    confirmButton: {
        marginTop: moderateScale(20)
    }
});