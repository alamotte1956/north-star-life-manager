import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { property_id, lease_terms } = await req.json();

        // Fetch property details
        const properties = await base44.asServiceRole.entities.Property.filter({ id: property_id });
        if (!properties.length || properties[0].created_by !== user.email) {
            return Response.json({ error: 'Property not found' }, { status: 404 });
        }

        const property = properties[0];

        // Generate comprehensive lease agreement using AI
        const aiPrompt = `You are a legal document drafting AI specializing in residential lease agreements. Generate a comprehensive, legally sound lease agreement.

PROPERTY DETAILS:
- Property: ${property.name}
- Address: ${property.address || 'N/A'}
- Type: ${property.property_type}

LEASE TERMS PROVIDED:
${JSON.stringify(lease_terms, null, 2)}

LANDLORD INFORMATION:
- Name: ${user.full_name || 'Property Owner'}
- Contact: ${user.email}

Generate a complete, professional residential lease agreement document that includes:

1. HEADER with property address and parties
2. TERM OF LEASE (start date, end date, duration)
3. RENT DETAILS (amount, due date, payment method, late fees)
4. SECURITY DEPOSIT terms and conditions
5. UTILITIES AND SERVICES responsibilities
6. MAINTENANCE AND REPAIRS obligations
7. USE OF PREMISES and restrictions
8. PETS policy (if applicable)
9. ALTERATIONS AND IMPROVEMENTS
10. RIGHT OF ENTRY for landlord
11. SUBLETTING AND ASSIGNMENT restrictions
12. RENEWAL AND TERMINATION conditions
13. DEFAULT AND REMEDIES
14. NOTICES procedures
15. GENERAL PROVISIONS (governing law, severability, etc.)
16. SIGNATURE BLOCKS for landlord and tenant

Use proper legal language, be thorough, and include standard protective clauses for both parties. Format the document professionally with clear sections and numbering.

Return the complete lease document as formatted text with proper headings and structure.`;

        const leaseDocument = await base44.asServiceRole.integrations.Core.InvokeLLM({
            prompt: aiPrompt
        });

        // Create document record
        const doc = await base44.asServiceRole.entities.Document.create({
            title: `Lease Agreement - ${property.name} - ${lease_terms.tenant_name || 'Tenant'}`,
            document_type: 'Generated Lease Agreement',
            category: 'legal',
            linked_entity_type: 'Property',
            linked_entity_id: property_id,
            linked_entity_name: property.name,
            extracted_data: lease_terms,
            ai_summary: `Lease agreement for ${property.name} from ${lease_terms.lease_start_date} to ${lease_terms.lease_end_date}`,
            notes: leaseDocument,
            analysis_status: 'completed',
            created_by: user.email
        });

        return Response.json({
            success: true,
            document_id: doc.id,
            lease_content: leaseDocument,
            message: 'Lease agreement generated successfully'
        });

    } catch (error) {
        console.error('Lease generation error:', error);
        return Response.json({ 
            error: error.message,
            success: false 
        }, { status: 500 });
    }
});