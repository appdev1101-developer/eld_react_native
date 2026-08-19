import React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { Icon, Text } from 'react-native-basic-elements';
import { moderateScale } from '../../Constants/PixelRatio';
import { FONTS } from '../../Constants/Fonts';


interface Props {
    value: string;
    onChange: (value: string) => void;
}

const LocationField: React.FC<Props> = ({ value, onChange }) => {
    return (
        <View>
            <Text style={styles.label}>Location*</Text>
            <View style={styles.field}>
                <View style={styles.iconCircle}>
                    <Icon
                        name="navigation"
                        type="Feather"
                        size={moderateScale(14)}
                        color="#FFFFFF"
                    />
                </View>
                <TextInput
                    style={styles.input}
                    value={value}
                    onChangeText={onChange}
                    placeholder="Enter location"
                    placeholderTextColor="#929BA8"
                />
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
    field: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#D9D9D9',
        borderRadius: moderateScale(10),
        paddingHorizontal: moderateScale(10),
        paddingVertical: moderateScale(8)
    },
    iconCircle: {
        width: moderateScale(28),
        height: moderateScale(28),
        borderRadius: moderateScale(14),
        backgroundColor: '#1475ED',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: moderateScale(10)
    },
    input: {
        flex: 1,
        color: '#33404F',
        fontFamily: FONTS.ProductSans.regular,
        fontSize: moderateScale(15),
        paddingVertical: moderateScale(6)
    }
});

export default React.memo(LocationField);