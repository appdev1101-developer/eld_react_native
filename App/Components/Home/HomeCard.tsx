import { StyleSheet, ViewStyle } from 'react-native';
import React, { ReactNode } from 'react';
import { moderateScale } from '../../Constants/PixelRatio';
import { THEME } from '../../Constants/Theme';
import { AppCard } from '../UI';

type Props = {
    children?: ReactNode;
    style?: ViewStyle;
    onPress?: () => void;
};

const HomeCard: React.FC<Props> = ({ children, style, onPress }) => {
    return (
        <AppCard
            variant="elevated"
            padding="sm"
            onPress={onPress}
            style={{ ...styles.cardStyle, ...style }}
        >
            {children}
        </AppCard>
    );
};

export default HomeCard;

const styles = StyleSheet.create({
    cardStyle: {
        height: moderateScale(130),
        width: '32%',
        borderRadius: THEME.radius.lg,
        alignItems: 'center',
        paddingTop: moderateScale(20)
    }
});