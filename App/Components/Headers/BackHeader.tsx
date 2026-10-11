import { Pressable, StyleSheet, Text, View } from 'react-native';
import React from 'react';
import { AppBar, Icon, useTheme } from 'react-native-basic-elements';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { moderateScale } from '../../Constants/PixelRatio';
import { FONTS } from '../../Constants/Fonts';
import NavigationService from '../../Services/Navigation';
import AppStatusBar from '../AppStatusBar';

type Props = {
    title: string;
    showBack?: boolean;
};

const titleStyle = {
    fontFamily: FONTS.ProductSans.bold,
    fontSize: moderateScale(18)
};

const BackHeader: React.FC<Props> = ({ title, showBack = true }) => {
    const colors = useTheme();
    const insets = useSafeAreaInsets();

    if (!showBack) {
        return (
            // <View style={{ paddingTop: insets.top }}>
                <AppBar
                    title={title}
                    titlePosition="left"
                    titleStyle={{
                        ...titleStyle,
                        color: colors?.buttonColor ?? '#000000'
                    }}
                />
            // </View>
        );
    }
    return (
        <View style={{ paddingTop: insets.top }}>
            <AppStatusBar />
            <View style={{flexDirection:'row', justifyContent:'center',alignItems:'center'}}>
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
                <Text style={{...titleStyle,color: colors?.buttonColor ?? '#000000'}}>{title}</Text>
            </View>
        </View>
        // <View style={{ paddingTop: insets.top }}>
        //     <AppBar.Back
        //         title={title}
        //         titlePosition="left"
        //         icon={{
        //             name: 'chevron-left',
        //             type: 'Feather',
        //             size: moderateScale(22),
        //             color: colors?.buttonColor ?? '#000000'
        //         }}
        //         titleStyle={{
        //             ...titleStyle,
        //             color: colors?.buttonColor ??'#000000'
        //         }}
        //         onLeftIconPress={() => NavigationService.back()}
        //     />
        // </View>
    );
};

export default BackHeader;

const styles = StyleSheet.create({
    backBtn: {
        height: moderateScale(32),
        width: moderateScale(32),
        
        justifyContent: 'center',
        alignItems: 'flex-start',
        marginLeft: moderateScale(16),
        marginVertical: moderateScale(8)
    }
});
