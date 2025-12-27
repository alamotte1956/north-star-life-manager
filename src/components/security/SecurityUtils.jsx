// Security utility functions for sanitization and validation

/**
 * Sanitize HTML to prevent XSS attacks
 * Strips all HTML tags and dangerous characters
 */
export function sanitizeHTML(input) {
    if (!input) return '';
    
    // Create a temporary element
    const temp = document.createElement('div');
    temp.textContent = input;
    
    // Return text content (strips all HTML)
    return temp.innerHTML
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
}

/**
 * Sanitize user input for display
 * Prevents script injection and HTML injection
 */
export function sanitizeUserInput(input) {
    if (typeof input !== 'string') return '';
    
    return input
        .replace(/[<>]/g, '') // Remove angle brackets
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .replace(/on\w+\s*=/gi, '') // Remove event handlers like onclick=
        .trim();
}

/**
 * Validate and sanitize URL
 * Prevents javascript: and data: URL schemes
 */
export function sanitizeURL(url) {
    if (!url) return '';
    
    const urlString = String(url).toLowerCase().trim();
    
    // Block dangerous protocols
    if (
        urlString.startsWith('javascript:') ||
        urlString.startsWith('data:') ||
        urlString.startsWith('vbscript:') ||
        urlString.includes('<script')
    ) {
        return '';
    }
    
    return url;
}

/**
 * Generate cryptographically secure random code
 */
export function generateSecureCode(length = 12) {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(36).padStart(2, '0'))
        .join('')
        .substring(0, length)
        .toUpperCase();
}