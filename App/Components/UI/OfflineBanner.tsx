import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon, Text } from 'react-native-basic-elements';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNetworkStatus } from '../../core/hooks/useNetworkStatus';
import { FONTS } from '../../Constants/Fonts';
import { moderateScale } from '../../Constants/PixelRatio';
import { THEME } from '../../Constants/Theme';

const OfflineBanner = () => {
    const { isOnline } = useNetworkStatus();
    const insets = useSafeAreaInsets();

    if (isOnline) {
        return null;
    }

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <Icon
                name="cloud-offline-outline"
                type="Ionicon"
                size={moderateScale(14)}
                color={THEME.colors.textOnDark}
            />
            <Text style={styles.text}>
                You are offline. Some actions may be unavailable.
            </Text>
        </View>
    );
};

export default OfflineBanner;

const styles = StyleSheet.create({
    container: {
        backgroundColor: THEME.colors.offline,
        paddingHorizontal: moderateScale(16),
        paddingBottom: moderateScale(10),
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: moderateScale(8)
    },
    text: {
        color: THEME.colors.textOnDark,
        fontFamily: FONTS.ProductSans.regular,
        fontSize: moderateScale(12)
    }
});