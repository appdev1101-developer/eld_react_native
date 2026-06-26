import { StyleSheet, View } from 'react-native';
import React from 'react';
import { moderateScale } from '../../Constants/PixelRatio';
import { Card, Icon, Text } from 'react-native-basic-elements';
import { FONTS } from '../../Constants/Fonts';

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
            <View
                style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}
            >
                <Text style={styles.title}>{title}</Text>
                <Icon
                    name="arrowright"
                    type="AntDesign"
                    color={'#14AE5C'}
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
                        <View
                            style={{
                                backgroundColor: '#FA17401F',
                                height: moderateScale(29),
                                minWidth: moderateScale(29),
                                paddingHorizontal: moderateScale(6),
                                justifyContent: 'center',
                                alignItems: 'center',
                                borderRadius: moderateScale(5)
                            }}
                        >
                            <Text
                                style={{
                                    fontFamily: FONTS.ProductSans.regular,
                                    color: '#FA1740',
                                    fontSize: moderateScale(15),
                                    textAlign: 'center'
                                }}
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
        backgroundColor: '#EFEFEF',
        margin: moderateScale(10),
        borderRadius: moderateScale(5),
        paddingHorizontal: moderateScale(7),
        paddingVertical: moderateScale(10)
    },
    title: {
        fontSize: moderateScale(16),
        fontFamily: FONTS.ProductSans.regular,
        textTransform: 'capitalize'
    },
    itemTitle: {
        color: '#33404F',
        fontSize: moderateScale(13),
        fontFamily: FONTS.ProductSans.regular,
        textTransform: 'capitalize'
    },
    card: {
        flexDirection: 'row',
        // justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: moderateScale(10)
    }
});
