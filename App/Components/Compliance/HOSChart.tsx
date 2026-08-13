import React from 'react';
import { Dimensions, View } from 'react-native';
import Svg, { G, Line, Path, Rect, Text } from 'react-native-svg';
import { moderateScale } from '../../Constants/PixelRatio';

type Props = {
    marginHorizontal?: number;
    lineObject?: Array<{
        start: string;
        end: string;
        status: number;
    }>;
    violations?: Array<{
        start: string;
        end: string;
    }>;
    vehicleName?: string;
};

const { width: screenWidth } = Dimensions.get('window');

/**
 * The app has 6 duty-status codes (see Constants/DutyStatus.ts):
 *   1 Off Duty, 2 Sleeper Berth, 3 Driving, 4 On Duty,
 *   5 Personal Conveyance, 6 Yard Move
 * but the ELD grid only has 4 rows. Standard ELD-grid convention (matches
 * most other ELD apps) draws Personal Conveyance as a dashed line in the
 * OFF DUTY row, and Yard Move as a dashed line in the ON DUTY row, rather
 * than as separate rows. Statuses 5 and 6 previously had no mapping here
 * at all — indexing straight off `status - 1` ran off the end of the
 * 4-item `statuses` array for those two, drawing the line at an invalid Y
 * position instead of a wrong-but-visible one.
 */
const ROW_INDEX_BY_STATUS: Record<number, number> = {
    1: 0, // OFF
    2: 1, // SB
    3: 2, // D
    4: 3, // ON
    5: 0, // Personal Conveyance -> OFF row, dashed
    6: 3 // Yard Move -> ON row, dashed
};

const DASHED_STATUS_CODES = new Set([5, 6]);

