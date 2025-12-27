import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { createClient } from 'npm:@supabase/supabase-js@2.39.0';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Initialize Supabase client with user's anon key (RLS enforced)
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL'),
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
            {
                global: {
                    headers: {
                        'user-email': user.email
                    }
                }
            }
        );

        const { filter, limit = 100 } = await req.json().catch(() => ({}));

        // Get user's family_id
        const base44Users = await base44.entities.User.filter({ email: user.email });
        const family_id = base44Users[0]?.family_id;

        // Query documents with RLS - user sees their family's documents
        let query = supabase
            .from('documents')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit);

        // If user has family_id, filter by family, otherwise filter by user email
        if (family_id) {
            query = query.eq('family_id', family_id);
        } else {
            query = query.eq('user_email', user.email);
        }

        // Apply filters
        if (filter) {
            if (filter.category) {
                query = query.eq('category', filter.category);
            }
            if (filter.linked_entity_id) {
                query = query.eq('linked_entity_id', filter.linked_entity_id);
            }
            if (filter.cabin_related) {
                query = query.eq('cabin_related', filter.cabin_related);
            }
        }

        const { data, error } = await query;

        if (error) {
            console.error('Supabase query error:', error);
            return Response.json({ error: error.message }, { status: 500 });
        }

        return Response.json({
            success: true,
            documents: data
        });

    } catch (error) {
        console.error('Get documents error:', error);
        return Response.json({ 
            error: error.message,
            success: false 
        }, { status: 500 });
    }
});