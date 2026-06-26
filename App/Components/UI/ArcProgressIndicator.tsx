import {
    ColorValue,
    Dimensions,
    StyleProp,
    StyleSheet,
    View,
    ViewStyle
} from 'react-native';
import React from 'react';
import Svg, { G, Path } from 'react-native-svg';
import { AppButton, Text } from 'react-native-basic-elements';
import { moderateScale } from '../../Constants/PixelRatio';
import { FONTS } from '../../Constants/Fonts';

type Props = {
    size?: number;
    colors?: [ColorValue, ColorValue, ColorValue];
    strokeWidth?: number;
    containerStyle?: StyleProp<ViewStyle>;
    selectedArc?: 0 | 1 | 2 | 3;
    selectedArcColor?: ColorValue;
    overlayColor?: ColorValue;
    onPressStatusChange: () => void;
    modeName: string
};

const { width } = Dimensions.get('window');
const ArcProgressIndicator: React.FC<Props> = ({
    size = 300,
    colors = ['#ADD8E6', '#4CAF50', '#0000FF'],
    strokeWidth = 30,
    containerStyle,
    selectedArc,
    selectedArcColor = '#0000FF',
    overlayColor = '#00FF00',
    onPressStatusChange,
    modeName
}) => {
    const radius = size / 2;

    // Create arc path
    const createArcPath = (startAngle: number, endAngle: number, radius: number) => {
        // const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
        const x1 = radius + radius * Math.cos((Math.PI * startAngle) / 180);
        const y1 = radius - radius * Math.sin((Math.PI * startAngle) / 180);
        const x2 = radius + radius * Math.cos((Math.PI * endAngle) / 180);
        const y2 = radius - radius * Math.sin((Math.PI * endAngle) / 180);

        const path = `M ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2}`;
        // console.log('path', path);
        return path;
    };

    const getTranslate = (arcNumber: typeof selectedArc) => {
        switch (arcNumber) {
            case 1:
                return {
                    translateX: -15,
                    translateY: 0,
                    rotation: -2
                };

            case 2:
                return {
                    translateX: 0,
                    translateY: -10,
                    rotation: 0
                };

            case 3:
                return {
                    translateX: 10,
                    translateY: -10,
                    rotation: 0
                };
        }
    };

    return (
        <View
            style={[
                {
                    height: radius,
                    overflow: 'hidden',
                    alignItems: 'center'
                },
                containerStyle
            ]}
        >
            <Svg
                width={size + 10}
                height={size + 10}
                viewBox={`-${strokeWidth / 2 + 15} -${strokeWidth / 2 + 10} ${
                    size + 30
                } ${size + 30}`}
                // style={{
                //     backgroundColor: 'yellow'
                // }}
            >
                <G>
                    <Path
                        d={createArcPath(180, 120, radius - strokeWidth / 2)}
                        stroke={selectedArc === 1 ? selectedArcColor : colors[0]}
                        strokeWidth={strokeWidth}
                        fill="none"
                    />

                    <Path
                        d={createArcPath(120, 60, radius - strokeWidth / 2)}
                        stroke={selectedArc === 2 ? selectedArcColor : colors[1]}
                        strokeWidth={strokeWidth}
                        fill="none"
                    />

                    <Path
                        d={createArcPath(60, 0, radius - strokeWidth / 2)}
                        stroke={selectedArc === 3 ? selectedArcColor : colors[2]}
                        strokeWidth={strokeWidth}
                        fill="none"
                    />

                    {selectedArc ? (
                        <Path
                            d={createArcPath(
                                180 - 60 * (selectedArc - 1) - 3,
                                Math.abs(180 - 60 * selectedArc - 1),
                                radius - strokeWidth / 2
                            )}
                            stroke={overlayColor}
                            strokeWidth={strokeWidth}
                            fill="none"
                            {...getTranslate(selectedArc)}
                        />
                    ) : null}
                </G>
            </Svg>

            <View
                style={{
                    height: radius,
                    width: size,
                    position: 'absolute',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    gap: moderateScale(10),
                    zIndex: 99999
                }}
            >
                <Text
                    style={{
                        fontFamily: FONTS.ProductSans.regular,
                        fontSize: moderateScale(12),
                        color: '#8996A6'
                    }}
                >
                    Mode
                </Text>
                <Text
                    style={{
                        fontFamily: FONTS.ProductSans.regular,
                        fontSize: moderateScale(22),
                        color: '#FFFFFF'
                    }}
                >
                    {modeName}
                </Text>
                <AppButton
                    title="Change Your Status"
                    style={{
                        width:
                            width -
                            (strokeWidth + moderateScale(20) + moderateScale(18)) * 2,
                        backgroundColor: '#F3C522',
                        marginBottom: moderateScale(2)
                    }}
                    textStyle={{
                        color: '#FFFFFF',
                        fontFamily: FONTS.ProductSans.regular,
                        fontSize: moderateScale(15)
                    }}
                    onPress={onPressStatusChange}
                />
            </View>
        </View>
    );
};

export default ArcProgressIndicator;

const styles = StyleSheet.create({});
