import React from 'react';
import { Image, Modal, Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-basic-elements';
import { moderateScale } from '../../Constants/PixelRatio';
import { FONTS } from '../../Constants/Fonts';


interface Props {
    visible: boolean;
    message: string;
    onCancel: () => void;
    onConfirm: () => void;
    cancelLabel?: string;
    confirmLabel?: string;
}

const ConfirmDutyStatusDialog: React.FC<Props> = ({
    visible,
    message,
    onCancel,
    onConfirm,
    cancelLabel = 'No',
    confirmLabel = 'Yes'
}) => {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onCancel}
        >
            <View style={styles.backdrop}>
                <View style={styles.card}>
                    <View style={styles.illustrationWrapper}>
                        <Image
                            source={require('../../Assets/Icons/chart_edit_dialog.png')}
                            style={styles.illustration}
                            resizeMode="contain"
                        />
                    </View>

                    <Text style={styles.message}>{message}</Text>

                    <View style={styles.actionsRow}>
                        <Pressable
                            style={[styles.actionButton, styles.actionButtonLeft]}
                            onPress={onCancel}
                        >
                            <Text style={styles.cancelText}>{cancelLabel}</Text>
                        </Pressable>
                        <Pressable
                            style={styles.actionButton}
                            onPress={onConfirm}
                        >
                            <Text style={styles.confirmText}>{confirmLabel}</Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: moderateScale(30)
    },
    card: {
        width: '100%',
        maxWidth: moderateScale(340),
        backgroundColor: '#FFFFFF',
        borderRadius: moderateScale(16),
        overflow: 'hidden'
    },
    illustrationWrapper: {
        paddingHorizontal: moderateScale(20),
        paddingTop: moderateScale(20)
    },
    illustration: {
        width: '100%',
        aspectRatio: 233 / 106
    },
    message: {
        textAlign: 'center',
        color: '#1B1B1F',
        fontFamily: FONTS.ProductSans.bold,
        fontSize: moderateScale(17),
        lineHeight: moderateScale(23),
        paddingHorizontal: moderateScale(24),
        paddingVertical: moderateScale(24)
    },
    actionsRow: {
        flexDirection: 'row',
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: '#E4E7EC'
    },
    actionButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: moderateScale(16)
    },
    actionButtonLeft: {
        borderRightWidth: StyleSheet.hairlineWidth,
        borderRightColor: '#E4E7EC'
    },
    cancelText: {
        color: '#33404F',
        fontFamily: FONTS.ProductSans.regular,
        fontSize: moderateScale(18)
    },
    confirmText: {
        color: '#1475ED',
        fontFamily: FONTS.ProductSans.bold,
        fontSize: moderateScale(18)
    }
});

export default React.memo(ConfirmDutyStatusDialog);