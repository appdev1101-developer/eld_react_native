import {
    StyleProp,
    StyleSheet,
    Text,
    TextInput,
    TextInputProps,
    View,
    ViewStyle
} from 'react-native';
import React, { useEffect, useRef } from 'react';
import { TouchableWithoutFeedback } from 'react-native-gesture-handler';

interface Props extends Omit<TextInputProps, 'onChange' | 'value'> {
    pinCount?: number;
    value: string;
    onChange: (otp: string) => void;
    containerStyle?: StyleProp<ViewStyle>;
    activeInputStyle?: StyleProp<ViewStyle>;
    inActiveInputStyle?: StyleProp<ViewStyle>;
}
const OTPInput: React.FC<Props> = ({
    pinCount = 4,
    value,
    onChange,
    containerStyle,
    activeInputStyle,
    inActiveInputStyle,
    ...props
}) => {
    const inputRefs = useRef<(TextInput | null)[]>([]);

    useEffect(() => {}, []);

    const onChangeHandler = (digit: string, index: number) => {
        const otpArray = value.split('');
        otpArray[index] = digit;
        const newOtp = otpArray.join('');

        // Move to next input field if digit is entered
        if (digit && index < pinCount - 1) {
            inputRefs.current[index + 1]?.focus();
        }

        if (onChange && newOtp.length <= pinCount) {
            onChange(newOtp);
        }
    };

    const handleKeyPressTextInput = (key: string, index: number) => {
        if (key === 'Backspace') {
            if (value[index]) {
                onChangeHandler('', index); // Clear the current field
            } else if (index > 0) {
                inputRefs.current[index - 1]?.focus(); // Move to the previous field
                onChangeHandler('', index - 1); // Clear the previous field
            }
        }
    };

    const isInputActive = (index: number) => {
        return value[index];
    };

    return (
        <TouchableWithoutFeedback
            onPress={() => {
                if (value === '') {
                    inputRefs.current[0]?.focus();
                } else if (value.length === pinCount) {
                    inputRefs.current[value.length - 1]?.focus();
                } else if (value.length < pinCount) {
                    inputRefs.current[value.length]?.focus();
                }
            }}
            style={[styles.container, containerStyle]}
        >
            {new Array<number>(pinCount).fill(0).map((item, index) => {
                return (
                    <View
                        pointerEvents="none"
                        key={index}
                    >
                        <TextInput
                            key={index}
                            {...props}
                            ref={(ref) => (inputRefs.current[index] = ref)}
                            style={[
                                styles.inputStyle,
                                props.style,
                                isInputActive(index)
                                    ? activeInputStyle
                                    : inActiveInputStyle
                            ]}
                            keyboardType="number-pad"
                            value={value.split('')[index] ?? ''}
                            onChangeText={(value) => onChangeHandler(value, index)}
                            onKeyPress={(e) =>
                                handleKeyPressTextInput(e.nativeEvent.key, index)
                            }
                        />
                    </View>
                );
            })}
        </TouchableWithoutFeedback>
    );
};

export default OTPInput;

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    inputStyle: {
        height: 50,
        width: 50,
        borderRadius: 10,
        borderWidth: 1,
        textAlign: 'center'
    }
});
