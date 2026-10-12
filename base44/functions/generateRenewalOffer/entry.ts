import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { property_id, proposed_lease_term_months = 12 } = await req.json();

        // Fetch property details
        const properties = await base44.asServiceRole.entities.Property.filter({ id: property_id });
        if (!properties.length || properties[0].created_by !== user.email) {
            return Response.json({ error: 'Property not found' }, { status: 404 });
        }

        const property = properties[0];

        if (!property.tenant_email) {
            return Response.json({ error: 'No tenant assigned to property' }, { status: 400 });
        }

        // Get AI market rate analysis and pricing suggestion
        const marketAnalysisPrompt = `You are a real estate pricing analyst. Analyze the market and suggest an optimal renewal rent price.

CURRENT PROPERTY:
- Property: ${property.name}
- Address: ${property.address || 'N/A'}
- Type: ${property.property_type}
- Current Rent: $${property.monthly_rent}
- Square Footage: ${property.square_footage || 'N/A'}
- Current Value: $${property.current_value || 'N/A'}

MARKET CONTEXT:
- Current lease ending: ${property.lease_end_date}
- Tenant has been in property since: ${property.lease_start_date}

Provide:
1. Recommended monthly rent for renewal (be fair and market-competitive)
2. Percentage adjustment from current rent
3. Brief market analysis (2-3 sentences on local trends)
4. Justification for the price adjustment

Return structured JSON.`;

        const marketAnalysis = await base44.asServiceRole.integrations.Core.InvokeLLM({
            prompt: marketAnalysisPrompt,
            add_context_from_internet: true,
            response_json_schema: {
                type: 'object',
                properties: {
                    recommended_rent: { type: 'number' },
                    adjustment_percentage: { type: 'number' },
                    market_analysis: { type: 'string' },
                    justification: { type: 'string' }
                },
                required: ['recommended_rent', 'adjustment_percentage', 'market_analysis']
            }
        });

        // Calculate renewal dates
        const currentEndDate = new Date(property.lease_end_date);
        const proposedStartDate = new Date(currentEndDate);
        proposedStartDate.setDate(proposedStartDate.getDate() + 1);
        
        const proposedEndDate = new Date(proposedStartDate);
        proposedEndDate.setMonth(proposedEndDate.getMonth() + proposed_lease_term_months);

        // Generate renewal terms
        const renewalTermsPrompt = `Generate professional renewal lease terms for:
- Current rent: $${property.monthly_rent}
- Proposed rent: $${marketAnalysis.recommended_rent}
- Lease term: ${proposed_lease_term_months} months
- Property: ${property.name}

Include standard clauses about rent increase, maintenance responsibilities, and renewal conditions. Keep it concise but complete (3-4 paragraphs).`;

        const renewalTerms = await base44.asServiceRole.integrations.Core.InvokeLLM({
            prompt: renewalTermsPrompt
        });

        // Create renewal offer
        const offerExpiresOn = new Date();
        offerExpiresOn.setDate(offerExpiresOn.getDate() + 14); // 14 days to respond

        const renewal = await base44.asServiceRole.entities.LeaseRenewal.create({
            property_id: property.id,
            property_name: property.name,
            tenant_email: property.tenant_email,
            tenant_name: property.tenant_name,
            current_lease_end_date: property.lease_end_date,
            current_monthly_rent: property.monthly_rent,
            proposed_lease_start_date: proposedStartDate.toISOString().split('T')[0],
            proposed_lease_end_date: proposedEndDate.toISOString().split('T')[0],
            proposed_monthly_rent: marketAnalysis.recommended_rent,
            market_rate_analysis: `${marketAnalysis.market_analysis}\n\n${marketAnalysis.justification}`,
            rent_adjustment_percentage: marketAnalysis.adjustment_percentage,
            renewal_terms: renewalTerms,
            status: 'pending',
            expires_on: offerExpiresOn.toISOString().split('T')[0],
            created_by: user.email
        });

        // Notify tenant
        await base44.asServiceRole.functions.invoke('createTenantNotification', {
            tenant_email: property.tenant_email,
            property_id: property.id,
            property_name: property.name,
            notification_type: 'announcement',
            title: 'Lease Renewal Offer Available',
            message: `A lease renewal offer is ready for ${property.name}. The proposed rent is $${marketAnalysis.recommended_rent}/month. Please review and respond by ${offerExpiresOn.toLocaleDateString()}.`,
            priority: 'high',
            metadata: {
                renewal_id: renewal.id,
                proposed_rent: marketAnalysis.recommended_rent,
                expires_on: offerExpiresOn.toISOString()
            }
        });

        return Response.json({
            success: true,
            renewal_offer: renewal,
            message: 'Renewal offer created and tenant notified'
        });

    } catch (error) {
        console.error('Generate renewal offer error:', error);
        return Response.json({ 
            error: error.message,
            success: false 
        }, { status: 500 });
    }
});