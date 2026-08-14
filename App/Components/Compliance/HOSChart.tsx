import React, { useMemo } from 'react';
import { Dimensions, View } from 'react-native';
import Svg, { G, Line, Rect, Text } from 'react-native-svg';

import { moderateScale } from '../../Constants/PixelRatio';
import { HOS_CHART_COLORS, HOS_CHART_DEFAULTS, HOS_STATUS_ROWS, HOSChartProps } from '../../core/chart';
import { buildChartSegments, buildChartTransitions, buildViolationRects, ChartDimensions } from '../../Utils/hos_chart/hosChartGeometry';


const { width: SCREEN_WIDTH } = Dimensions.get('window');

const HOSChart: React.FC<HOSChartProps> = ({
    marginHorizontal = moderateScale(38),
    lineObject = [],
    violations = [],
    vehicleName,
}) => {
    const chartWidth = Math.max(
        moderateScale(220),
        SCREEN_WIDTH - marginHorizontal * 2
    );

    const dimensions = useMemo<ChartDimensions>(() => {
        const height = moderateScale(
            HOS_CHART_DEFAULTS.chartHeight
        );

        return {
            width: chartWidth,
            height,
            left: HOS_CHART_DEFAULTS.leftPadding,
            top: HOS_CHART_DEFAULTS.topPadding,
            bottom:
                HOS_CHART_DEFAULTS.topPadding +
                height,
            rowHeight: height / HOS_STATUS_ROWS.length,
        };
    }, [chartWidth]);

    const segments = useMemo(
        () => buildChartSegments(lineObject, dimensions),
        [lineObject, dimensions]
    );

    const transitions = useMemo(
        () => buildChartTransitions(lineObject, dimensions),
        [lineObject, dimensions]
    );

    const violationRects = useMemo(
        () => buildViolationRects(violations, dimensions),
        [violations, dimensions]
    );

    const svgWidth =
        dimensions.left +
        dimensions.width +
        moderateScale(4);

    const svgHeight =
        dimensions.bottom +
        HOS_CHART_DEFAULTS.bottomPadding;

    const hourWidth = dimensions.width / 24;
    const quarterWidth = hourWidth / 4;

    const getVehicleColor = (name?: string): string => {
        if (!name) {
            return HOS_CHART_COLORS.dutyLine;
        }

        let hash = 0;

        for (let i = 0; i < name.length; i += 1) {
            hash =
                name.charCodeAt(i) +
                ((hash << 5) - hash);
        }

        const hue = Math.abs(hash) % 360;

        return `hsl(${hue}, 55%, 55%)`;
    };

    return (
        <View style={{ alignItems: 'center' }}>
            <Svg
                width={svgWidth}
                height={svgHeight}
            >
                {/* Background */}
                <Rect
                    x={dimensions.left}
                    y={dimensions.top}
                    width={dimensions.width}
                    height={dimensions.height}
                    fill={HOS_CHART_COLORS.background}
                    stroke={HOS_CHART_COLORS.border}
                    strokeWidth={1}
                />

                {/* Hour labels */}
                {Array.from({ length: 25 }, (_, hour) => {
                    const x =
                        dimensions.left +
                        hour * hourWidth;

                    const label =
                        hour === 0 || hour === 24
                            ? 'M'
                            : hour < 12
                            ? String(hour)
                            : hour === 12
                            ? 'N'
                            : String(hour - 12);

                    return (
                        <Text
                            key={`hour-label-${hour}`}
                            x={x}
                            y={dimensions.top - 3}
                            fill={HOS_CHART_COLORS.text}
                            fontSize={
                                HOS_CHART_DEFAULTS.hourLabelFontSize
                            }
                            textAnchor={
                                hour === 0
                                    ? 'start'
                                    : hour === 24
                                    ? 'end'
                                    : 'middle'
                            }
                        >
                            {label}
                        </Text>
                    );
                })}

                {/* Vertical major and quarter-hour grid */}
                {Array.from({ length: 24 }, (_, hour) => {
                    const hourX =
                        dimensions.left +
                        hour * hourWidth;

                    return (
                        <G key={`grid-hour-${hour}`}>
                            {hour > 0 && (
                                <Line
                                    x1={hourX}
                                    y1={dimensions.top}
                                    x2={hourX}
                                    y2={dimensions.bottom}
                                    stroke={
                                        HOS_CHART_COLORS.gridMajor
                                    }
                                    strokeWidth={
                                        HOS_CHART_DEFAULTS.majorGridWidth
                                    }
                                />
                            )}

                            {/* Quarter-hour ticks for EACH status row */}
                            {Array.from({ length: 4 }, (_, row) => {
                                const rowBottom =
                                    dimensions.top +
                                    (row + 1) * dimensions.rowHeight;

                                return Array.from(
                                    { length: 3 },
                                    (_, quarter) => {
                                        const x =
                                            hourX +
                                            (quarter + 1) *
                                                quarterWidth;

                                        return (
                                            <Line
                                                key={`quarter-${hour}-${row}-${quarter}`}
                                                x1={x}
                                                y1={
                                                    rowBottom -
                                                    (quarter === 1
                                                        ? 8
                                                        : 5)
                                                }
                                                x2={x}
                                                y2={rowBottom}
                                                stroke={
                                                    HOS_CHART_COLORS.gridMinor
                                                }
                                                strokeWidth={
                                                    HOS_CHART_DEFAULTS
                                                        .minorGridWidth
                                                }
                                            />
                                        );
                                    }
                                );
                            })}
                        </G>
                    );
                })}

                {/* Row labels and horizontal row boundaries */}
                {HOS_STATUS_ROWS.map((row) => {
                    const y =
                        dimensions.top +
                        row.index *
                            dimensions.rowHeight;

                    return (
                        <G key={`row-${row.label}`}>
                            <Text
                                x={2}
                                y={
                                    y +
                                    dimensions.rowHeight / 2 +
                                    3
                                }
                                fill={
                                    HOS_CHART_COLORS.text
                                }
                                fontSize={
                                    HOS_CHART_DEFAULTS.labelFontSize
                                }
                            >
                                {row.label}
                            </Text>

                            <Line
                                x1={dimensions.left}
                                y1={y}
                                x2={
                                    dimensions.left +
                                    dimensions.width
                                }
                                y2={y}
                                stroke={
                                    HOS_CHART_COLORS.gridMajor
                                }
                                strokeWidth={1}
                            />
                        </G>
                    );
                })}

                {/* Final horizontal boundary */}
                <Line
                    x1={dimensions.left}
                    y1={dimensions.bottom}
                    x2={
                        dimensions.left +
                        dimensions.width
                    }
                    y2={dimensions.bottom}
                    stroke={HOS_CHART_COLORS.gridMajor}
                    strokeWidth={1}
                />

                {/*
                 * Violations are intentionally rendered BEFORE
                 * duty-status lines so the blue line stays visible.
                 */}
                {violationRects.map((violation) => (
                    <Rect
                        key={`violation-${violation.id}`}
                        x={violation.startX}
                        y={dimensions.top}
                        width={Math.max(
                            0,
                            violation.endX -
                                violation.startX
                        )}
                        height={dimensions.height}
                        fill={HOS_CHART_COLORS.violation}
                        opacity={0.2}
                    />
                ))}

                {/* Duty-status horizontal segments */}
                {segments.map((segment) => (
                    <Line
                        key={`segment-${segment.id}`}
                        x1={segment.startX}
                        y1={segment.y}
                        x2={segment.endX}
                        y2={segment.y}
                        stroke={
                            HOS_CHART_COLORS.dutyLine
                        }
                        strokeWidth={
                            HOS_CHART_DEFAULTS.strokeWidth
                        }
                        strokeDasharray={
                            segment.dashed
                                ? HOS_CHART_DEFAULTS.dashArray
                                : undefined
                        }
                        strokeLinecap="round"
                    />
                ))}

                {/* Duty-status vertical transitions */}
                {transitions.map((transition) => (
                    <Line
                        key={`transition-${transition.id}`}
                        x1={transition.x}
                        y1={transition.y1}
                        x2={transition.x}
                        y2={transition.y2}
                        stroke={
                            HOS_CHART_COLORS.dutyLine
                        }
                        strokeWidth={
                            HOS_CHART_DEFAULTS.strokeWidth
                        }
                        strokeDasharray={
                            transition.dashed
                                ? HOS_CHART_DEFAULTS.dashArray
                                : undefined
                        }
                        strokeLinecap="round"
                    />
                ))}

                {/* Vehicle legend */}
                {vehicleName ? (
                    <G>
                        <Rect
                            x={dimensions.left}
                            y={
                                dimensions.bottom +
                                moderateScale(10)
                            }
                            width={moderateScale(12)}
                            height={moderateScale(12)}
                            fill={getVehicleColor(
                                vehicleName
                            )}
                            stroke={
                                HOS_CHART_COLORS.border
                            }
                            strokeWidth={0.5}
                        />

                        <Text
                            x={
                                dimensions.left +
                                moderateScale(17)
                            }
                            y={
                                dimensions.bottom +
                                moderateScale(19)
                            }
                            fill={
                                HOS_CHART_COLORS.text
                            }
                            fontSize={8}
                        >
                            {vehicleName}
                        </Text>
                    </G>
                ) : null}
            </Svg>
        </View>
    );
};

export default HOSChart;
