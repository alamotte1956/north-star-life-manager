import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { contract_id } = await req.json();

        const contracts = await base44.entities.Contract.filter({ id: contract_id });
        const contract = contracts[0];

        if (!contract) {
            return Response.json({ error: 'Contract not found' }, { status: 404 });
        }

        // Get client
        const clients = await base44.entities.BusinessClient.filter({ id: contract.client_id });
        const client = clients[0];

        // Send email with contract for signature
        const emailBody = `Dear ${client.contact_name},

Please review and sign the following contract:

Title: ${contract.contract_title}
Type: ${contract.contract_type.replace('_', ' ')}
${contract.contract_value ? `Value: $${contract.contract_value.toLocaleString()}` : ''}

Contract Details:
${contract.contract_content}

To sign this contract, please reply to this email with "I AGREE" or contact us to discuss any changes.

Best regards,
${user.full_name}`;

        await base44.integrations.Core.SendEmail({
            to: client.email,
            subject: `Contract for Signature: ${contract.contract_title}`,
            body: emailBody
        });

        // Update contract status
        await base44.entities.Contract.update(contract_id, {
            status: 'sent'
        });

        return Response.json({
            success: true,
            message: 'E-signature request sent to client'
        });

    } catch (error) {
        console.error('E-signature request error:', error);
        return Response.json({ 
            error: error.message,
            success: false 
        }, { status: 500 });
    }
});