import { StyleSheet, ViewStyle } from 'react-native';
import React, { ReactNode } from 'react';
import { Card } from 'react-native-basic-elements';
import { moderateScale } from '../../Constants/PixelRatio';
import { THEME } from '../../Constants/Theme';

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
        borderRadius: THEME.radius.lg,
        alignItems: 'center',
        paddingHorizontal: moderateScale(4),
        paddingTop: moderateScale(20),
        backgroundColor: THEME.colors.surface,
        borderWidth: 1,
        borderColor: THEME.colors.borderLight,
        ...THEME.shadow.card
    }
});