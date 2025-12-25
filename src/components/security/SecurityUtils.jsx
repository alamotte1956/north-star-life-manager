/**
 * Security & Compliance Utilities
 * Implements Data Mapping & Compliance Checklist requirements
 */

/**
 * PII SANITIZATION - Removes personally identifiable information before AI calls
 * Required for GDPR/CCPA compliance and third-party AI usage
 */
export function sanitizePII(data) {
    if (!data) return data;
    
    // Handle arrays
    if (Array.isArray(data)) {
        return data.map(item => sanitizePII(item));
    }
    
    // Handle objects
    if (typeof data === 'object') {
        const sanitized = {};
        for (const [key, value] of Object.entries(data)) {
            // Skip PII fields entirely
            if (isPIIField(key)) {
                sanitized[key] = anonymizeValue(key, value);
            } else if (typeof value === 'object') {
                sanitized[key] = sanitizePII(value);
            } else {
                sanitized[key] = value;
            }
        }
        return sanitized;
    }
    
    return data;
}

/**
 * Identifies PII fields that should be anonymized
 */
function isPIIField(fieldName) {
    const piiFields = [
        'email', 'full_name', 'name', 'address', 'phone', 'ssn',
        'date_of_birth', 'dob', 'birth_date', 'passport', 'license',
        'account_number', 'routing_number', 'card_number', 'cvv',
        'created_by', 'user_email', 'contact_email', 'billing_email',
        'ip_address', 'device_id', 'location', 'coordinates'
    ];
    
    const lowerField = fieldName.toLowerCase();
    return piiFields.some(pii => lowerField.includes(pii));
}

/**
 * Anonymizes a PII value while maintaining data type
 */
function anonymizeValue(fieldName, value) {
    if (!value) return value;
    
    const lowerField = fieldName.toLowerCase();
    const hash = Math.random().toString(36).substring(7);
    
    // Email: user_123@domain.com
    if (lowerField.includes('email')) {
        return `user_${hash}@anonymized.com`;
    }
    
    // Names: User_123
    if (lowerField.includes('name')) {
        return `User_${hash}`;
    }
    
    // Addresses: Location_123
    if (lowerField.includes('address') || lowerField.includes('location')) {
        return `Location_${hash}`;
    }
    
    // Phone: ***-***-1234
    if (lowerField.includes('phone')) {
        return maskString(value, 4);
    }
    
    // Account numbers: ****1234
    if (lowerField.includes('account') || lowerField.includes('card')) {
        return maskString(value, 4);
    }
    
    // Generic: hash it
    return `ANON_${hash}`;
}

/**
 * FINANCIAL DATA MASKING - Shows only last 4 digits
 * Required for PCI-DSS and financial data protection
 */
export function maskAccountNumber(accountNumber) {
    if (!accountNumber) return '';
    const str = String(accountNumber);
    if (str.length <= 4) return str;
    return '*'.repeat(str.length - 4) + str.slice(-4);
}

export function maskCardNumber(cardNumber) {
    if (!cardNumber) return '';
    const str = String(cardNumber).replace(/\s/g, '');
    if (str.length <= 4) return str;
    return '**** **** **** ' + str.slice(-4);
}

export function maskSSN(ssn) {
    if (!ssn) return '';
    const str = String(ssn).replace(/-/g, '');
    if (str.length <= 4) return str;
    return '***-**-' + str.slice(-4);
}

/**
 * Generic masking function
 */
function maskString(str, visibleChars = 4) {
    if (!str) return '';
    const s = String(str);
    if (s.length <= visibleChars) return s;
    return '*'.repeat(s.length - visibleChars) + s.slice(-visibleChars);
}

/**
 * LOG SANITIZATION - Removes sensitive data from logs
 * Required to prevent data leakage through crash reports and analytics
 */
export function sanitizeForLogging(data) {
    if (!data) return data;
    
    try {
        // Remove common sensitive patterns
        let str = JSON.stringify(data);
        
        // Remove email addresses
        str = str.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL]');
        
        // Remove phone numbers
        str = str.replace(/(\+\d{1,3}[-.]?)?\(?\d{3}\)?[-.]?\d{3}[-.]?\d{4}/g, '[PHONE]');
        
        // Remove credit card numbers
        str = str.replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, '[CARD]');
        
        // Remove SSN
        str = str.replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN]');
        
        // Remove dollar amounts over $1000
        str = str.replace(/\$\d{1,3}(,\d{3})+(\.\d{2})?/g, '[AMOUNT]');
        
        return JSON.parse(str);
    } catch (e) {
        return '[SANITIZATION_ERROR]';
    }
}

/**
 * HEALTH DATA VALIDATORS
 * Ensures health data is never sent to marketing/analytics
 */
export function isHealthData(fieldName) {
    const healthFields = [
        'medication', 'diagnosis', 'condition', 'symptom', 'prescription',
        'doctor', 'hospital', 'treatment', 'medical', 'health',
        'blood_pressure', 'heart_rate', 'weight', 'height', 'bmi',
        'allergy', 'immunization', 'surgery', 'procedure'
    ];
    
    const lowerField = fieldName.toLowerCase();
    return healthFields.some(health => lowerField.includes(health));
}

export function stripHealthDataForAnalytics(data) {
    if (!data) return data;
    
    if (Array.isArray(data)) {
        return data.map(item => stripHealthDataForAnalytics(item));
    }
    
    if (typeof data === 'object') {
        const stripped = {};
        for (const [key, value] of Object.entries(data)) {
            if (!isHealthData(key)) {
                stripped[key] = typeof value === 'object' 
                    ? stripHealthDataForAnalytics(value) 
                    : value;
            }
        }
        return stripped;
    }
    
    return data;
}