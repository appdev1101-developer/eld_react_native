import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import React, { ReactNode } from 'react';
import { Card } from 'react-native-basic-elements';
import { moderateScale } from '../../Constants/PixelRatio';

type Props = {
    children?: ReactNode;
    style?: ViewStyle;
    onPress?: () => void;
};
const HomeCard: React.FC<Props> = ({ children, style, onPress }) => {
    return (
        <Card
            style={{ ...styles.cardStyle, ...style }}
            onPress={onPress}
        >
            {children}
        </Card>
    );
};

export default HomeCard;

const styles = StyleSheet.create({
    cardStyle: {
        height: moderateScale(130),
        width: '31%',
        borderRadius: moderateScale(16),
        alignItems: 'center',
        paddingHorizontal: moderateScale(2),
        paddingTop: moderateScale(23)
    }
});
