/**
 * PII Sanitization Utility Function
 * Reusable across all backend functions
 * Enhanced with KMS encryption for sensitive data
 */

import { encryptData, auditLog } from './lib/kmsService.ts';

export async function sanitizePII(data: any): Promise<any> {
    if (!data) return data;
    
    if (Array.isArray(data)) {
        return Promise.all(data.map(item => sanitizePII(item)));
    }
    
    if (typeof data === 'object') {
        const sanitized: Record<string, any> = {};
        const piiFields = [
            'email', 'full_name', 'name', 'address', 'phone', 'ssn',
            'created_by', 'user_email', 'contact_email',
            'account_number', 'routing_number', 'card_number'
        ];
        
        for (const [key, value] of Object.entries(data)) {
            if (piiFields.some(pii => key.toLowerCase().includes(pii))) {
                // Encrypt PII data using KMS instead of simple anonymization
                try {
                    sanitized[key] = await encryptData(String(value));
                    sanitized[`${key}_encrypted`] = true;
                    
                    auditLog('PII_ENCRYPTED', {
                        field: key,
                        fieldType: 'PII'
                    });
                } catch (error) {
                    // Fallback to cryptographically secure anonymization if encryption fails
                    const randomBytes = crypto.getRandomValues(new Uint8Array(8));
                    const randomId = Array.from(randomBytes, byte => byte.toString(16).padStart(2, '0')).join('');
                    sanitized[key] = `ANON_${randomId}`;
                    auditLog('PII_ENCRYPTION_FAILED_FALLBACK', { field: key }, error as Error);
                }
            } else if (typeof value === 'object') {
                sanitized[key] = await sanitizePII(value);
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