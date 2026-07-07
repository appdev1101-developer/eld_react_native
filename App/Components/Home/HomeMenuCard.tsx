import { StyleSheet, View } from 'react-native';
import React from 'react';
import { moderateScale } from '../../Constants/PixelRatio';
import { Card, Icon, Text } from 'react-native-basic-elements';
import { FONTS } from '../../Constants/Fonts';
import { THEME } from '../../Constants/Theme';

type ListItemProps = {
    title: string;
    onPress: () => void;
    count?: number;
};

type Props = {
    title: string;
    listItems: Array<ListItemProps>;
    onRightIconPress?: () => void;
    footerComponent?: React.ReactNode;
};
const HomeMenuCard: React.FC<Props> = ({
    title,
    listItems,
    onRightIconPress = () => {},
    footerComponent
}) => {
    return (
        <View style={styles.container}>
            <View style={styles.headerRow}>
                <Text style={styles.title}>{title}</Text>
                <Icon
                    name="arrowright"
                    type="AntDesign"
                    color={THEME.colors.success}
                    size={moderateScale(18)}
                    onPress={onRightIconPress}
                />
            </View>

            {listItems.map((item, index) => (
                <Card
                    style={styles.card}
                    key={index}
                    onPress={item.onPress}
                >
                    <View style={{ flex: 1 }}>
                        <Text style={styles.itemTitle}>{item.title}</Text>
                    </View>

                    {item.count != undefined ? (
                        <View style={styles.badge}>
                            <Text
                                style={styles.badgeText}
                                numberOfLines={1}
                                adjustsFontSizeToFit={true}
                                minimumFontScale={0.8}
                            >
                                {item.count}
                            </Text>
                        </View>
                    ) : null}

                    <Icon
                        name="chevron-right"
                        type="Entypo"
                        size={moderateScale(22)}
                        color={THEME.colors.textMuted}
                    />
                </Card>
            ))}

            {footerComponent ?? null}
        </View>
    );
};

export default HomeMenuCard;

const styles = StyleSheet.create({
    container: {
        backgroundColor: THEME.colors.surface,
        margin: moderateScale(10),
        borderRadius: THEME.radius.md,
        paddingHorizontal: moderateScale(12),
        paddingVertical: moderateScale(14),
        borderWidth: 1,
        borderColor: THEME.colors.borderLight,
        ...THEME.shadow.card
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: moderateScale(4)
    },
    title: {
        fontSize: moderateScale(17),
        fontFamily: FONTS.ProductSans.bold,
        color: THEME.colors.textPrimary,
        textTransform: 'capitalize',
        letterSpacing: 0.2
    },
    itemTitle: {
        color: THEME.colors.textPrimary,
        fontSize: moderateScale(13),
        fontFamily: FONTS.ProductSans.regular,
        textTransform: 'capitalize'
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: moderateScale(10),
        backgroundColor: THEME.colors.surfaceMuted,
        borderRadius: THEME.radius.sm,
        paddingVertical: moderateScale(8),
        paddingHorizontal: moderateScale(10)
    },
    badge: {
        backgroundColor: THEME.colors.badgeMuted,
        height: moderateScale(29),
        minWidth: moderateScale(29),
        paddingHorizontal: moderateScale(6),
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: THEME.radius.pill
    },
    badgeText: {
        fontFamily: FONTS.ProductSans.bold,
        color: THEME.colors.badge,
        fontSize: moderateScale(14),
        textAlign: 'center'
    }
});