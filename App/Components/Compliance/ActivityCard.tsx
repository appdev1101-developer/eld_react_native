import { Pressable, StyleSheet, Text, View } from 'react-native';
import React from 'react';
import { moderateScale } from '../../Constants/PixelRatio';
import { CheckBox, Icon } from 'react-native-basic-elements';
import moment from 'moment-timezone';
import { FONTS } from '../../Constants/Fonts';
import { useSelector } from 'react-redux';
import { RootState } from '../../Redux/store';

type Props = {
    date: string;
    totalShiftTime: string;
    onPress?: () => void;
};

const ActivityCard: React.FC<Props> = ({ date, totalShiftTime, onPress }) => {
    const { configData } = useSelector((state: RootState) => state.User);

    return (
        <Pressable
            style={{
                marginHorizontal: moderateScale(15),
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: moderateScale(10),
                marginTop: moderateScale(15)
            }}
            onPress={onPress}
        >
            <CheckBox
                size={moderateScale(18)}
                containerStyle={{
                    borderWidth: 0.8
                }}
            />
            <View
                style={{
                    flex: 1,
                    marginLeft: moderateScale(15)
                }}
            >
                <Text
                    style={{
                        color: '#33404F',
                        fontFamily: FONTS.ProductSans.regular,
                        textTransform: 'uppercase',
                        fontSize: moderateScale(15)
                    }}
                >
                    <Text
                        style={{
                            fontFamily: FONTS.ProductSans.bold
                        }}
                    >
                        {moment.tz(date, configData?.timezone ?? '').format('dddd')}{' '}
                    </Text>
                    {moment.tz(date, configData?.timezone ?? '').format('YYYY-MM-DD')}
                </Text>

                <View
                    style={{
                        flexDirection: 'row',
                        marginVertical: 5
                    }}
                >
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            flex: 1
                        }}
                    >
                        <Icon
                            name="clock"
                            type="Feather"
                        />
                        <Text
                            style={{
                                fontFamily: FONTS.ProductSans.regular,
                                fontSize: moderateScale(12),
                                marginLeft: moderateScale(5)
                            }}
                        >
                            {totalShiftTime}
                        </Text>
                    </View>

                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            flex: 1
                        }}
                    >
                        <Icon
                            name="tool"
                            type="Feather"
                        />
                        <Text
                            style={{
                                fontFamily: FONTS.ProductSans.regular,
                                fontSize: moderateScale(12),
                                marginLeft: moderateScale(5)
                            }}
                        >
                            No Inspection
                        </Text>
                    </View>
                </View>
            </View>
            {onPress ? (
                <Icon
                    name="chevron-right"
                    type="Feather"
                    size={moderateScale(22)}
                />
            ) : null}
        </Pressable>
    );
};

export default ActivityCard;
