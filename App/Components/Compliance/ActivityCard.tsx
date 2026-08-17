import { Pressable, StyleSheet, Text, View } from 'react-native';
import React from 'react';
import { moderateScale } from '../../Constants/PixelRatio';
import { CheckBox, Icon } from 'react-native-basic-elements';
import moment from 'moment-timezone';
import { FONTS } from '../../Constants/Fonts';
import { useAppConfig } from '../../core/hooks/useAppConfig';
import Util from '../../Utils/util';

type Props = {
    date: string;
    totalShiftTime: string;
    isInspectionPending: boolean; // true if inspection is already exist otherwise false means no inspection
    onPress?: () => void;
    /**
     * Day-cycling controls, rendered as small arrow buttons at the card's
     * corners — separate from `onPress`. Omit both to render the card
     * exactly as before (used by the "Last 7 days" list, which still just
     * navigates to SingleActivity on tap, no cycling).
     */
    onPrevious?: () => void;
    onNext?: () => void;
    disablePrevious?: boolean;
    disableNext?: boolean;
};

const ActivityCard: React.FC<Props> = ({ date, 
    totalShiftTime,
    isInspectionPending, 
    onPress,
    onPrevious,
    onNext,
    disablePrevious,
    disableNext }) => {
    //const { configData } = useSelector((state: RootState) => state.User);
    const { configData } = useAppConfig();

    return (

         <View style={styles.wrapper}>
            {onPrevious ? (
                <Pressable
                    onPress={onPrevious}
                    disabled={disablePrevious}
                    hitSlop={moderateScale(10)}
                    style={[styles.cornerArrow, styles.cornerArrowLeft]}
                >
                    <Icon
                        name="chevron-left"
                        type="Feather"
                        size={moderateScale(18)}
                        color={disablePrevious ? '#C4C4C4' : '#33404F'}
                    />
                </Pressable>
            ) : null}
 
            {onNext ? (
                <Pressable
                    onPress={onNext}
                    disabled={disableNext}
                    hitSlop={moderateScale(10)}
                    style={[styles.cornerArrow, styles.cornerArrowRight]}
                >
                    <Icon
                        name="chevron-right"
                        type="Feather"
                        size={moderateScale(18)}
                        color={disableNext ? '#C4C4C4' : '#33404F'}
                    />
                </Pressable>
            ) : null}
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
                            {Util.convertToDayFormat(date,configData?.timezone)}{' '}
                        </Text>
                        <Text style={{
                                paddingLeft: moderateScale(8),
                                color: '#33404F',
                                fontFamily: FONTS.ProductSans.regular,
                                fontSize: moderateScale(15),

                                
                            }}>
                           {Util.convertToMonthFormat(date,configData?.timezone)}
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
                                {Util.convertToTimeFormat(totalShiftTime)}
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
                {(onPress && !onPrevious) ? (
                    <Icon
                        name="chevron-right"
                        type="Feather"
                        size={moderateScale(22)}
                    />
                ) : null}
                </View>
                {/* Full-width divider */}
                {!onPrevious ? <View
                    style={{
                        height: 0.5,
                        backgroundColor: '#D9D9D9',
                    }}
                /> : null}
            </Pressable>
         </View>
        
        
    );
};

export default ActivityCard;


const styles = StyleSheet.create({
    wrapper: {
        position: 'relative'
    },
    cornerArrow: {
        position: 'absolute',
        top: moderateScale(12),
        zIndex: 1,
        padding: moderateScale(4)
    },
    cornerArrowLeft: {
        left: 0
    },
    cornerArrowRight: {
        right: 0
    }
});