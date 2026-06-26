import { Pressable, StyleSheet, View } from 'react-native';
import React from 'react';
import { Icon, useTheme } from 'react-native-basic-elements';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppStatusBar from '../AppStatusBar';
import NavigationService from '../../Services/Navigation';
import { moderateScale } from '../../Constants/PixelRatio';

const AuthHeader = () => {
    const colors = useTheme();
    const insets = useSafeAreaInsets();
    return (
        <View style={{ paddingTop: insets.top }}>
            <AppStatusBar />

            <Pressable
                style={styles.backBtn}
                onPress={() => NavigationService.back()}
            >
                <Icon
                    name="chevron-back"
                    type="Ionicon"
                    size={22}
                    color={colors.primaryFontColor}
                />
            </Pressable>
        </View>
    );
};

export default AuthHeader;

const styles = StyleSheet.create({
    backBtn: {
        height: moderateScale(32),
        width: moderateScale(32),
        borderWidth: 1,
        borderColor: '#E8ECF4',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 22,
        marginVertical: moderateScale(8)
    }
});
