import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe@14.11.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
    apiVersion: '2023-10-16'
});

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    
    const sig = req.headers.get('stripe-signature');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

    let event;

    try {
        const body = await req.text();
        event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return Response.json({ error: 'Invalid signature' }, { status: 400 });
    }

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object;
                const subscription = await stripe.subscriptions.retrieve(session.subscription);
                
                // Create or update subscription in database
                const existingSubs = await base44.asServiceRole.entities.Subscription_Plan.filter({
                    stripe_customer_id: session.customer
                });

                const subData = {
                    stripe_subscription_id: subscription.id,
                    stripe_customer_id: session.customer,
                    plan_name: session.metadata.plan_id,
                    status: subscription.status,
                    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
                    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                    cancel_at_period_end: subscription.cancel_at_period_end,
                    created_by: session.metadata.user_email
                };

                if (existingSubs.length > 0) {
                    await base44.asServiceRole.entities.Subscription_Plan.update(existingSubs[0].id, subData);
                } else {
                    await base44.asServiceRole.entities.Subscription_Plan.create(subData);
                }
                break;
            }

            case 'customer.subscription.updated': {
                const subscription = event.data.object;
                
                const subs = await base44.asServiceRole.entities.Subscription_Plan.filter({
                    stripe_subscription_id: subscription.id
                });

                if (subs.length > 0) {
                    await base44.asServiceRole.entities.Subscription_Plan.update(subs[0].id, {
                        status: subscription.status,
                        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
                        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                        cancel_at_period_end: subscription.cancel_at_period_end
                    });
                }
                break;
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object;
                
                const subs = await base44.asServiceRole.entities.Subscription_Plan.filter({
                    stripe_subscription_id: subscription.id
                });

                if (subs.length > 0) {
                    await base44.asServiceRole.entities.Subscription_Plan.update(subs[0].id, {
                        status: 'cancelled'
                    });
                }
                break;
            }
        }

        return Response.json({ received: true });

    } catch (error) {
        console.error('Webhook processing error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});