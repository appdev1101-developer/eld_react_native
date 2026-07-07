import { Image, StyleSheet, View } from 'react-native';
import React, { useState } from 'react';
import { moderateScale } from '../../Constants/PixelRatio';
import HomeCard from './HomeCard';
import { StatusDataType } from '../../Screens/Home';
import { AppTextInput, Card, Icon, Text } from 'react-native-basic-elements';
import { FONTS } from '../../Constants/Fonts';
import { showError } from '../../Utils/toast';
import { required } from '../../Utils/validators';
import { THEME } from '../../Constants/Theme';

type Props = {
    data: Array<StatusDataType>;
    selectedStatus?: StatusDataType;
    locationLabel?: string;
    onSelect?: (item: StatusDataType) => void;
    onBack?: () => void;
    onConfirm?: (item: StatusDataType, remarks: string) => void;
};
const AllStatus: React.FC<Props> = ({
    data,
    selectedStatus,
    locationLabel = 'Location unavailable — enable GPS or connect ELD',
    onSelect = () => {},
    onBack = () => {},
    onConfirm = () => {}
}) => {
    const [remarks, setRemarks] = useState<string>('');
    const [remarksError, setRemarksError] = useState<string>('');

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
        onConfirm(selectedStatus, trimmedRemarks);
    };

    return (
        <>
            {selectedStatus ? (
                <View style={styles.container}>
                    <Card style={styles.confirmCard}>
                        <AppTextInput
                            leftIcon={{
                                name: 'location-sharp',
                                type: 'Ionicon',
                                color: THEME.colors.accent,
                                size: 25
                            }}
                            inputContainerStyle={styles.locationInput}
                            inputStyle={styles.locationInputText}
                            value={locationLabel}
                            rightAction={
                                <Icon
                                    name="edit-square"
                                    type="MaterialIcon"
                                    size={23}
                                    color={THEME.colors.accent}
                                />
                            }
                            editable={false}
                        />

                        <AppTextInput
                            inputContainerStyle={{
                                ...styles.remarksInput,
                                borderWidth: remarksError ? 1 : 0,
                                borderColor: remarksError
                                    ? THEME.colors.error
                                    : undefined
                            }}
                            placeholder="Add Remarks Here"
                            placeholderTextColor={THEME.colors.textMuted}
                            inputStyle={styles.remarksInputText}
                            value={remarks}
                            onChangeText={(val) => {
                                setRemarks(val);
                                if (remarksError) {
                                    setRemarksError('');
                                }
                            }}
                        />
                        {remarksError ? (
                            <Text style={styles.errorText}>{remarksError}</Text>
                        ) : null}
                    </Card>

                    <HomeCard
                        style={styles.confirmActionCard}
                        onPress={handleConfirm}
                    >
                        <Image
                            source={selectedStatus?.icon}
                            style={styles.img}
                        />
                        <Text style={styles.statusName}>Start</Text>
                        <Text style={styles.statusDesc}>Tap to Continue</Text>
                    </HomeCard>

                    <HomeCard>
                        <Image
                            source={require('../../Assets/Icons/Support.png')}
                            style={styles.img}
                        />
                        <Text style={styles.statusName}>Support</Text>
                        <Text style={styles.statusDesc}>Talk to your team</Text>
                    </HomeCard>

                    <HomeCard onPress={onBack}>
                        <Image
                            source={require('../../Assets/Icons/Back.png')}
                            style={styles.img}
                        />
                        <Text style={styles.statusName}>Back</Text>
                        <Text style={styles.statusDesc}>change shift</Text>
                    </HomeCard>
                </View>
            ) : (
                <View style={styles.container}>
                    {data.map((item, index) => {
                        return (
                            <HomeCard
                                key={index}
                                onPress={() => onSelect(item)}
                            >
                                <Image
                                    source={item.icon}
                                    style={styles.img}
                                />
                                <Text style={styles.statusName}>{item.name}</Text>
                                <Text style={styles.statusDesc}>{item.description}</Text>
                            </HomeCard>
                        );
                    })}
                </View>
            )}
        </>
    );
};

export default AllStatus;

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: moderateScale(18) + 15,
        justifyContent: 'space-between',
        marginTop: moderateScale(15),
        zIndex: 2,
        gap: moderateScale(10)
    },
    img: {
        height: moderateScale(45),
        width: moderateScale(45),
        resizeMode: 'contain'
    },
    statusName: {
        fontFamily: FONTS.ProductSans.bold,
        textAlign: 'center',
        fontSize: moderateScale(16),
        color: THEME.colors.textPrimary,
        marginTop: moderateScale(5),
        textTransform: 'capitalize'
    },
    statusDesc: {
        fontFamily: FONTS.ProductSans.regular,
        textAlign: 'center',
        fontSize: moderateScale(9),
        color: THEME.colors.textSecondary,
        textTransform: 'capitalize'
    },
    confirmCard: {
        width: '100%',
        borderRadius: THEME.radius.lg,
        backgroundColor: THEME.colors.surface,
        borderWidth: 1,
        borderColor: THEME.colors.borderLight,
        padding: moderateScale(12),
        ...THEME.shadow.card
    },
    locationInput: {
        borderWidth: 0,
        backgroundColor: THEME.colors.surfaceElevated,
        height: moderateScale(38),
        borderRadius: THEME.radius.pill
    },
    locationInputText: {
        fontFamily: FONTS.ProductSans.regular,
        color: THEME.colors.textSecondary,
        fontSize: moderateScale(10)
    },
    remarksInput: {
        backgroundColor: THEME.colors.surfaceElevated,
        height: moderateScale(42),
        marginTop: moderateScale(8),
        paddingLeft: moderateScale(12),
        borderRadius: THEME.radius.sm
    },
    remarksInputText: {
        color: THEME.colors.textPrimary,
        fontFamily: FONTS.ProductSans.regular,
        fontSize: moderateScale(12)
    },
    errorText: {
        color: THEME.colors.error,
        fontFamily: FONTS.ProductSans.regular,
        fontSize: moderateScale(9),
        marginTop: moderateScale(4),
        marginLeft: moderateScale(4)
    },
    confirmActionCard: {
        borderColor: THEME.colors.accent,
        borderWidth: 1.5
    }
});