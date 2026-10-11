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
export const validateMobileNumber = (phone: string | null | undefined): ValidationResult => {
  if (!phone) return { valid: false, message: 'Mobile number is required.' };;

  // 1. Remove all spaces, dashes, parentheses, and dots added by auto-formatting or user input
  const cleanPhone = phone.replace(/[\s\-().]/g, '');

  // 2. Regular Expression breakdown:
  // ^(\+?\d{1,4})? -> Optional country code (e.g., +1, +91, 44) up to 4 digits
  // \d{7,15}$      -> Matches the core subscriber number (7 to 15 digits according to E.164 standard)
  const phoneRegex = /^(\+?\d{1,4})?\d{7,15}$/;

   if(!phoneRegex.test(cleanPhone))
   {
        return { valid: false, message: 'Invalid mobile number.' };;
   }
   return { valid: true };
};

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