import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { action, payment_id, amount, property_id, tenant_email } = await req.json();

        if (action === 'create_payment_intent') {
            // Create Stripe payment intent for rent payment
            const paymentIntent = await stripe.paymentIntents.create({
                amount: Math.round(amount * 100), // Convert to cents
                currency: 'usd',
                metadata: {
                    payment_id,
                    property_id,
                    tenant_email,
                    type: 'rent_payment'
                },
                automatic_payment_methods: {
                    enabled: true
                }
            });

            // Update payment record with Stripe ID
            await base44.entities.RentPayment.update(payment_id, {
                stripe_payment_id: paymentIntent.id
            });

            return Response.json({
                success: true,
                client_secret: paymentIntent.client_secret,
                payment_intent_id: paymentIntent.id
            });
        }

        if (action === 'confirm_payment') {
            // Mark payment as paid
            await base44.entities.RentPayment.update(payment_id, {
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
            // Record payment made outside the system
            const { payment_method, payment_date, notes } = await req.json();

            await base44.entities.RentPayment.update(payment_id, {
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