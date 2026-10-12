import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe@14.11.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
    apiVersion: '2023-10-16'
});

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get customer ID from subscription
        const subs = await base44.entities.Subscription_Plan.filter({ 
            created_by: user.email 
        });

        if (!subs.length || !subs[0].stripe_customer_id) {
            return Response.json({ error: 'No subscription found' }, { status: 404 });
        }

        // Create portal session
        const session = await stripe.billingPortal.sessions.create({
            customer: subs[0].stripe_customer_id,
            return_url: `${req.headers.get('origin')}/Dashboard`
        });

        return Response.json({
            success: true,
            portal_url: session.url
        });

    } catch (error) {
        console.error('Portal session error:', error);
        return Response.json({ 
            error: error.message,
            success: false 
        }, { status: 500 });
    }
});