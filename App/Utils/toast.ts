import Toast from 'react-native-simple-toast';

const SHORT = Toast.SHORT;
const LONG = Toast.LONG;

export function showToast(message: string, duration: number = SHORT): void {
    const text = message?.trim();
    if (!text) {
        return;
    }
    Toast.show(text, duration);
}

export function showError(message: string): void {
    showToast(message || 'Something went wrong', SHORT);
}

export function showSuccess(message: string): void {
    showToast(message, SHORT);
}

export { SHORT as TOAST_SHORT, LONG as TOAST_LONG };