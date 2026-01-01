/**
 * AWS KMS Service for Secure Key Management
 * Provides encryption/decryption using AWS KMS with envelope encryption
 * HIPAA-compliant encryption for sensitive data (HealthRecord, PII, Transactions)
 */

import { KMSClient, GenerateDataKeyCommand, DecryptCommand } from 'npm:@aws-sdk/client-kms@3';

// KMS Configuration
const KMS_KEY_ID = Deno.env.get('AWS_KMS_KEY_ID') || 'alias/north-star-life-manager';
const AWS_REGION = Deno.env.get('AWS_REGION') || 'us-east-1';

// Key rotation policy: 90 days
const KEY_ROTATION_DAYS = 90;

// Initialize KMS client
let kmsClient: KMSClient | null = null;

function getKMSClient(): KMSClient {
    if (!kmsClient) {
        kmsClient = new KMSClient({ 
            region: AWS_REGION,
            credentials: {
                accessKeyId: Deno.env.get('AWS_ACCESS_KEY_ID') || '',
                secretAccessKey: Deno.env.get('AWS_SECRET_ACCESS_KEY') || '',
            }
        });
    }
    return kmsClient;
}

/**
 * Audit logger for cryptographic operations
 */
export function auditLog(event: string, details: Record<string, any>, error?: Error) {
    const logEntry = {
        timestamp: new Date().toISOString(),
        event,
        details,
        error: error ? { message: error.message, stack: error.stack } : null,
        severity: error ? 'ERROR' : 'INFO'
    };
    
    console.log(`[KMS_AUDIT] ${JSON.stringify(logEntry)}`);
    
    // In production, send to centralized logging (CloudWatch, Datadog, etc.)
    if (Deno.env.get('KMS_AUDIT_WEBHOOK')) {
        // Send audit logs to webhook for compliance tracking
        fetch(Deno.env.get('KMS_AUDIT_WEBHOOK')!, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(logEntry)
        }).catch(err => console.error('Failed to send audit log:', err));
    }
}

/**
 * Generate a data key using KMS (envelope encryption pattern)
 * Returns both encrypted and plaintext data keys
 */
export async function generateDataKey(): Promise<{ plaintextKey: Uint8Array, encryptedKey: Uint8Array }> {
    try {
        const client = getKMSClient();
        const command = new GenerateDataKeyCommand({
            KeyId: KMS_KEY_ID,
            KeySpec: 'AES_256'
        });
        
        const response = await client.send(command);
        
        if (!response.Plaintext || !response.CiphertextBlob) {
            throw new Error('KMS GenerateDataKey failed to return keys');
        }
        
        auditLog('DATA_KEY_GENERATED', {
            keyId: KMS_KEY_ID,
            keySpec: 'AES_256'
        });
        
        return {
            plaintextKey: response.Plaintext,
            encryptedKey: response.CiphertextBlob
        };
    } catch (error) {
        auditLog('DATA_KEY_GENERATION_FAILED', { keyId: KMS_KEY_ID }, error as Error);
        throw new Error(`Failed to generate data key: ${(error as Error).message}`);
    }
}

/**
 * Decrypt a data key using KMS
 */
export async function decryptDataKey(encryptedKey: Uint8Array): Promise<Uint8Array> {
    try {
        const client = getKMSClient();
        const command = new DecryptCommand({
            CiphertextBlob: encryptedKey
        });
        
        const response = await client.send(command);
        
        if (!response.Plaintext) {
            throw new Error('KMS Decrypt failed to return plaintext key');
        }
        
        auditLog('DATA_KEY_DECRYPTED', {
            keyId: response.KeyId
        });
        
        return response.Plaintext;
    } catch (error) {
        auditLog('DATA_KEY_DECRYPTION_FAILED', {}, error as Error);
        throw new Error(`Failed to decrypt data key: ${(error as Error).message}`);
    }
}

/**
 * Encrypt data using AES-256-GCM with KMS-managed key (envelope encryption)
 * Returns base64-encoded encrypted data with metadata
 */
