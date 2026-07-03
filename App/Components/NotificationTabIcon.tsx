import React, { useCallback, useEffect, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Text } from 'react-native-basic-elements';
import { moderateScale } from '../Constants/PixelRatio';
import { FONTS } from '../Constants/Fonts';
import { prefetchNotifications } from '../core/hooks/useNotifications';

type Props = {
    focused: boolean;
    color: string;
};

const NotificationTabIcon: React.FC<Props> = ({ focused, color }) => {
    const [unreadCount, setUnreadCount] = useState(0);

    const syncUnreadCount = useCallback(async () => {
        const count = await prefetchNotifications();
        setUnreadCount(count);
    }, []);

    useEffect(() => {
        syncUnreadCount();
    }, [syncUnreadCount]);

    useFocusEffect(
        useCallback(() => {
            syncUnreadCount();
        }, [syncUnreadCount])
    );

    return (
        <View style={styles.tabIconContainer}>
            <Image
                source={require('../Assets/TabIcon/Notification.png')}
                style={styles.icon}
                tintColor={color}
            />
            {unreadCount > 0 ? (
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </Text>
                </View>
            ) : null}
            {focused ? (
                <View style={[styles.focusIndicator, { backgroundColor: color }]} />
            ) : null}
        </View>
    );
};

export default NotificationTabIcon;

const styles = StyleSheet.create({
    tabIconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: moderateScale(4),
        minHeight: moderateScale(40),
        gap: moderateScale(4)
    },
    icon: {
        height: moderateScale(24),
        width: moderateScale(24),
        resizeMode: 'contain'
    },
    focusIndicator: {
        height: moderateScale(4),
        width: moderateScale(4),
        borderRadius: moderateScale(2),
        marginTop: moderateScale(2)
    },
    badge: {
        position: 'absolute',
        top: moderateScale(2),
        right: moderateScale(-4),
        minWidth: moderateScale(16),
        height: moderateScale(16),
        borderRadius: moderateScale(8),
        backgroundColor: '#FA1740',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: moderateScale(3)
    },
    badgeText: {
        color: '#FFFFFF',
        fontFamily: FONTS.ProductSans.bold,
        fontSize: moderateScale(9)
    }
});