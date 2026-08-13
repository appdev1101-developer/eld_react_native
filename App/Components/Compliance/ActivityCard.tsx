import { Pressable, StyleSheet, Text, View } from 'react-native';
import React from 'react';
import { moderateScale } from '../../Constants/PixelRatio';
import { CheckBox, Icon } from 'react-native-basic-elements';
import moment from 'moment-timezone';
import { FONTS } from '../../Constants/Fonts';
import { useAppConfig } from '../../core/hooks/useAppConfig';

type Props = {
    date: string;
    totalShiftTime: string;
    isInspectionPending: boolean; // true if inspection is already exist otherwise false means no inspection
    onPress?: () => void;
};

const ActivityCard: React.FC<Props> = ({ date, totalShiftTime,isInspectionPending, onPress }) => {
    //const { configData } = useSelector((state: RootState) => state.User);
    const { configData } = useAppConfig();

    return (
        <Pressable
            style={{
                marginHorizontal: moderateScale(15),
                marginTop: moderateScale(10)
            }}
            onPress={onPress}
        >
            {/* Row content */}
        <View
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: moderateScale(10),
            }}
        >
            {/* <CheckBox
                size={moderateScale(18)}
                containerStyle={{
                    borderWidth: 0.8
                }}
                
            /> */}
            <View
                style={{
                    flex: 1,
                    marginLeft: moderateScale(15)
                }}
            >
                <View
                    style={{
                        flexDirection: 'row',
                        marginVertical: 8
                    }}
                    >
                    <Text
                        style={{
                            color: '#33404F',
                            textTransform: 'uppercase',
                            fontSize: moderateScale(15),
                            fontFamily: FONTS.ProductSans.bold
                        }}
                    >
                        {moment.tz(date, configData?.timezone ?? '').format('dddd')}{' '}
                    </Text>
                    <Text style={{
                            color: '#33404F',
                            fontFamily: FONTS.ProductSans.regular,
                            fontSize: moderateScale(15)
                            
                        }}>
                        {"  "+moment.tz(date, configData?.timezone ?? '').format('YYYY-MM-DD')}
                    </Text>
                    
                
                </View>

                <View
                    style={{
                        flexDirection: 'row',
                        marginVertical: 8
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
                            size={moderateScale(12)}
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
                            size={moderateScale(12)}
                            color={isInspectionPending ? "green" : "black"}
                        />
                        <Text
                            style={{
                                fontFamily: FONTS.ProductSans.regular,
                                fontSize: moderateScale(12),
                                marginLeft: moderateScale(5)
                            }}
                        >
                            {isInspectionPending ? "Inspection Done" : "No Inspection"}
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
            </View>
            {/* Full-width divider */}
            <View
                style={{
                    height: 0.5,
                    backgroundColor: '#D9D9D9',
                }}
            />
        </Pressable>
    );
};

export default ActivityCard;
