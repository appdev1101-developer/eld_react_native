export type ValidationResult =
    | { valid: true }
    | { valid: false; message: string };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAC_ADDRESS_PATTERN = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;

export function required(
    value: string,
    fieldName = 'This field'
): ValidationResult {
    if (!value?.trim()) {
        return { valid: false, message: `${fieldName} is required` };
    }
    return { valid: true };
}

export function email(value: string): ValidationResult {
    const trimmed = value?.trim() ?? '';
    if (!trimmed) {
        return { valid: false, message: 'Email is required' };
    }
    if (!EMAIL_PATTERN.test(trimmed)) {
        return { valid: false, message: 'Enter a valid email address' };
    }
    return { valid: true };
}

export function minLength(
    value: string,
    min: number,
    fieldName = 'This field'
): ValidationResult {
    const trimmed = value?.trim() ?? '';
    if (trimmed.length < min) {
        return {
            valid: false,
            message: `${fieldName} must be at least ${min} characters`
        };
    }
    return { valid: true };
}

export function passwordsMatch(
    password: string,
    confirmPassword: string
): ValidationResult {
    if (password !== confirmPassword) {
        return { valid: false, message: 'Passwords do not match' };
    }
    return { valid: true };
}

export function otp(value: string, expectedLength = 4): ValidationResult {
    const trimmed = value?.trim() ?? '';
    if (!trimmed) {
        return { valid: false, message: 'OTP is required' };
    }
    if (!/^\d+$/.test(trimmed)) {
        return { valid: false, message: 'OTP must contain only numbers' };
    }
    if (trimmed.length !== expectedLength) {
        return {
            valid: false,
            message: `OTP must be ${expectedLength} digits`
        };
    }
    return { valid: true };
}

export function macAddress(value: string): ValidationResult {
    const trimmed = value?.trim() ?? '';
    if (!trimmed) {
        return { valid: false, message: 'ELD MAC address is required' };
    }
    if (!MAC_ADDRESS_PATTERN.test(trimmed)) {
        return {
            valid: false,
            message: 'Enter a valid MAC address (e.g. AA:BB:CC:DD:EE:FF)'
        };
    }
    return { valid: true };
}

export function firstInvalid(
    ...results: ValidationResult[]
): ValidationResult {
    return results.find((result) => !result.valid) ?? { valid: true };
}