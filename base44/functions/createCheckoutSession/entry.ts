import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe@14.11.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
    apiVersion: '2023-10-16'
});

// Get price IDs from environment variables with fallback to hardcoded values
const PRICE_IDS = {
    basic: Deno.env.get('STRIPE_BASIC_PRICE_ID') || 'price_1SiIxfLV02BUsIMDilboDMGv',
    premium: Deno.env.get('STRIPE_PREMIUM_PRICE_ID') || 'price_1SiJ3qLV02BUsIMD0kfW9BqX',
    enterprise: Deno.env.get('STRIPE_ENTERPRISE_PRICE_ID') || 'price_1SiJ4oLV02BUsIMDrmKLoPkY'
};

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Staff and Master Admin users don't need to pay
        if (user.user_type === 'staff' || user.user_type === 'master_admin') {
            return Response.json({ 
                error: 'Staff and Master Admin users have free access',
                user_type: user.user_type
            }, { status: 400 });
        }

        const { plan_id } = await req.json();

        if (!plan_id || !PRICE_IDS[plan_id]) {
            return Response.json({ error: 'Invalid plan_id' }, { status: 400 });
        }

        // Create or retrieve Stripe customer
        let customer;
        const existingSubs = await base44.entities.Subscription_Plan.filter({ 
            created_by: user.email 
        });

        if (existingSubs.length > 0 && existingSubs[0].stripe_customer_id) {
            customer = { id: existingSubs[0].stripe_customer_id };
        } else {
            customer = await stripe.customers.create({
                email: user.email,
                metadata: {
                    user_id: user.id,
                    user_email: user.email
                }
            });
        }

        // Create checkout session with 14-day free trial
        const session = await stripe.checkout.sessions.create({
            customer: customer.id,
            payment_method_types: ['card'],
            line_items: [
                {
                    price: PRICE_IDS[plan_id],
                    quantity: 1
                }
            ],
            mode: 'subscription',
            subscription_data: {
                trial_period_days: 14,
                trial_settings: {
                    end_behavior: {
                        missing_payment_method: 'cancel'
                    }
                }
            },
            success_url: `${req.headers.get('origin')}/Dashboard?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${req.headers.get('origin')}/Pricing`,
            metadata: {
                user_id: user.id,
                user_email: user.email,
                plan_id
            }
        });

        return Response.json({
            success: true,
            checkout_url: session.url
        });

    } catch (error) {
        console.error('Checkout session error:', error);
        return Response.json({ 
            error: error.message,
            success: false 
        }, { status: 500 });
    }
});
