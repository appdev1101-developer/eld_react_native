import { StyleSheet, Text, View } from 'react-native';
import React from 'react';
import { Card } from 'react-native-basic-elements';
import { moderateScale } from '../../Constants/PixelRatio';
import HomeCard from './HomeCard';
import { FONTS } from '../../Constants/Fonts';

type Props = {
    driveTime: string;
    shiftTime: string;
    cycleTime: string;
};

const HOSDetails: React.FC<Props> = ({ driveTime, shiftTime, cycleTime }) => {
    return (
        <View style={styles.container}>
            <HomeCard style={{ gap: 5 }}>
                <View>
                    <Text
                        style={[
                            styles.cardText,
                            {
                                fontSize: moderateScale(27),
                                color: '#33404F'
                            }
                        ]}
                    >
                        {driveTime}
                    </Text>
                    <Text
                        style={[
                            styles.cardText,
                            {
                                fontSize: moderateScale(9),
                                textTransform: 'capitalize',
                                color: '#8E9093'
                            }
                        ]}
                    >
                        hrs
                    </Text>
                </View>
                <Text
                    style={[
                        styles.cardText,
                        {
                            fontSize: moderateScale(17),
                            color: '#000000'
                        }
                    ]}
                >
                    Drive
                </Text>
                <Text
                    style={[
                        styles.cardText,
                        {
                            fontSize: moderateScale(9),
                            color: '#8E9093'
                        }
                    ]}
                >
                    11-Hour Driving Limit
                </Text>
            </HomeCard>
            <HomeCard style={{ gap: 5 }}>
                <View>
                    <Text
                        style={[
                            styles.cardText,
                            {
                                fontSize: moderateScale(27),
                                color: '#33404F'
                            }
                        ]}
                    >
                        {shiftTime}
                    </Text>
                    <Text
                        style={[
                            styles.cardText,
                            {
                                fontSize: moderateScale(9),
                                textTransform: 'capitalize',
                                color: '#8E9093'
                            }
                        ]}
                    >
                        hrs
                    </Text>
                </View>
                <Text
                    style={[
                        styles.cardText,
                        {
                            fontSize: moderateScale(17),
                            color: '#000000'
                        }
                    ]}
                >
                    Shift
                </Text>
                <Text
                    style={[
                        styles.cardText,
                        {
                            fontSize: moderateScale(9),
                            color: '#8E9093'
                        }
                    ]}
                >
                    14-hours on Duty Limit
                </Text>
            </HomeCard>

            <HomeCard style={{ gap: 5 }}>
                <View>
                    <Text
                        style={[
                            styles.cardText,
                            {
                                fontSize: moderateScale(27),
                                color: '#33404F'
                            }
                        ]}
                    >
                        {cycleTime}
                    </Text>
                    <Text
                        style={[
                            styles.cardText,
                            {
                                fontSize: moderateScale(9),
                                textTransform: 'capitalize',
                                color: '#8E9093'
                            }
                        ]}
                    >
                        hrs
                    </Text>
                </View>
                <Text
                    style={[
                        styles.cardText,
                        {
                            fontSize: moderateScale(17),
                            color: '#000000'
                        }
                    ]}
                >
                    Cycle
                </Text>
                <Text
                    style={[
                        styles.cardText,
                        {
                            fontSize: moderateScale(9),
                            color: '#8E9093'
                        }
                    ]}
                >
                    70 hours cycle limit
                </Text>
            </HomeCard>
        </View>
    );
};

export default HOSDetails;

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: moderateScale(18) + 15,
        justifyContent: 'space-between',
        marginTop: moderateScale(15),
        zIndex: 2
    },
    cardText: {
        fontFamily: FONTS.ProductSans.regular,
        textAlign: 'center'
    }
});
