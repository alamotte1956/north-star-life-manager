import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { action, payment_id } = await req.json();

        if (action === 'create_payment_intent') {
            // Fetch payment from DB - don't trust client data
            const payment = await base44.asServiceRole.entities.RentPayment.filter({ id: payment_id });
            if (!payment || payment.length === 0) {
                return Response.json({ error: 'Payment not found' }, { status: 404 });
            }
            
            const paymentData = payment[0];
            
            // Verify user has access to this payment (is the tenant or property owner)
            const property = await base44.asServiceRole.entities.Property.filter({ id: paymentData.property_id });
            if (!property || property.length === 0) {
                return Response.json({ error: 'Property not found' }, { status: 404 });
            }
            
            const propertyData = property[0];
            if (user.email !== paymentData.tenant_email && user.email !== propertyData.created_by) {
                return Response.json({ error: 'Unauthorized' }, { status: 403 });
            }

            // Create Stripe payment intent with server-validated data
            const paymentIntent = await stripe.paymentIntents.create({
                amount: Math.round(paymentData.amount * 100), // Convert to cents
                currency: 'usd',
                metadata: {
                    payment_id: paymentData.id,
                    property_id: paymentData.property_id,
                    tenant_email: paymentData.tenant_email,
                    type: 'rent_payment'
                },
                automatic_payment_methods: {
                    enabled: true
                }
            });

            // Update payment record with Stripe ID
            await base44.asServiceRole.entities.RentPayment.update(payment_id, {
                stripe_payment_id: paymentIntent.id
            });

            return Response.json({
                success: true,
                client_secret: paymentIntent.client_secret,
                payment_intent_id: paymentIntent.id
            });
        }

        if (action === 'confirm_payment') {
            // Verify payment exists and user has access
            const payment = await base44.asServiceRole.entities.RentPayment.filter({ id: payment_id });
            if (!payment || payment.length === 0) {
                return Response.json({ error: 'Payment not found' }, { status: 404 });
            }
            
            const paymentData = payment[0];
            const property = await base44.asServiceRole.entities.Property.filter({ id: paymentData.property_id });
            if (!property || property.length === 0) {
                return Response.json({ error: 'Property not found' }, { status: 404 });
            }
            
            const propertyData = property[0];
            if (user.email !== paymentData.tenant_email && user.email !== propertyData.created_by) {
                return Response.json({ error: 'Unauthorized' }, { status: 403 });
            }

            // Mark payment as paid
            await base44.asServiceRole.entities.RentPayment.update(payment_id, {
                status: 'paid',
                payment_date: new Date().toISOString(),
                payment_method: 'online'
            });

            return Response.json({
                success: true,
                message: 'Payment confirmed'
            });
        }

        if (action === 'record_manual_payment') {
            // Verify payment exists and user is the property owner (not tenant)
            const payment = await base44.asServiceRole.entities.RentPayment.filter({ id: payment_id });
            if (!payment || payment.length === 0) {
                return Response.json({ error: 'Payment not found' }, { status: 404 });
            }
            
            const paymentData = payment[0];
            const property = await base44.asServiceRole.entities.Property.filter({ id: paymentData.property_id });
            if (!property || property.length === 0) {
                return Response.json({ error: 'Property not found' }, { status: 404 });
            }
            
            const propertyData = property[0];
            // Only property owner can manually record payments
            if (user.email !== propertyData.created_by) {
                return Response.json({ error: 'Only property owner can manually record payments' }, { status: 403 });
            }

            // Record payment made outside the system
            const { payment_method, payment_date, notes } = await req.json();

            await base44.asServiceRole.entities.RentPayment.update(payment_id, {
                status: 'paid',
                payment_date: payment_date || new Date().toISOString(),
                payment_method: payment_method || 'check',
                notes
            });

            return Response.json({
                success: true,
                message: 'Payment recorded'
            });
        }

        return Response.json({
            error: 'Invalid action',
            success: false
        }, { status: 400 });

    } catch (error) {
        console.error('Payment processing error:', error);
        return Response.json({ 
            error: error.message,
            success: false 
        }, { status: 500 });
    }
});