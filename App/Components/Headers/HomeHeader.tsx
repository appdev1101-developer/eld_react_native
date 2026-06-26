import {
    AppState,
    AppStateStatus,
    DeviceEventEmitter,
    Image,
    Pressable,
    StyleSheet,
    View
} from 'react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { moderateScale } from '../../Constants/PixelRatio';
import NavigationService from '../../Services/Navigation';
import { Icon, useTheme } from 'react-native-basic-elements';
import GeoDataBackgroundService from '../../Utils/GeoDataService';
import { resetEldConnectionTracking } from '../../Utils/EldConnectionBeep';

const DATA_STALE_MS = 15_000;
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
    const [isBluetoothConnected, setIsBluetoothConnected] = useState(false);
    const lastDataTimeRef = useRef(0);

    const refreshConnectionStatus = useCallback(async () => {
        const savedAddress = await GeoDataBackgroundService.getSavedDeviceAddress();
        if (!savedAddress) {
            lastDataTimeRef.current = 0;
            resetEldConnectionTracking();
            setIsBluetoothConnected(false);
            return;
        }

        const elapsed = Date.now() - lastDataTimeRef.current;
        const hasRecentData =
            lastDataTimeRef.current > 0 && elapsed <= DATA_STALE_MS;
        setIsBluetoothConnected(hasRecentData);
    }, []);

    useEffect(() => {
        const geoDataListener = DeviceEventEmitter.addListener('GeometrisData', () => {
            lastDataTimeRef.current = Date.now();
            setIsBluetoothConnected(true);
        });

        refreshConnectionStatus();

        const staleCheckInterval = setInterval(refreshConnectionStatus, 5000);

        const appStateListener = AppState.addEventListener(
            'change',
            (state: AppStateStatus) => {
                if (state === 'active') {
                    refreshConnectionStatus();
                }
            }
        );

        return () => {
            geoDataListener.remove();
            clearInterval(staleCheckInterval);
            appStateListener.remove();
        };
    }, [refreshConnectionStatus]);

    useFocusEffect(
        useCallback(() => {
            refreshConnectionStatus();
        }, [refreshConnectionStatus])
    );

    const iconColor = theme === 'dark' ? '#fff' : colors.buttonColor;

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
                            backgroundColor: isBluetoothConnected ? '#22C55E' : '#EF4444',
                            borderColor:
                                theme === 'dark'
                                    ? 'rgba(255, 255, 255, 0.35)'
                                    : 'rgba(0, 0, 0, 0.15)'
                        }
                    ]}
                    accessibilityLabel={
                        isBluetoothConnected
                            ? 'Bluetooth device connected'
                            : 'Bluetooth device disconnected'
                    }
                />
            </View>
            <View
                style={{
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                    overflow: 'hidden'
                }}
            >
                <Image
                    source={
                        theme === 'dark'
                            ? require('../../Assets/logo-long.png')
                            : require('../../Assets/logo-long.png')
                    }
                    style={{
                        height: moderateScale(25),
                        resizeMode: 'contain'
                    }}
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
                            style={{
                                width: moderateScale(20),
                                resizeMode: 'contain',
                                tintColor: iconColor
                            }}
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
        height: moderateScale(35),
        // marginTop: moderateScale(5),
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: moderateScale(10)
    },
    sideSlot: {
        flexDirection: 'row',
        alignItems: 'center',
        minWidth: moderateScale(28),
        justifyContent: 'flex-start'
    },
    sideSlotWithBack: {
        gap: moderateScale(6)
    },
    bluetoothDot: {
        width: moderateScale(10),
        height: moderateScale(10),
        borderRadius: moderateScale(5),
        borderWidth: 1
    }
});
