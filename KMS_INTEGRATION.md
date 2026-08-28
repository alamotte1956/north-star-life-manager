# AWS KMS Integration for North Star Life Manager

## Overview

This application uses AWS Key Management Service (KMS) for secure encryption of sensitive data, ensuring HIPAA compliance and robust security practices.

## Features

### 1. **Envelope Encryption Pattern**
- Master key stored in AWS KMS
- Data keys generated per encryption operation
- AES-256-GCM encryption for all sensitive data

### 2. **Encrypted Data Types**
- **HealthRecord**: Medical records, provider contacts, summaries
- **PII (Personally Identifiable Information)**: Email, names, addresses, SSNs
- **Transaction Data**: Merchant patterns, financial categorization rules
- **Document Metadata**: File paths, URLs, user information
- **Tax Data**: Taxpayer information, financial summaries

### 3. **Security Features**
- ✅ KMS-managed encryption keys
- ✅ 90-day key rotation policy
- ✅ Audit logging for all cryptographic operations
- ✅ HTTPS enforcement via Strict-Transport-Security headers
- ✅ AES-256-GCM encryption algorithm
- ✅ Secure key memory management (zero-fill after use)

## Setup

### 1. AWS KMS Setup

1. **Create KMS Key in AWS Console**:
   ```bash
   aws kms create-key --description "North Star Life Manager encryption key"
   ```

2. **Create Key Alias**:
   ```bash
   aws kms create-alias \
     --alias-name alias/north-star-life-manager \
     --target-key-id <your-key-id>
   ```

3. **Enable Automatic Key Rotation**:
   ```bash
   aws kms enable-key-rotation --key-id <your-key-id>
   ```

### 2. Environment Configuration

Copy `.env.example` to `.env` and configure:

```bash
AWS_KMS_KEY_ID=alias/north-star-life-manager
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
```

### 3. IAM Permissions

Create an IAM policy with these permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "kms:GenerateDataKey",
        "kms:Decrypt",
        "kms:DescribeKey"
      ],
      "Resource": "arn:aws:kms:us-east-1:ACCOUNT_ID:key/*"
    }
  ]
}
```

## Usage

### Encrypting Data

```typescript
import { encryptData, encryptSensitiveFields } from './lib/kmsService.ts';

// Encrypt a single string
const encrypted = await encryptData('sensitive data');

// Encrypt specific fields in an object
const userData = {
  name: 'John Doe',
  email: 'john@example.com',
  age: 30
};
const encryptedUser = await encryptSensitiveFields(userData, ['name', 'email']);
```

### Decrypting Data

```typescript
import { decryptData, decryptSensitiveFields } from './lib/kmsService.ts';

// Decrypt a single string
const decrypted = await decryptData(encrypted);

// Decrypt specific fields in an object
const decryptedUser = await decryptSensitiveFields(encryptedUser, ['name', 'email']);
```

### Audit Logging

All cryptographic operations are automatically logged:

```typescript
import { auditLog } from './lib/kmsService.ts';

// Manual audit log
auditLog('CUSTOM_EVENT', {
  userId: user.id,
  operation: 'data_access'
});
```

## Affected Functions

The following serverless functions have been updated with KMS encryption:

1. **analyzeHealthRecord.ts** - Encrypts health record analysis data
2. **sanitizePII.ts** - Encrypts all PII data instead of anonymization
3. **supabaseUploadDocument.ts** - Encrypts document metadata
4. **categorizeTransaction.ts** - Encrypts transaction merchant patterns
5. **exportToTaxSoftware.ts** - Encrypts taxpayer information

## Security Headers

The `_middleware.ts` enforces the following security headers:

- **Strict-Transport-Security**: Forces HTTPS connections (max-age: 1 year)
- **Content-Security-Policy**: Restricts resource loading
- **X-Frame-Options**: Prevents clickjacking
- **X-Content-Type-Options**: Prevents MIME sniffing

## Key Rotation

### Automatic Rotation (Recommended)
Enable automatic rotation in AWS KMS Console (rotates yearly).

### Manual Rotation
The service tracks key age and logs warnings when keys exceed 90 days:

```typescript
import { isKeyRotationNeeded } from './lib/kmsService.ts';

const keyCreatedDate = new Date('2024-01-01');
if (isKeyRotationNeeded(keyCreatedDate)) {
  console.warn('Key rotation needed');
}
```

## HIPAA Compliance

This implementation meets HIPAA requirements:

- ✅ **Encryption at Rest**: All PHI encrypted with AES-256-GCM
- ✅ **Encryption in Transit**: HTTPS enforced via HSTS headers
- ✅ **Key Management**: Centralized key management via AWS KMS
- ✅ **Audit Logging**: All access to encryption keys logged
- ✅ **Access Controls**: IAM-based access to KMS keys
- ✅ **Key Rotation**: 90-day rotation policy

## Testing

### Verify KMS Configuration

```typescript
import { getKMSConfig } from './lib/kmsService.ts';

const config = getKMSConfig();
console.log('KMS Configured:', config.isConfigured);
console.log('Key ID:', config.keyId);
console.log('Region:', config.region);
```

### Test Encryption/Decryption

```typescript
import { encryptData, decryptData } from './lib/kmsService.ts';

const testData = 'Sensitive health information';
const encrypted = await encryptData(testData);
const decrypted = await decryptData(encrypted);

console.assert(testData === decrypted, 'Encryption test failed');
```

## Monitoring

### CloudWatch Logs
All KMS operations are logged to console and can be forwarded to CloudWatch:

```bash
[KMS_AUDIT] {"timestamp":"2024-01-01T00:00:00.000Z","event":"DATA_ENCRYPTED","details":{...}}
```

### Audit Webhook (Optional)
Configure `KMS_AUDIT_WEBHOOK` environment variable to send audit logs to external compliance system.

## Troubleshooting

### Common Issues

1. **"KMS key not found"**
   - Verify `AWS_KMS_KEY_ID` is correct
   - Check IAM permissions

2. **"Access Denied"**
   - Verify IAM policy includes `kms:GenerateDataKey` and `kms:Decrypt`
   - Check AWS credentials are valid

3. **"Region mismatch"**
   - Ensure `AWS_REGION` matches KMS key region

## Security Considerations

- Never commit `.env` files with real credentials
- Rotate AWS access keys regularly
- Monitor KMS usage in AWS CloudTrail
- Set up CloudWatch alarms for unusual KMS activity
- Use separate KMS keys for dev/staging/production

## Support

For issues or questions, refer to:
- [AWS KMS Documentation](https://docs.aws.amazon.com/kms/)
- [HIPAA Compliance Guide](https://aws.amazon.com/compliance/hipaa-compliance/)
