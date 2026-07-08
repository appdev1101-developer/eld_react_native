import React, { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { Card } from 'react-native-basic-elements';
import {
    CardPadding,
    CardVariant,
    getCardStyles
} from '../../Constants/ui';

type Props = {
    children: ReactNode;
    variant?: CardVariant;
    padding?: CardPadding;
    onPress?: () => void;
    style?: ViewStyle;
};

const AppCard: React.FC<Props> = ({
    children,
    variant = 'elevated',
    padding = 'md',
    onPress,
    style
}) => {
    const preset = getCardStyles(variant, padding);

    if (onPress) {
        return (
            <Card
                style={StyleSheet.flatten([preset.container, style])}
                onPress={onPress}
            >
                {children}
            </Card>
        );
    }

    return (
        <View style={StyleSheet.flatten([preset.container, style])}>
            {children}
        </View>
    );
};

export default AppCard;