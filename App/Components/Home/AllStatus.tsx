import { Image, StyleSheet, View } from 'react-native';
import React, { useState } from 'react';
import { moderateScale } from '../../Constants/PixelRatio';
import HomeCard from './HomeCard';
import { StatusDataType } from '../../Screens/Home';
import { AppTextInput, Card, Icon, Text } from 'react-native-basic-elements';
import { FONTS } from '../../Constants/Fonts';
import { showError } from '../../Utils/toast';
import { required } from '../../Utils/validators';

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
                    <Card style={styles.stylesDataCard}>
                        <AppTextInput
                            leftIcon={{
                                name: 'location-sharp',
                                type: 'Ionicon',
                                color: '#392969',
                                size: 25
                            }}
                            inputContainerStyle={{
                                borderWidth: 0,
                                backgroundColor: '#F4F4F4',
                                height: moderateScale(35),
                                borderRadius: moderateScale(20)
                            }}
                            inputStyle={{
                                fontFamily: FONTS.ProductSans.regular,
                                color: '#7D8083',
                                fontSize: moderateScale(9.5)
                            }}
                            value={locationLabel}
                            rightAction={
                                <Icon
                                    name="edit-square"
                                    type="MaterialIcon"
                                    size={23}
                                    color={'#FF5B00'}
                                />
                            }
                            editable={false}
                        />

                        <AppTextInput
                            inputContainerStyle={{
                                backgroundColor: '#E8EDF1',
                                borderWidth: remarksError ? 1 : 0,
                                borderColor: remarksError ? '#EE4E34' : undefined,
                                height: moderateScale(40),
                                marginTop: moderateScale(5),
                                paddingLeft: moderateScale(10)
                            }}
                            placeholder="Add Remarks Here"
                            inputStyle={{
                                color: '#000000',
                                fontFamily: FONTS.ProductSans.regular,
                                fontSize: moderateScale(12)
                            }}
                            value={remarks}
                            onChangeText={(val) => {
                                setRemarks(val);
                                if (remarksError) {
                                    setRemarksError('');
                                }
                            }}
                        />
                        {remarksError ? (
                            <Text
                                style={{
                                    color: '#EE4E34',
                                    fontFamily: FONTS.ProductSans.regular,
                                    fontSize: moderateScale(9),
                                    marginTop: moderateScale(4),
                                    marginLeft: moderateScale(4)
                                }}
                            >
                                {remarksError}
                            </Text>
                        ) : null}
                    </Card>

                    <HomeCard
                        style={{
                            shadowColor: '#5CFA75',
                            elevation: 12
                        }}
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
        fontFamily: FONTS.ProductSans.regular,
        textAlign: 'center',
        fontSize: moderateScale(17),
        color: '#000000',
        marginTop: moderateScale(5),
        textTransform: 'capitalize'
    },
    statusDesc: {
        fontFamily: FONTS.ProductSans.regular,
        textAlign: 'center',
        fontSize: moderateScale(9),
        color: '#8E9093',
        textTransform: 'capitalize'
    },
    stylesDataCard: {
        width: '100%',
        borderRadius: moderateScale(16)
    }
});