export async function encryptData(plaintext: string): Promise<string> {
    try {
        // Generate data key from KMS
        const { plaintextKey, encryptedKey } = await generateDataKey();
        
        // Generate random IV for AES-GCM
        const iv = crypto.getRandomValues(new Uint8Array(12));
        
        // Import the plaintext key for AES-GCM
        const cryptoKey = await crypto.subtle.importKey(
            'raw',
            plaintextKey,
            { name: 'AES-GCM' },
            false,
            ['encrypt']
        );
        
        // Encrypt the data
        const encoder = new TextEncoder();
        const encryptedData = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv },
            cryptoKey,
            encoder.encode(plaintext)
        );
        
        // Clear the plaintext key from memory
        plaintextKey.fill(0);
        
        // Package: encryptedKey + IV + encryptedData
        const result = {
            encryptedKey: Array.from(encryptedKey),
            iv: Array.from(iv),
            ciphertext: Array.from(new Uint8Array(encryptedData)),
            algorithm: 'AES-256-GCM',
            version: '1.0'
        };
        
        auditLog('DATA_ENCRYPTED', {
            algorithm: 'AES-256-GCM',
            dataSize: plaintext.length
        });
        
        return btoa(JSON.stringify(result));
    } catch (error) {
        auditLog('ENCRYPTION_FAILED', {}, error as Error);
        throw new Error(`Encryption failed: ${(error as Error).message}`);
    }
}

/**
 * Decrypt data using AES-256-GCM with KMS-managed key
 */
export async function decryptData(encryptedPayload: string): Promise<string> {
    try {
        // Parse the encrypted payload
        const payload = JSON.parse(atob(encryptedPayload));
        
        if (payload.version !== '1.0' || payload.algorithm !== 'AES-256-GCM') {
            throw new Error('Unsupported encryption version or algorithm');
        }
        
        // Decrypt the data key using KMS
        const plaintextKey = await decryptDataKey(new Uint8Array(payload.encryptedKey));
        
        // Import the key for decryption
        const cryptoKey = await crypto.subtle.importKey(
            'raw',
            plaintextKey,
            { name: 'AES-GCM' },
            false,
            ['decrypt']
        );
        
        // Decrypt the data
        const decryptedData = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv: new Uint8Array(payload.iv) },
            cryptoKey,
            new Uint8Array(payload.ciphertext)
        );
        
        // Clear the plaintext key from memory
        plaintextKey.fill(0);
        
        const decoder = new TextDecoder();
        const result = decoder.decode(decryptedData);
        
        auditLog('DATA_DECRYPTED', {
            algorithm: payload.algorithm,
            version: payload.version
        });
        
        return result;
    } catch (error) {
        auditLog('DECRYPTION_FAILED', {}, error as Error);
        throw new Error(`Decryption failed: ${(error as Error).message}`);
    }
}

/**
 * Encrypt sensitive object fields
 * Used for encrypting specific fields in HealthRecord, PII, Transaction entities
 */
export async function encryptSensitiveFields(data: Record<string, any>, fieldsToEncrypt: string[]): Promise<Record<string, any>> {
    const encrypted = { ...data };
    
    for (const field of fieldsToEncrypt) {
        if (encrypted[field] != null) {
            encrypted[field] = await encryptData(String(encrypted[field]));
            encrypted[`${field}_encrypted`] = true;
        }
    }
    
    return encrypted;
}

/**
 * Decrypt sensitive object fields
 */
export async function decryptSensitiveFields(data: Record<string, any>, fieldsToDecrypt: string[]): Promise<Record<string, any>> {
    const decrypted = { ...data };
    
    for (const field of fieldsToDecrypt) {
        if (decrypted[field] != null && decrypted[`${field}_encrypted`] === true) {
            decrypted[field] = await decryptData(decrypted[field]);
            delete decrypted[`${field}_encrypted`];
        }
    }
    
    return decrypted;
}

/**
 * Check if key rotation is needed (90-day policy)
 */
export function isKeyRotationNeeded(keyCreatedDate: Date): boolean {
    const daysSinceCreation = Math.floor((Date.now() - keyCreatedDate.getTime()) / (1000 * 60 * 60 * 24));
    return daysSinceCreation >= KEY_ROTATION_DAYS;
}

/**
 * Get KMS configuration status
 */
export function getKMSConfig() {
    return {
        keyId: KMS_KEY_ID,
        region: AWS_REGION,
        rotationDays: KEY_ROTATION_DAYS,
        isConfigured: !!(Deno.env.get('AWS_ACCESS_KEY_ID') && Deno.env.get('AWS_SECRET_ACCESS_KEY'))
    };
}
