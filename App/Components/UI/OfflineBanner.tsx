import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-basic-elements';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNetworkStatus } from '../../core/hooks/useNetworkStatus';
import { FONTS } from '../../Constants/Fonts';
import { moderateScale } from '../../Constants/PixelRatio';

const OfflineBanner = () => {
    const { isOnline } = useNetworkStatus();
    const insets = useSafeAreaInsets();

    if (isOnline) {
        return null;
    }

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <Text style={styles.text}>
                You are offline. Some actions may be unavailable.
            </Text>
        </View>
    );
};

export default OfflineBanner;

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#B42318',
        paddingHorizontal: moderateScale(16),
        paddingBottom: moderateScale(10)
    },
    text: {
        color: '#FFFFFF',
        fontFamily: FONTS.ProductSans.regular,
        fontSize: moderateScale(12),
        textAlign: 'center'
    }
});