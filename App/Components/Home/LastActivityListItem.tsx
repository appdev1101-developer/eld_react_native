import { StyleSheet, View } from 'react-native';
import React from 'react';
import { ActivityDataType } from '../../Screens/Home';
import { moderateScale } from '../../Constants/PixelRatio';
import { Icon, Text } from 'react-native-basic-elements';
import { FONTS } from '../../Constants/Fonts';
import moment from 'moment';

type Props = {
    item: ActivityDataType;
};
const LastActivityListItem: React.FC<Props> = ({ item }) => {
    return (
        <View style={styles.container}>
            <View
                style={[
                    styles.caretContainer,
                    {
                        backgroundColor: item.price >= 0 ? '#00DDA3' : '#33404F'
                    }
                ]}
            >
                <Icon
                    name={item.price >= 0 ? 'caretup' : 'caretdown'}
                    type="AntDesign"
                    color={'#FFFFFF'}
                    size={18}
                />
            </View>

            <View style={styles.titleSubTitleContainer}>
                <Text style={styles.titleStyle}>{item.title}</Text>
                <Text style={styles.subTitleStyle}>{item.subTitle}</Text>
            </View>

            <View style={styles.priceContainer}>
                <Text style={styles.titleStyle}>{item.price.toFixed(2)}</Text>
                <Text style={styles.subTitleStyle}>
                    {moment(item.date).format('MMM DD')}
                </Text>
            </View>
        </View>
    );
};

export default LastActivityListItem;

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        marginHorizontal: moderateScale(18) + 15,
        height: moderateScale(60),
        alignItems: 'center'
    },
    caretContainer: {
        height: moderateScale(30),
        width: moderateScale(30),
        borderRadius: moderateScale(15),
        justifyContent: 'center',
        alignItems: 'center'
    },
    titleSubTitleContainer: {
        flex: 1,
        gap: moderateScale(3),
        marginHorizontal: moderateScale(15)
    },
    titleStyle: {
        fontFamily: FONTS.ProductSans.regular,
        textTransform: 'capitalize',
        fontSize: moderateScale(13)
    },
    subTitleStyle: {
        fontFamily: FONTS.ProductSans.regular,
        textTransform: 'capitalize',
        fontSize: moderateScale(9),
        opacity: 0.5
    },
    priceContainer: {
        gap: moderateScale(3),
        alignItems: 'flex-end'
    }
});
