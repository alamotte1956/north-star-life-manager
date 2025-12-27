/**
 * PII Sanitization Utility Function
 * Reusable across all backend functions
 */

export function sanitizePII(data) {
    if (!data) return data;
    
    if (Array.isArray(data)) {
        return data.map(item => sanitizePII(item));
    }
    
    if (typeof data === 'object') {
        const sanitized = {};
        const piiFields = [
            'email', 'full_name', 'name', 'address', 'phone', 'ssn',
            'created_by', 'user_email', 'contact_email',
            'account_number', 'routing_number', 'card_number'
        ];
        
        for (const [key, value] of Object.entries(data)) {
            if (piiFields.some(pii => key.toLowerCase().includes(pii))) {
                sanitized[key] = `ANON_${Math.random().toString(36).substring(7)}`;
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

export function sanitizePrompt(prompt, user) {
    if (!prompt || !user) return prompt;
    
    return prompt
        .replace(new RegExp(user.full_name, 'gi'), 'User')
        .replace(new RegExp(user.email, 'gi'), 'user@anonymized.com')
        .replace(/\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, 'User'); // Generic names
}