const HOSChart: React.FC<Props> = ({
    marginHorizontal = moderateScale(38),
    lineObject = [],
    violations = [],
    vehicleName
}) => {
    const width = screenWidth - marginHorizontal * 2;
    const height = 60;
    const hourWidth = width / 24;
    const statuses = ['OFF', 'SB', 'D', 'ON'];
    const rowHeight = height / statuses.length;
    const xGap = 25;
    const yGap = 10;
    const quaterWidth = hourWidth / 4;

    const getStatusY = (rowIndex: number) => rowIndex * rowHeight + rowHeight / 2;

    const getTimeText = (index: number): string => {
        return index < 11
            ? (index + 1).toString()
            : index === 11
            ? 'N'
            : (index - 11).toString();
    };

    const timeToDecimal = (timeStr: string): number => {
        const [hourStr, minuteStr] = timeStr.split(':');
        const hour = parseInt(hourStr, 10);
        const minutes = parseInt(minuteStr || '0', 10);
        return hour + minutes / 60;
    };

    const getShadedPath = (
        startTime: string, // e.g. "23:30"
        endTime: string, // e.g. "04:00"
        yTop: number, // e.g. 0
        yBottom: number, // e.g. 200 (height of the row)
        hourWidth: number, // e.g. 50 (width per hour)
        xGap: number // left padding
    ): string[] => {
        const startDec = timeToDecimal(startTime);
        const endDec = timeToDecimal(endTime);

        const startX = xGap + startDec * hourWidth;
        const endX = xGap + endDec * hourWidth;
        const endOfDayX = xGap + 24 * hourWidth;

        if (startDec <= endDec) {
            // Normal same-day shade
            const path = `M ${startX} ${yTop}
                  L ${endX} ${yTop}
                  L ${endX} ${yBottom}
                  L ${startX} ${yBottom}
                  Z`;
            return [path];
        } else {
            // Over-midnight shade: first from startTime to 24:00, then from 0:00 to endTime
            const path1 = `M ${startX} ${yTop}
                   L ${endOfDayX} ${yTop}
                   L ${endOfDayX} ${yBottom}
                   L ${startX} ${yBottom}
                   Z`;

            const path2 = `M ${xGap} ${yTop}
                   L ${endX} ${yTop}
                   L ${endX} ${yBottom}
                   L ${xGap} ${yBottom}
                   Z`;

            return [path1, path2];
        }
    };

    /**
     * Was previously Math.random() on every render, so the swatch color
     * changed on every re-render instead of staying fixed to the vehicle.
     * This derives a stable color from the vehicle name instead — same
     * input always produces the same color, no vehicle-color field exists
     * on the API's vehicle data to use directly (see Model/Dashboard.ts).
     */
    const getVehicleColor = (name?: string): string => {
        if (!name) return '#0075e7';
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        const hue = Math.abs(hash) % 360;
        return `hsl(${hue}, 55%, 55%)`;
    };

    return (
        <View style={{ alignItems: 'center' }}>
            <Svg
                height={height + 20 + yGap * 2}
                width={width + xGap * 2}
                style={
                    {
                        // backgroundColor: 'red'
                    }
                }
            >
                <Rect
                    x={xGap}
                    y={yGap}
                    width={width}
                    height={height}
                    fill="white"
                    stroke="#ccc"
                    strokeWidth="1"
                />
                <Text
                    x={xGap - 2}
                    y={yGap - 2}
                    fill={'#000'}
                    fontSize="8"
                >
                    M
                </Text>
                <Text
                    x={width + xGap - 2}
                    y={yGap - 2}
                    fill={'#000'}
                    fontSize="8"
                >
                    M
                </Text>
                {/* Vertical Grid Lines */}
                {Array.from({ length: 23 }, (_, i) => (
                    <G key={i}>
                        <Text
                            x={
                                (i + 1) * hourWidth +
                                xGap -
                                (getTimeText(i).length == 1 ? 2 : 4)
                            }
                            y={yGap - 2}
                            fill={'#000'}
                            fontSize="8"
                        >
                            {getTimeText(i)}
                        </Text>
                        <Line
                            x1={(i + 1) * hourWidth + xGap}
                            y1={yGap}
                            x2={(i + 1) * hourWidth + xGap}
                            y2={height + yGap}
                            stroke="#ccc"
                            strokeWidth="1"
                        />
                    </G>
                ))}

                {/* Horizontal Rows */}
                {statuses.map((status, i) => (
                    <G key={status}>
                        <Text
                            x={5}
                            y={i * rowHeight + yGap + rowHeight / 1.5}
                            fontSize="8"
                            fill="#000"
                        >
                            {status}
                        </Text>
                        <Line
                            x1={xGap}
                            y1={i * rowHeight + yGap}
                            x2={width + xGap}
                            y2={i * rowHeight + yGap}
                            stroke="#ccc"
                            strokeWidth="1"
                        />

                        {Array.from({ length: 4 * 24 }, (_, index) => (
                            <G key={index}>
                                {(index + 1) % 4 === 0 ? null : (
                                    <Line
                                        x1={xGap + (index + 1) * quaterWidth}
                                        y1={(i + 1) * rowHeight + yGap}
                                        x2={xGap + (index + 1) * quaterWidth}
                                        y2={
                                            (i + 1) * rowHeight +
                                            yGap -
                                            ((index + 1) % 2 === 0 ? 8 : 5)
                                        }
                                        stroke="#ccc"
                                        strokeWidth="1"
                                    />
                                )}
                            </G>
                        ))}
                    </G>
                ))}

                {(() => {
                    if (!lineObject.length) return null;

                    let solidPath = '';
                    let dashedPath = '';
                    let lastSolidPoint: { x: number; y: number } | null = null;
                    let lastDashedPoint: { x: number; y: number } | null = null;

                    const appendTo = (
                        isDashed: boolean,
                        x: number,
                        y: number
                    ) => {
                        const lastPoint = isDashed ? lastDashedPoint : lastSolidPoint;
                        const needsMove =
                            !lastPoint || lastPoint.x !== x || lastPoint.y !== y;
                        const segment = `${needsMove ? 'M' : 'L'}${x},${y} `;
                        if (isDashed) {
                            dashedPath += segment;
                            lastDashedPoint = { x, y };
                        } else {
                            solidPath += segment;
                            lastSolidPoint = { x, y };
                        }
                    };

                    for (let i = 0; i < lineObject.length; i++) {
                        const line = lineObject[i];
                        const rowIndex = ROW_INDEX_BY_STATUS[line.status] ?? 0;
                        const currentY = getStatusY(rowIndex) + yGap;
                        const startDec = timeToDecimal(line.start);
                        const endDec = timeToDecimal(line.end);
                        const startX = xGap + startDec * hourWidth;
                        const endX = xGap + endDec * hourWidth;
                        const isDashed = DASHED_STATUS_CODES.has(line.status);

                        if (startDec <= endDec) {
                            appendTo(isDashed, startX, currentY);
                            appendTo(isDashed, endX, currentY);
                        } else {
                            // Crosses midnight (e.g. Driving 23:00 -> 01:30):
                            // draw start->end-of-day, then start-of-day->end,
                            // same split used for violation shading below.
                            const endOfDayX = xGap + 24 * hourWidth;
                            appendTo(isDashed, startX, currentY);
                            appendTo(isDashed, endOfDayX, currentY);
                            appendTo(isDashed, xGap, currentY);
                            appendTo(isDashed, endX, currentY);
                        }

                        if (i < lineObject.length - 1) {
                            const nextLine = lineObject[i + 1];
                            const nextRowIndex = ROW_INDEX_BY_STATUS[nextLine.status] ?? 0;
                            const nextY = getStatusY(nextRowIndex) + yGap;
                            if (nextY !== currentY) {
                                // Step connector drawn in the outgoing
                                // segment's style, continuing from the
                                // point we're already at.
                                appendTo(isDashed, endX, nextY);
                            }
                        }
                    }

                    return (
                        <>
                            <Path
                                d={solidPath.trim()}
                                fill="none"
                                stroke="#0075e7"
                                strokeWidth={2}
                                strokeLinejoin="round"
                                strokeLinecap="round"
                            />
                            <Path
                                d={dashedPath.trim()}
                                fill="none"
                                stroke="#0075e7"
                                strokeWidth={2}
                                strokeDasharray="4,3"
                                strokeLinejoin="round"
                                strokeLinecap="round"
                            />
                        </>
                    );
                })()}

                {/* Violations: Shaded Red Paths */}
                {violations.flatMap(({ start, end }, index) =>
                    getShadedPath(start, end, yGap, height + yGap, hourWidth, xGap).map(
                        (d, i) => (
                            <Path
                                key={`${index}-${i}`}
                                d={d}
                                fill="#ff0000"
                                opacity={0.2}
                            />
                        )
                    )
                )}

                <Rect
                    x={width / 2}
                    y={height + 20}
                    width={15}
                    height={15}
                    fill={getVehicleColor(vehicleName)}
                    stroke="#ccc"
                    strokeWidth="0.5"
                />

                <Text
                    x={width / 2 + 20}
                    y={height + 20 + 12}
                    fill={'#000'}
                    fontSize="8"
                >
                    {vehicleName}
                </Text>
            </Svg>
        </View>
    );
};

export default HOSChart;