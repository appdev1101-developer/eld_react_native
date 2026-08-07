import { ColorValue, ImageSourcePropType } from 'react-native';

export type StatusDataType = {
    shift_status_id: number;
    icon: ImageSourcePropType;
    name: string;
    description?: string;
    overlayColor?: ColorValue;
    arcColors?: [ColorValue, ColorValue, ColorValue];
    selectedArc?: 1 | 2;
};