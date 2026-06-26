import { StyleSheet, View } from 'react-native';
import React from 'react';
import { AppBar, useTheme } from 'react-native-basic-elements';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { moderateScale } from '../../Constants/PixelRatio';
import { FONTS } from '../../Constants/Fonts';
import NavigationService from '../../Services/Navigation';

type Props = {
    title: string;
    showBack?: boolean;
};

const titleStyle = {
    fontFamily: FONTS.ProductSans.regular,
    fontSize: moderateScale(16)
};

const BackHeader: React.FC<Props> = ({ title, showBack = true }) => {
    const colors = useTheme();
    const insets = useSafeAreaInsets();

    if (!showBack) {
        return (
            <View style={{ paddingTop: insets.top }}>
                <AppBar
                    title={title}
                    titlePosition="left"
                    titleStyle={{
                        ...titleStyle,
                        color: colors.buttonColor
                    }}
                />
            </View>
        );
    }

    return (
        <View style={{ paddingTop: insets.top }}>
            <AppBar.Back
                title={title}
                titlePosition="left"
                icon={{
                    name: 'chevron-left',
                    type: 'Feather',
                    size: moderateScale(22),
                    color: colors.buttonColor
                }}
                titleStyle={{
                    ...titleStyle,
                    color: colors.buttonColor
                }}
                onLeftIconPress={() => NavigationService.back()}
            />
        </View>
    );
};

export default BackHeader;

const styles = StyleSheet.create({});
