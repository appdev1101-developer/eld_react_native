import { Dimensions } from 'react-native';
const { width, height } = Dimensions.get('window');

//Guideline sizes are based on standard ~5" screen mobile device
const guidelineBaseWidth = 350;
const guidelineBaseHeight = 680;

// Explicitly tell TypeScript that size and return values are numbers
const scale = (size: number): number => (width / guidelineBaseWidth) * size;

const verticalScale = (size: number): number => (height / guidelineBaseHeight) * size;

const moderateScale = (size: number, factor: number = 1): number => 
    size + (scale(size) - size) * factor;

export { scale, verticalScale, moderateScale };