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
import { THEME } from '../../Constants/Theme';

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

    const createArcPath = (startAngle: number, endAngle: number, arcRadius: number) => {
        const x1 = arcRadius + arcRadius * Math.cos((Math.PI * startAngle) / 180);
        const y1 = arcRadius - arcRadius * Math.sin((Math.PI * startAngle) / 180);
        const x2 = arcRadius + arcRadius * Math.cos((Math.PI * endAngle) / 180);
        const y2 = arcRadius - arcRadius * Math.sin((Math.PI * endAngle) / 180);

        const path = `M ${x1} ${y1} A ${arcRadius} ${arcRadius} 0 0 1 ${x2} ${y2}`;
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
                style={[
                    styles.overlay,
                    { height: radius, width: size }
                ]}
            >
                <Text style={styles.modeLabel}>Mode</Text>
                <Text style={styles.modeName}>{modeName}</Text>
                <AppButton
                    title="Change Your Status"
                    style={{
                        width:
                            width -
                            (strokeWidth + moderateScale(20) + moderateScale(18)) * 2,
                        backgroundColor: THEME.colors.accent,
                        marginBottom: moderateScale(2),
                        borderRadius: THEME.radius.pill
                    }}
                    textStyle={styles.ctaText}
                    onPress={onPressStatusChange}
                />
            </View>
        </View>
    );
};

export default ArcProgressIndicator;

const styles = StyleSheet.create({
    overlay: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: moderateScale(8),
        zIndex: 99999
    },
    modeLabel: {
        fontFamily: FONTS.ProductSans.regular,
        fontSize: moderateScale(11),
        color: THEME.colors.textAccent,
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        opacity: 0.85
    },
    modeName: {
        fontFamily: FONTS.ProductSans.bold,
        fontSize: moderateScale(24),
        color: THEME.colors.textOnDark,
        letterSpacing: 0.3
    },
    ctaText: {
        color: THEME.colors.textOnDark,
        fontFamily: FONTS.ProductSans.bold,
        fontSize: moderateScale(14)
    }
});