import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { document_id, file_url } = await req.json();

        // Extract text and analyze lease terms using AI
        const aiPrompt = `You are a legal document analysis AI. Analyze this lease agreement document and extract ALL key information.

Extract and structure the following information from the lease document:

REQUIRED FIELDS:
- landlord_name: Full name of landlord/property owner
- tenant_name: Full name of tenant(s)
- property_address: Complete property address
- lease_start_date: Start date (YYYY-MM-DD format)
- lease_end_date: End date (YYYY-MM-DD format)
- monthly_rent: Monthly rent amount (number only, no symbols)
- security_deposit: Security deposit amount (number only)
- late_fee_amount: Late payment fee (number only)
- late_fee_grace_days: Days before late fee applies (number)

OPTIONAL FIELDS:
- utilities_included: List of utilities included in rent
- pet_policy: Pet restrictions or allowances
- maintenance_responsibilities: Who handles what maintenance
- renewal_terms: Lease renewal conditions
- termination_clause: Early termination conditions
- parking_details: Parking information
- special_clauses: Any special provisions or addendums

Analyze the document image and return structured JSON. If a field is not found, set it to null.`;

        const aiResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
            prompt: aiPrompt,
            file_urls: [file_url],
            response_json_schema: {
                type: 'object',
                properties: {
                    landlord_name: { type: 'string' },
                    tenant_name: { type: 'string' },
                    property_address: { type: 'string' },
                    lease_start_date: { type: 'string' },
                    lease_end_date: { type: 'string' },
                    monthly_rent: { type: 'number' },
                    security_deposit: { type: 'number' },
                    late_fee_amount: { type: 'number' },
                    late_fee_grace_days: { type: 'number' },
                    utilities_included: { type: 'array', items: { type: 'string' } },
                    pet_policy: { type: 'string' },
                    maintenance_responsibilities: { type: 'string' },
                    renewal_terms: { type: 'string' },
                    termination_clause: { type: 'string' },
                    parking_details: { type: 'string' },
                    special_clauses: { type: 'array', items: { type: 'string' } }
                }
            }
        });

        // Update document with extracted lease data
        if (document_id) {
            await base44.asServiceRole.entities.Document.update(document_id, {
                document_type: 'Lease Agreement',
                category: 'legal',
                extracted_data: aiResponse,
                analysis_status: 'completed'
            });
        }

        return Response.json({
            success: true,
            lease_data: aiResponse,
            message: 'Lease agreement analyzed successfully'
        });

    } catch (error) {
        console.error('Lease analysis error:', error);
        return Response.json({ 
            error: error.message,
            success: false 
        }, { status: 500 });
    }
});