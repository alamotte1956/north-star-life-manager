import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { encryptSensitiveFields, auditLog } from './lib/kmsService.ts';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { record_id } = await req.json();

        const records = await base44.entities.HealthRecord.filter({ id: record_id });
        if (!records || records.length === 0) {
            return Response.json({ error: 'Health record not found' }, { status: 404 });
        }

        const record = records[0];

        // Update status to analyzing
        await base44.asServiceRole.entities.HealthRecord.update(record_id, {
            analysis_status: 'analyzing'
        });

        const analysisPrompt = `Analyze this health record and extract key information:

RECORD TYPE: ${record.record_type}
TITLE: ${record.title}
PROVIDER: ${record.provider_name || 'Not specified'}
DATE: ${record.date || 'Not specified'}
PRESCRIPTION NAME: ${record.prescription_name || 'Not specified'}
DOSAGE: ${record.dosage || 'Not specified'}
PHARMACY: ${record.pharmacy || 'Not specified'}
INSURANCE PROVIDER: ${record.insurance_provider || 'Not specified'}
POLICY NUMBER: ${record.policy_number || 'Not specified'}
NOTES: ${record.notes || 'None'}

Extract and provide:
1. extracted_medications - Array of medications mentioned with dosages
2. extracted_provider_contact - Any contact information for providers
3. extracted_appointment_dates - Future appointment dates mentioned
4. key_findings - Important medical findings or results
5. follow_up_required - Boolean if follow-up is needed
6. follow_up_notes - What follow-up is needed
7. risk_indicators - Any health risks or concerns identified
8. summary - Brief summary of the record`;

        const analysis = await base44.integrations.Core.InvokeLLM({
            prompt: analysisPrompt,
            response_json_schema: {
                type: 'object',
                properties: {
                    extracted_medications: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                name: { type: 'string' },
                                dosage: { type: 'string' }
                            }
                        }
                    },
                    extracted_provider_contact: { type: 'string' },
                    extracted_appointment_dates: {
                        type: 'array',
                        items: { type: 'string' }
                    },
                    key_findings: {
                        type: 'array',
                        items: { type: 'string' }
                    },
                    follow_up_required: { type: 'boolean' },
                    follow_up_notes: { type: 'string' },
                    risk_indicators: {
                        type: 'array',
                        items: { type: 'string' }
                    },
                    summary: { type: 'string' }
                }
            }
        });

        // Encrypt sensitive fields before storing
        const updateData = {
            ai_summary: analysis.summary,
            extracted_medications: analysis.extracted_medications,
            extracted_provider_contact: analysis.extracted_provider_contact,
            extracted_appointment_dates: analysis.extracted_appointment_dates,
            key_findings: analysis.key_findings,
            follow_up_required: analysis.follow_up_required,
            follow_up_notes: analysis.follow_up_notes,
            risk_indicators: analysis.risk_indicators,
            analysis_status: 'completed'
        };

        // Encrypt sensitive PII fields using KMS
        const sensitiveFields = ['extracted_provider_contact', 'ai_summary', 'follow_up_notes'];
        const encryptedData = await encryptSensitiveFields(updateData, sensitiveFields);
        
        auditLog('HEALTH_RECORD_ENCRYPTED', {
            recordId: record_id,
            userId: user.id,
            fieldsEncrypted: sensitiveFields
        });

        // Update record with encrypted information
        await base44.asServiceRole.entities.HealthRecord.update(record_id, encryptedData);

        return Response.json({
            success: true,
            analysis
        });

    } catch (error) {
        console.error('Health record analysis error:', error);
        auditLog('HEALTH_RECORD_ANALYSIS_FAILED', {}, error as Error);
        
        if (req.json && (await req.json()).record_id) {
            const { record_id } = await req.json();
            await base44.asServiceRole.entities.HealthRecord.update(record_id, {
                analysis_status: 'failed'
            });
        }

        return Response.json({
            error: error.message,
            success: false
        }, { status: 500 });
    }
});