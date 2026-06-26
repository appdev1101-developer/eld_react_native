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

    const getStatusY = (status: string) =>
        statuses.indexOf(status) * rowHeight + rowHeight / 2;

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
        console.log('startDec', startDec, endDec, startX);

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

    function getRandomHexColor() {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }

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

                <Path
                    d={(() => {
                        if (!lineObject.length) return '';

                        let path = '';
                        for (let i = 0; i < lineObject.length; i++) {
                            const line = lineObject[i];
                            const currentY = getStatusY(statuses[line.status - 1]) + yGap;
                            const startX = xGap + timeToDecimal(line.start) * hourWidth;
                            const endX = xGap + timeToDecimal(line.end) * hourWidth;

                            if (i === 0) {
                                path += `M${startX},${currentY} `;
                            }

                            path += `L${endX},${currentY} `;

                            if (i < lineObject.length - 1) {
                                const nextY =
                                    getStatusY(statuses[lineObject[i + 1].status - 1]) +
                                    yGap;
                                if (nextY !== currentY) {
                                    path += `L${endX},${nextY} `;
                                }
                            }
                        }

                        return path.trim();
                    })()}
                    fill="none"
                    stroke="#0075e7"
                    strokeWidth={2}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                />

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
                    fill={getRandomHexColor()}
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
