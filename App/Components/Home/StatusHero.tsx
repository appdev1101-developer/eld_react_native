import React, { useEffect, useMemo } from 'react';
import {
    Dimensions,
    Platform,
    StyleProp,
    StyleSheet,
    View,
    ViewStyle
} from 'react-native';
import Animated, {
    interpolateColor,
    useAnimatedProps,
    useAnimatedStyle,
    useSharedValue,
    withSequence,
    withTiming
} from 'react-native-reanimated';
import Svg, { G, Path } from 'react-native-svg';
import { Text } from 'react-native-basic-elements';
import {
    DEFAULT_STATUS_VISUAL,
    StatusDataType
} from '../../Constants/dutyStatus';
import { moderateScale } from '../../Constants/PixelRatio';
import { FONTS } from '../../Constants/Fonts';
import { THEME } from '../../Constants/Theme';
import { Button, DutyStatusIcon } from '../UI';

const AnimatedPath = Animated.createAnimatedComponent(Path);

type Props = {
    size?: number;
    strokeWidth?: number;
    containerStyle?: StyleProp<ViewStyle>;
    status?: StatusDataType;
    onPressStatusChange: () => void;
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const createArcPath = (
    startAngle: number,
    endAngle: number,
    arcRadius: number
): string => {
    const x1 = arcRadius + arcRadius * Math.cos((Math.PI * startAngle) / 180);
    const y1 = arcRadius - arcRadius * Math.sin((Math.PI * startAngle) / 180);
    const x2 = arcRadius + arcRadius * Math.cos((Math.PI * endAngle) / 180);
    const y2 = arcRadius - arcRadius * Math.sin((Math.PI * endAngle) / 180);
    return `M ${x1} ${y1} A ${arcRadius} ${arcRadius} 0 0 1 ${x2} ${y2}`;
};

const getActiveArcPath = (selectedArc: 1 | 2 | 3, radius: number, stroke: number) => {
    const arcRadius = radius - stroke / 2;
    const start = 180 - 60 * (selectedArc - 1) - 3;
    const end = Math.abs(180 - 60 * selectedArc - 1);
    return createArcPath(start, end, arcRadius);
};

const StatusHero: React.FC<Props> = ({
    size = SCREEN_WIDTH - moderateScale(18) * 2,
    strokeWidth = moderateScale(45),
    containerStyle,
    status,
    onPressStatusChange
}) => {
    const radius = size / 2;
    const arcRadius = radius - strokeWidth / 2;

    const visual = status
        ? {
              themeColor: status.themeColor,
              selectedArc: status.selectedArc,
              name: status.name,
              arcColors: status.arcColors,
              icon: status.icon
          }
        : {
              ...DEFAULT_STATUS_VISUAL,
              icon: undefined as StatusDataType['icon'] | undefined
          };

    const statusKey = status?.apiStatus ?? 'none';
    console.log(">>>> Status Key>>>>> "+status?.apiStatus);      
    const prevColor = useSharedValue(visual.themeColor);
    const nextColor = useSharedValue(visual.themeColor);
    const colorProgress = useSharedValue(1);
    const ringScale = useSharedValue(1);
    const contentOpacity = useSharedValue(1);
    const glowOpacity = useSharedValue(0.35);

    useEffect(() => {
        prevColor.value = nextColor.value;
        nextColor.value = visual.themeColor;
        colorProgress.value = 0;
        colorProgress.value = withTiming(1, { duration: 420 });

        ringScale.value = withSequence(
            withTiming(1.04, { duration: 160 }),
            withTiming(1, { duration: 240 })
        );

        glowOpacity.value = withSequence(
            withTiming(0.65, { duration: 160 }),
            withTiming(0.35, { duration: 300 })
        );

        contentOpacity.value = withSequence(
            withTiming(0.35, { duration: 120 }),
            withTiming(1, { duration: 280 })
        );
    }, [statusKey, visual.themeColor]);

    const activeArcProps = useAnimatedProps(() => ({
        stroke: interpolateColor(
            colorProgress.value,
            [0, 1],
            [prevColor.value, nextColor.value]
        )
    }));

    const ringAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: ringScale.value }]
    }));

    const glowAnimatedStyle = useAnimatedStyle(() => ({
        opacity: glowOpacity.value,
        backgroundColor: interpolateColor(
            colorProgress.value,
            [0, 1],
            [prevColor.value, nextColor.value]
        )
    }));

    const contentAnimatedStyle = useAnimatedStyle(() => ({
        opacity: contentOpacity.value
    }));

    const inactiveArcColors = visual.arcColors;
    const selectedArc = visual.selectedArc;

    const activeArcPath = useMemo(() => {
        if (!selectedArc) {
            return null;
        }
        return getActiveArcPath(selectedArc, radius, strokeWidth);
    }, [radius, selectedArc, strokeWidth]);

    const ctaWidth = size - moderateScale(24);
    console.log(">>>>> Current Status >>> "+visual.name);
    return (
        <View style={[styles.wrapper, containerStyle]}>
            <View
                style={[styles.arcContainer, { height: radius, width: size }]}
                pointerEvents="box-none"
            >
                <Animated.View
                    pointerEvents="none"
                    style={[
                        styles.glow,
                        {
                            width: size * 0.72,
                            height: size * 0.36,
                            borderRadius: size * 0.36,
                            top: radius * 0.12
                        },
                        glowAnimatedStyle
                    ]}
                />

                <Animated.View
                    pointerEvents="none"
                    style={[styles.ringLayer, ringAnimatedStyle]}
                >
                    <Svg
                        width={size}
                        height={radius + strokeWidth}
                        viewBox={`-${strokeWidth / 2 + 10} -${strokeWidth / 2 + 8} ${
                            size + 20
                        } ${radius + strokeWidth + 16}`}
                    >
                        <G>
                            <Path
                                d={createArcPath(180, 120, arcRadius)}
                                stroke={inactiveArcColors[0]}
                                strokeWidth={strokeWidth}
                                fill="none"
                                strokeLinecap="round"
                            />
                            <Path
                                d={createArcPath(120, 60, arcRadius)}
                                stroke={inactiveArcColors[1]}
                                strokeWidth={strokeWidth}
                                fill="none"
                                strokeLinecap="round"
                            />
                            <Path
                                d={createArcPath(60, 0, arcRadius)}
                                stroke={inactiveArcColors[2]}
                                strokeWidth={strokeWidth}
                                fill="none"
                                strokeLinecap="round"
                            />

                            {activeArcPath ? (
                                <AnimatedPath
                                    d={activeArcPath}
                                    strokeWidth={strokeWidth}
                                    fill="none"
                                    strokeLinecap="round"
                                    animatedProps={activeArcProps}
                                />
                            ) : null}
                        </G>
                    </Svg>
                </Animated.View>

                <Animated.View
                    pointerEvents="none"
                    style={[styles.statusContent, contentAnimatedStyle]}
                >
                    {visual.icon ? (
                        <View
                            style={[
                                styles.iconBadge,
                                { borderColor: visual.themeColor }
                            ]}
                        >
                            <DutyStatusIcon
                                name={visual.icon}
                                color={visual.themeColor}
                                size={moderateScale(26)}
                                strokeWidth={2.2}
                            />
                        </View>
                    ) : null}

                    <Text style={styles.modeLabel}>Current Status</Text>
                    <Text style={styles.modeName}>{visual.name}</Text>
                </Animated.View>
            </View>

            <View style={styles.ctaContainer}>
                <Button
                    title="Change Your Status"
                    variant="accent"
                    size="sm"
                    inset={false}
                    style={StyleSheet.flatten([
                        styles.ctaButton,
                        { width: ctaWidth }
                    ])}
                    textStyle={styles.ctaText}
                    onPress={onPressStatusChange}
                />
            </View>
        </View>
    );
};

