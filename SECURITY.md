# Security Best Practices

This document outlines security best practices and guidelines for the North Star Life Manager application.

## Current Security Measures

### 1. Authentication & Authorization
- User authentication is handled via Base44 SDK
- Service role access is used carefully for administrative operations
- Token-based authentication with JWT validation

### 2. Security Headers (functions/_middleware.ts)
- **Content-Security-Policy**: Restricts resource loading
- **Strict-Transport-Security**: Enforces HTTPS
- **X-Frame-Options**: Prevents clickjacking (DENY)
- **X-Content-Type-Options**: Prevents MIME sniffing
- **X-XSS-Protection**: Browser XSS protection
- **Referrer-Policy**: Limits referrer information

### 3. Input Validation
All function endpoints should validate:
- Required fields presence
- Data types
- String length limits
- Format validation (phone numbers, emails, etc.)
- Sanitization of user input

Example:
```javascript
if (!field || typeof field !== 'string') {
    return Response.json({ error: 'Invalid input' }, { status: 400 });
}

if (field.length > 500) {
    return Response.json({ error: 'Input too long' }, { status: 400 });
}
```

### 4. Error Handling
- Never expose stack traces in production
- Log detailed errors server-side only
- Return generic error messages to clients
- Use logger utility instead of console.*

Example:
```javascript
try {
    // ... operation
} catch (error) {
    console.error('Operation failed:', error);
    return Response.json({ error: 'Operation failed' }, { status: 500 });
}
```

### 5. Environment Variables
- Never hardcode secrets or API keys
- Use environment variables for all sensitive data
- Required environment variables:
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - `STRIPE_BASIC_PRICE_ID`
  - `STRIPE_PREMIUM_PRICE_ID`
  - `STRIPE_ENTERPRISE_PRICE_ID`
  - `OPENAI_API_KEY`
  - `TWILIO_ACCOUNT_SID`
  - `TWILIO_AUTH_TOKEN`
  - `TWILIO_PHONE_NUMBER`

### 6. PII Protection
- Use `sanitizePII()` utility when logging user data
- Never log sensitive information (passwords, SSN, card numbers)
- Implement data encryption at rest for sensitive fields
- Follow GDPR/CCPA requirements for data deletion

## Known Security Considerations

### 1. Content Security Policy
⚠️ **Current CSP allows 'unsafe-inline' and 'unsafe-eval'**

This is a security risk that should be addressed:
- Implement nonce-based CSP for inline scripts/styles
- Move inline event handlers to external scripts
- Replace any eval() usage with safer alternatives
- Use build tools to generate CSP-compatible code

### 2. Dependency Vulnerabilities

⚠️ **ACTION REQUIRED**: The following packages have known vulnerabilities:

| Package | Version | Severity | Vulnerability | Status |
|---------|---------|----------|---------------|--------|
| `dompurify` | < 3.2.4 | Moderate | XSS vulnerability (GHSA-vhxf-7vqr-mrjg) | Requires `jspdf` v3.x (breaking) |
| `quill` | <= 1.3.7 | Moderate | XSS in quill (GHSA-4943-9vgg-gr5r) | Requires `react-quill` update (breaking) |

**Action Items:**
1. Create GitHub security advisory for tracking
2. Test application with updated packages in development
3. Plan migration strategy for breaking changes
4. Schedule update deployment
5. Update dependencies: `npm install jspdf@latest react-quill@latest`

**Mitigation Until Fixed:**
- Validate and sanitize all user-generated content before rendering
- Use DOMPurify when displaying HTML content
- Limit who can create/edit rich text content

### 3. Rate Limiting
⚠️ **No rate limiting currently implemented**

Recommendations:
- Implement rate limiting on all function endpoints
- Use IP-based and user-based rate limits
- Protect against brute force attacks on authentication
- Add CAPTCHA for sensitive operations

### 4. Input Sanitization
While validation is in place, additional sanitization needed for:
- HTML content (use DOMPurify)
- SQL injection (use parameterized queries)
- NoSQL injection (sanitize query objects)
- Command injection (avoid shell commands with user input)

## Security Checklist for New Features

When adding new functionality:

- [ ] Validate all user inputs
- [ ] Use environment variables for secrets
- [ ] Implement proper authentication checks
- [ ] Add authorization checks (user can access resource)
- [ ] Sanitize error messages (no stack traces/details)
- [ ] Use HTTPS for all external API calls
- [ ] Implement rate limiting if needed
- [ ] Add logging for security events
- [ ] Test for common vulnerabilities (XSS, CSRF, SQL injection)
- [ ] Review and update CSP if loading new external resources
- [ ] Document any security implications

## Incident Response

If a security vulnerability is discovered:

1. **Do not publicly disclose** until fix is available
2. Contact the security team immediately
3. Create a private security advisory
4. Develop and test a fix
5. Deploy the fix to production
6. Notify affected users if data was compromised
7. Document the incident and lessons learned

## Reporting Security Issues

To report a security vulnerability:
- **Do not** open a public GitHub issue
- Email security contact (to be configured)
- Include detailed description and steps to reproduce
- Allow time for investigation and fix before public disclosure

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [Content Security Policy Reference](https://content-security-policy.com/)
- [npm audit](https://docs.npmjs.com/cli/v8/commands/npm-audit)

## Regular Security Tasks

- [ ] Run `npm audit` monthly and update dependencies
- [ ] Review access logs for suspicious activity
- [ ] Update security headers as standards evolve
- [ ] Test authentication and authorization flows
- [ ] Review and rotate API keys/secrets
- [ ] Audit third-party integrations
- [ ] Test backup and recovery procedures
