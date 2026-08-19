import React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { Text } from 'react-native-basic-elements';
import { FONTS } from '../../Constants/Fonts';
import { moderateScale } from '../../Constants/PixelRatio';


interface Props {
    value: string;
    onChange: (value: string) => void;
}

const NotesField: React.FC<Props> = ({ value, onChange }) => {
    return (
        <View>
            <Text style={styles.label}>Notes*</Text>
            <TextInput
                style={styles.textarea}
                value={value}
                onChangeText={onChange}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
                placeholder=""
            />
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
    textarea: {
        borderWidth: 1,
        borderColor: '#D9D9D9',
        borderRadius: moderateScale(10),
        minHeight: moderateScale(110),
        paddingHorizontal: moderateScale(12),
        paddingVertical: moderateScale(10),
        color: '#33404F',
        fontFamily: FONTS.ProductSans.regular,
        fontSize: moderateScale(14)
    }
});

export default React.memo(NotesField);