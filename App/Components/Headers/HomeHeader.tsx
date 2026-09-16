import {
    Image,
    Pressable,
    StyleSheet,
    View
} from 'react-native';
import React from 'react';
import { useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { moderateScale } from '../../Constants/PixelRatio';
import NavigationService from '../../Services/Navigation';
import { Icon, useTheme } from 'react-native-basic-elements';

import { THEME } from '../../Constants/Theme';
import { useEldConnection } from '../../core/hooks/useEldConnection';
import { logger } from '../../core/logger';

const HOME_ROUTE_NAME = 'MainHome';

type Props = {
    theme?: 'light' | 'dark';
    showBack?: boolean;
    showMenu?: boolean;
};

const HomeHeader: React.FC<Props> = ({
    theme = 'dark',
    showBack,
    showMenu
}) => {
    const route = useRoute();
    const isHomePage = route.name === HOME_ROUTE_NAME;
    const shouldShowBack = showBack ?? !isHomePage;
    const menuVisible = showMenu ?? !shouldShowBack;
    const colors = useTheme();
    const insets = useSafeAreaInsets();
    const { isConnected: isBluetoothConnected} = useEldConnection();

    const iconColor = theme === 'dark' ? THEME.colors.textOnDark : colors.buttonColor;
    logger.log("<<<<<<< Bluetooth current status is >>>>> "+isBluetoothConnected);
    return (
        <View style={[styles.headerContainer, { marginTop: insets.top }]}>
            <View style={[styles.sideSlot, shouldShowBack && styles.sideSlotWithBack]}>
                {shouldShowBack ? (
                    <Pressable
                        onPress={() => NavigationService.back()}
                        hitSlop={10}
                        accessibilityLabel="Go back"
                    >
                        <Icon
                            name="chevron-left"
                            type="Feather"
                            size={moderateScale(22)}
                            color={iconColor}
                        />
                    </Pressable>
                ) : null}
                <View
                    style={[
                        styles.bluetoothDot,
                        {
                            backgroundColor: isBluetoothConnected
                                ? THEME.colors.success
                                : THEME.colors.error,
                            borderColor:
                                theme === 'dark'
                                    ? 'rgba(255, 255, 255, 0.4)'
                                    : THEME.colors.border
                        }
                    ]}
                    accessibilityLabel={
                        isBluetoothConnected
                            ? 'Bluetooth device connected'
                            : 'Bluetooth device disconnected — attempting to reconnect'
                    }
                />
            </View>
            <View style={styles.logoContainer}>
                <Image
                    source={require('../../Assets/logo-long.png')}
                    style={styles.logo}
                />
            </View>

            <View style={styles.sideSlot}>
                {menuVisible ? (
                    <Pressable
                        onPress={() => NavigationService.openDrawer()}
                        hitSlop={10}
                        accessibilityLabel="Open menu"
                    >
                        <Image
                            source={require('../../Assets/Icons/menu.png')}
                            style={[styles.menuIcon, { tintColor: iconColor }]}
                        />
                    </Pressable>
                ) : null}
            </View>
        </View>
    );
};

export default HomeHeader;

const styles = StyleSheet.create({
    headerContainer: {
        height: moderateScale(44),
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: moderateScale(12),
        paddingVertical: moderateScale(4)
    },
    sideSlot: {
        flexDirection: 'row',
        alignItems: 'center',
        minWidth: moderateScale(28),
        justifyContent: 'flex-start'
    },
    sideSlotWithBack: {
        gap: moderateScale(8)
    },
    bluetoothDot: {
        width: moderateScale(11),
        height: moderateScale(11),
        borderRadius: moderateScale(6),
        borderWidth: 1.5
    },
    logoContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden'
    },
    logo: {
        height: moderateScale(26),
        resizeMode: 'contain'
    },
    menuIcon: {
        width: moderateScale(20),
        resizeMode: 'contain'
    }
});