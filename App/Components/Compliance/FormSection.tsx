import React, { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-basic-elements';
import { moderateScale } from '../../Constants/PixelRatio';
import { FONTS } from '../../Constants/Fonts';

export interface FormSectionProps {
    title: string;
    children: ReactNode;
    style?: object;
}

const FormSection: React.FC<FormSectionProps> = ({
    title,
    children,
    style
}) => {
    return (
        <View style={style}>
            <View style={styles.header}>
                <Text style={styles.title}>{title}</Text>
            </View>

            <View style={styles.content}>
                {children}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        backgroundColor: '#EAEBEB',
        marginBottom: moderateScale(8),
        height: moderateScale(45),
        justifyContent: 'center',
        paddingHorizontal: moderateScale(10)
    },
    title: {
        color: '#33404F',
        fontFamily: FONTS.ProductSans.regular,
        fontSize: moderateScale(14),
        opacity: 0.7
    },
    content: {
        marginBottom: moderateScale(8)
    }
});

export default React.memo(FormSection);
