import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { client_id, contract_type, contract_title, contract_value, start_date, end_date, template_data } = await req.json();

        // Get client details
        const clients = await base44.entities.BusinessClient.filter({ id: client_id });
        const client = clients[0];

        if (!client) {
            return Response.json({ error: 'Client not found' }, { status: 404 });
        }

        const contractPrompt = `Generate a professional ${contract_type.replace('_', ' ')} contract with the following details:

Contract Title: ${contract_title}
Provider: ${user.full_name}
Provider Email: ${user.email}

Client Company: ${client.company_name}
Client Contact: ${client.contact_name}
Client Email: ${client.email}
Client Address: ${client.address || 'Not provided'}

Contract Value: $${contract_value || 'TBD'}
Start Date: ${start_date || 'TBD'}
End Date: ${end_date || 'TBD'}
Payment Terms: ${client.payment_terms || 'Net 30'}

Generate a complete, legally-sound contract with:
1. Clear scope of work
2. Payment terms and schedule
3. Deliverables and timelines
4. Confidentiality clauses
5. Termination conditions
6. Liability limitations
7. Signature blocks for both parties

Make it professional, clear, and enforceable. Return the full contract text.`;

        const contract = await base44.integrations.Core.InvokeLLM({
            prompt: contractPrompt,
            response_json_schema: {
                type: 'object',
                properties: {
                    contract_content: { type: 'string' },
                    key_terms: { type: 'array', items: { type: 'string' } }
                }
            }
        });

        return Response.json({
            success: true,
            contract_content: contract.contract_content,
            key_terms: contract.key_terms
        });

    } catch (error) {
        console.error('Contract generation error:', error);
        return Response.json({ 
            error: error.message,
            success: false 
        }, { status: 500 });
    }
});