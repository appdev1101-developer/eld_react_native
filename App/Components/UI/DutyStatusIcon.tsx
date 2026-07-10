import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { DutyStatusIconName } from '../../Constants/dutyStatus';

type Props = {
    name: DutyStatusIconName;
    color: string;
    size?: number;
    strokeWidth?: number;
};

type StrokeProps = {
    stroke: string;
    strokeWidth: number;
    strokeLinecap: 'round';
    strokeLinejoin: 'round';
    fill: 'none';
};

const DutyStatusIcon: React.FC<Props> = ({
    name,
    color,
    size = 24,
    strokeWidth = 2
}) => {
    const stroke: StrokeProps = {
        stroke: color,
        strokeWidth,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        fill: 'none'
    };

    const renderGlyph = () => {
        switch (name) {
            case 'drive':
                return (
                    <>
                        <Path
                            d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"
                            {...stroke}
                        />
                        <Path d="M15 18H9" {...stroke} />
                        <Path
                            d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"
                            {...stroke}
                        />
                        <Circle cx="17" cy="18" r="2" {...stroke} />
                        <Circle cx="7" cy="18" r="2" {...stroke} />
                    </>
                );
            case 'yard':
                return (
                    <>
                        <Path d="M8 3 4 7l4 4" {...stroke} />
                        <Path d="M4 7h16" {...stroke} />
                        <Path d="m16 21 4-4-4-4" {...stroke} />
                        <Path d="M20 17H4" {...stroke} />
                    </>
                );
            case 'personal':
                return (
                    <>
                        <Path
                            d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"
                            {...stroke}
                        />
                        <Circle cx="7" cy="17" r="2" {...stroke} />
                        <Path d="M9 17h6" {...stroke} />
                        <Circle cx="17" cy="17" r="2" {...stroke} />
                    </>
                );
            case 'onDuty':
                return (
                    <>
                        <Rect x="8" y="2" width="8" height="4" rx="1" ry="1" {...stroke} />
                        <Path
                            d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"
                            {...stroke}
                        />
                        <Path d="M12 11h4" {...stroke} />
                        <Path d="M12 16h4" {...stroke} />
                        <Path d="M8 11h.01" {...stroke} />
                        <Path d="M8 16h.01" {...stroke} />
                    </>
                );
            case 'sleeper':
                return (
                    <>
                        <Path
                            d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8"
                            {...stroke}
                        />
                        <Path
                            d="M4 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4"
                            {...stroke}
                        />
                        <Path d="M12 4v6" {...stroke} />
                        <Path d="M2 18h20" {...stroke} />
                    </>
                );
            case 'offDuty':
                return (
                    <>
                        <Path
                            d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
                            {...stroke}
                        />
                        <Path d="M9 22V12h6v10" {...stroke} />
                    </>
                );
            default:
                return null;
        }
    };

    return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
            {renderGlyph()}
        </Svg>
    );
};

export default DutyStatusIcon;