export default StatusHero;

const styles = StyleSheet.create({
    wrapper: {
        alignItems: 'center',
        zIndex: 3
    },
    arcContainer: {
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'flex-end'
    },
    glow: {
        position: 'absolute',
        alignSelf: 'center',
        zIndex: 0
    },
    ringLayer: {
        position: 'absolute',
        top: 0,
        alignItems: 'center',
        zIndex: 1
    },
    statusContent: {
        alignItems: 'center',
        gap: moderateScale(4),
        paddingBottom: moderateScale(6),
        zIndex: 2
    },
    iconBadge: {
        height: moderateScale(44),
        width: moderateScale(44),
        borderRadius: moderateScale(22),
        borderWidth: 2,
        backgroundColor: 'rgba(255, 255, 255, 0.12)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: moderateScale(2)
    },
    modeLabel: {
        fontFamily: FONTS.ProductSans.regular,
        fontSize: moderateScale(11),
        color: THEME.colors.textAccent,
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        opacity: 0.9
    },
    modeName: {
        fontFamily: FONTS.ProductSans.bold,
        fontSize: moderateScale(24),
        color: THEME.colors.textOnDark,
        letterSpacing: 0.3
    },
    ctaContainer: {
        marginTop: moderateScale(12),
        alignItems: 'center',
        zIndex: 4,
        ...(Platform.OS === 'android' ? { elevation: 6 } : null)
    },
    ctaButton: {
        borderRadius: THEME.radius.pill
    },
    ctaText: {
        fontSize: moderateScale(13)
    }
});