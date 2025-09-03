/**
 * Enhanced form validation utilities with user-friendly error messages
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Email validation with comprehensive checks
 */
export const validateEmail = (email: string): ValidationResult => {
  if (!email.trim()) {
    return { isValid: false, error: 'Email is required' };
  }

  // Basic email format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }

  // Check for common typos
  const commonTypos = [
    { pattern: /@gmai\.com$|@gmail\.co$/, suggestion: '@gmail.com' },
    { pattern: /@hotmai\.com$|@hotmail\.co$/, suggestion: '@hotmail.com' },
    { pattern: /@yahoo\.co$|@yahoo\.cm$/, suggestion: '@yahoo.com' },
  ];

  for (const typo of commonTypos) {
    if (typo.pattern.test(email)) {
      return { isValid: false, error: `Did you mean ${email.replace(typo.pattern, typo.suggestion)}?` };
    }
  }

  return { isValid: true };
};

/**
 * Password validation with strength requirements
 */
export const validatePassword = (password: string): ValidationResult => {
  if (!password) {
    return { isValid: false, error: 'Password is required' };
  }

  if (password.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters long' };
  }

  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const missingRequirements = [];
  if (!hasUpperCase) missingRequirements.push('an uppercase letter');
  if (!hasLowerCase) missingRequirements.push('a lowercase letter');
  if (!hasNumbers) missingRequirements.push('a number');
  if (!hasSpecialChar) missingRequirements.push('a special character');

  if (missingRequirements.length > 0) {
    return {
      isValid: false,
      error: `Password must include ${missingRequirements.join(', ')}`
    };
  }

  return { isValid: true };
};

/**
 * Username validation with availability check capability
 */
export const validateUsername = (username: string): ValidationResult => {
  if (!username.trim()) {
    return { isValid: false, error: 'Username is required' };
  }

  if (username.length < 3) {
    return { isValid: false, error: 'Username must be at least 3 characters long' };
  }

  if (username.length > 20) {
    return { isValid: false, error: 'Username must be less than 20 characters' };
  }

  // Only allow alphanumeric characters and underscores
  const usernameRegex = /^[a-zA-Z0-9_]+$/;
  if (!usernameRegex.test(username)) {
    return { isValid: false, error: 'Username can only contain letters, numbers, and underscores' };
  }

  // Check for reserved words
  const reservedWords = ['admin', 'api', 'www', 'support', 'help', 'about', 'terms', 'privacy'];
  if (reservedWords.includes(username.toLowerCase())) {
    return { isValid: false, error: 'This username is not available' };
  }

  return { isValid: true };
};

/**
 * Phone number validation (Ghana-specific)
 */
export const validatePhoneNumber = (phone: string): ValidationResult => {
  if (!phone.trim()) {
    return { isValid: false, error: 'Phone number is required' };
  }

  // Ghana phone number format: starts with 0 or +233, followed by 9 digits
  const phoneRegex = /^(0|\+233)[2-9]\d{8}$/;
  if (!phoneRegex.test(phone)) {
    return { 
      isValid: false, 
      error: 'Please enter a valid Ghana phone number (e.g., 0244000000 or +233244000000)' 
    };
  }

  return { isValid: true };
};

/**
 * Content validation for posts and messages
 */
export const validateContent = (content: string, minLength = 1, maxLength = 1000): ValidationResult => {
  if (!content.trim()) {
    return { isValid: false, error: 'Content cannot be empty' };
  }

  if (content.length < minLength) {
    return { isValid: false, error: `Content must be at least ${minLength} characters long` };
  }

  if (content.length > maxLength) {
    return { isValid: false, error: `Content must be less than ${maxLength} characters` };
  }

  // Check for spam-like content
  const spamPatterns = [
    /(.)\1{10,}/, // Repeated characters
    /[A-Z]{20,}/, // Too many consecutive capitals
  ];

  for (const pattern of spamPatterns) {
    if (pattern.test(content)) {
      return { isValid: false, error: 'Content appears to be spam or invalid' };
    }
  }

  return { isValid: true };
};

/**
 * Price validation for subscription tiers
 */
export const validatePrice = (price: string | number): ValidationResult => {
  const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
  
  if (isNaN(numericPrice)) {
    return { isValid: false, error: 'Please enter a valid price' };
  }

  if (numericPrice < 0) {
    return { isValid: false, error: 'Price cannot be negative' };
  }

  if (numericPrice === 0) {
    return { isValid: false, error: 'Price must be greater than 0' };
  }

  if (numericPrice > 10000) {
    return { isValid: false, error: 'Price cannot exceed GHS 10,000' };
  }

  // Check for reasonable decimal places
  const decimalPlaces = (numericPrice.toString().split('.')[1] || '').length;
  if (decimalPlaces > 2) {
    return { isValid: false, error: 'Price can have at most 2 decimal places' };
  }

  return { isValid: true };
};

/**
 * File validation for uploads
 */
export const validateFile = (file: File, allowedTypes: string[], maxSizeMB = 10): ValidationResult => {
  if (!file) {
    return { isValid: false, error: 'Please select a file' };
  }

  // Check file type
  const fileType = file.type.toLowerCase();
  const isAllowedType = allowedTypes.some(type => fileType.includes(type.toLowerCase()));
  
  if (!isAllowedType) {
    return { 
      isValid: false, 
      error: `Only ${allowedTypes.join(', ')} files are allowed` 
    };
  }

  // Check file size
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return { 
      isValid: false, 
      error: `File size must be less than ${maxSizeMB}MB` 
    };
  }

  return { isValid: true };
};

/**
 * Form validation helper that validates multiple fields
 */
export const validateForm = (fields: Record<string, any>, validators: Record<string, (value: any) => ValidationResult>): Record<string, string> => {
  const errors: Record<string, string> = {};

  for (const [fieldName, value] of Object.entries(fields)) {
    const validator = validators[fieldName];
    if (validator) {
      const result = validator(value);
      if (!result.isValid && result.error) {
        errors[fieldName] = result.error;
      }
    }
  }

  return errors;
};

/**
 * Real-time validation debouncer
 */
export const createDebouncedValidator = (
  validator: (value: any) => ValidationResult,
  delay = 300
) => {
  let timeoutId: NodeJS.Timeout;
  
  return (value: any, callback: (result: ValidationResult) => void) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      const result = validator(value);
      callback(result);
    }, delay);
  };
};