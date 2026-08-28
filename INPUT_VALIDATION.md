# Input Validation Examples

This document provides examples of proper input validation for function endpoints.

## General Validation Principles

1. **Always validate user input** - Never trust data from the client
2. **Fail early** - Validate inputs at the start of the function
3. **Provide clear error messages** - Help developers debug issues
4. **Use allowlists** - Define what is allowed, not what is blocked
5. **Sanitize before use** - Clean data before processing

## Common Validation Patterns

### Required String Field
```typescript
if (!fieldName || typeof fieldName !== 'string') {
    return Response.json({ error: 'Field name is required' }, { status: 400 });
}

if (fieldName.length > MAX_LENGTH) {
    return Response.json({ error: `Field too long (max ${MAX_LENGTH} characters)` }, { status: 400 });
}
```

### Email Validation
```typescript
if (!email || typeof email !== 'string' || !email.includes('@')) {
    return Response.json({ error: 'Valid email is required' }, { status: 400 });
}

// For more strict validation, use a regex or validation library
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
    return Response.json({ error: 'Invalid email format' }, { status: 400 });
}
```

### Phone Number Validation
```typescript
if (!phone || typeof phone !== 'string') {
    return Response.json({ error: 'Phone number is required' }, { status: 400 });
}

const cleanedPhone = phone.replace(/\D/g, '');
if (cleanedPhone.length < 10 || cleanedPhone.length > 15) {
    return Response.json({ error: 'Invalid phone number format' }, { status: 400 });
}

// For international numbers, consider using libphonenumber
```

### Numeric Value Validation
```typescript
if (typeof amount !== 'number' || isNaN(amount)) {
    return Response.json({ error: 'Amount must be a valid number' }, { status: 400 });
}

if (amount < MIN_VALUE || amount > MAX_VALUE) {
    return Response.json({ error: `Amount must be between ${MIN_VALUE} and ${MAX_VALUE}` }, { status: 400 });
}
```

### Date Validation
```typescript
if (!date || isNaN(Date.parse(date))) {
    return Response.json({ error: 'Valid date is required' }, { status: 400 });
}

// Ensure date is in the future
if (new Date(date) < new Date()) {
    return Response.json({ error: 'Date must be in the future' }, { status: 400 });
}
```

### Enum/Allowlist Validation
```typescript
const validActions = ['create', 'update', 'delete'];
if (!action || !validActions.includes(action)) {
    return Response.json({ error: 'Invalid action' }, { status: 400 });
}
```

### Array Validation
```typescript
if (!Array.isArray(items)) {
    return Response.json({ error: 'Items must be an array' }, { status: 400 });
}

if (items.length === 0 || items.length > MAX_ITEMS) {
    return Response.json({ error: `Array must contain 1-${MAX_ITEMS} items` }, { status: 400 });
}

// Validate each item
for (const item of items) {
    if (!item.id || typeof item.id !== 'string') {
        return Response.json({ error: 'Each item must have a valid ID' }, { status: 400 });
    }
}
```

### Object Validation
```typescript
if (!data || typeof data !== 'object') {
    return Response.json({ error: 'Data object is required' }, { status: 400 });
}

// Prevent restricted fields from being updated
const restrictedFields = ['id', 'created_at', 'created_by'];
const hasRestrictedFields = Object.keys(data).some(key => restrictedFields.includes(key));

if (hasRestrictedFields) {
    return Response.json({ 
        error: 'Cannot update restricted fields: ' + restrictedFields.join(', ') 
    }, { status: 400 });
}
```

### ID Validation
```typescript
if (!id || typeof id !== 'string') {
    return Response.json({ error: 'ID is required' }, { status: 400 });
}

// For UUIDs
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
if (!uuidRegex.test(id)) {
    return Response.json({ error: 'Invalid ID format' }, { status: 400 });
}
```

## Real-World Examples

### categorizeSingleTransaction.ts
```typescript
const { merchant, description, amount } = await req.json();

// Validate description
if (!description || typeof description !== 'string') {
    return Response.json({ error: 'Description is required and must be a string' }, { status: 400 });
}

if (description.length > 500) {
    return Response.json({ error: 'Description too long (max 500 characters)' }, { status: 400 });
}

// Validate amount
if (typeof amount !== 'number' || isNaN(amount)) {
    return Response.json({ error: 'Amount must be a valid number' }, { status: 400 });
}

// Validate merchant
if (!merchant || typeof merchant !== 'string') {
    return Response.json({ error: 'Merchant is required and must be a string' }, { status: 400 });
}

if (merchant.length > 200) {
    return Response.json({ error: 'Merchant name too long (max 200 characters)' }, { status: 400 });
}
```

### processRentPayment.ts
```typescript
const { action, payment_id } = await req.json();

// Validate action using allowlist
const validActions = ['create_payment_intent', 'confirm_payment', 'record_manual_payment'];
if (!action || !validActions.includes(action)) {
    return Response.json({ error: 'Invalid action' }, { status: 400 });
}

// Validate payment ID
if (!payment_id || typeof payment_id !== 'string') {
    return Response.json({ error: 'Payment ID is required' }, { status: 400 });
}
```

### createVideoMeeting.ts
```typescript
const { booking_id, professional_email, user_email, service_type, appointment_date, duration_minutes = 60 } = await req.json();

// Validate emails
if (!professional_email || !professional_email.includes('@')) {
    return Response.json({ error: 'Valid professional email is required' }, { status: 400 });
}

// Validate date and ensure it's in the future
if (!appointment_date || isNaN(Date.parse(appointment_date))) {
    return Response.json({ error: 'Valid appointment date is required' }, { status: 400 });
}

if (new Date(appointment_date) < new Date()) {
    return Response.json({ error: 'Appointment date must be in the future' }, { status: 400 });
}

// Validate numeric range
if (duration_minutes < 15 || duration_minutes > 480) {
    return Response.json({ error: 'Duration must be between 15 and 480 minutes' }, { status: 400 });
}
```

## Sanitization

In addition to validation, always sanitize data:

### HTML/XSS Prevention
```typescript
import DOMPurify from 'dompurify';

// Sanitize HTML content
const cleanHtml = DOMPurify.sanitize(userInput);
```

### SQL Injection Prevention
```typescript
// Use parameterized queries - NEVER concatenate user input into SQL
const results = await db.query(
    'SELECT * FROM users WHERE email = $1',
    [userEmail]
);
```

### Command Injection Prevention
```typescript
// NEVER pass user input directly to shell commands
// If you must use shell commands, use allowlists and escape properly
const allowedCommands = ['status', 'list', 'info'];
if (!allowedCommands.includes(command)) {
    throw new Error('Invalid command');
}
```

## Testing Validation

Always test your validation with:
- Missing required fields
- Wrong data types
- Out-of-range values
- Special characters
- Very long strings
- Malicious input (XSS, SQL injection attempts)
- Edge cases (empty arrays, null values, etc.)

## Resources

- [OWASP Input Validation Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html)
- [OWASP XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [Zod - TypeScript schema validation](https://github.com/colinhacks/zod)
