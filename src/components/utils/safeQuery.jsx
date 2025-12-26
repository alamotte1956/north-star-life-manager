import { base44 } from '@/api/base44Client';

/**
 * Safe query helper - automatically scopes queries by current user
 * Prevents data leakage and security scan failures
 */

async function getMe() {
    return await base44.auth.me();
}

/**
 * List entities scoped to current user
 * @param {Object} entity - Entity to query (e.g., base44.entities.Document)
 * @param {Object} opts - Options
 * @param {string} opts.order - Sort order (e.g., '-created_date')
 * @param {Object} opts.extraFilter - Additional filters to apply
 * @param {number} opts.limit - Result limit
 */
export async function listMine(entity, opts = {}) {
    const { order = '-created_date', extraFilter = null, limit = null } = opts;

    const me = await getMe();
    const email = me?.email;

    if (!email) {
        throw new Error('User not authenticated');
    }

    // Server-side filtering
    const filter = { created_by: email, ...(extraFilter || {}) };
    const results = await entity.filter(filter, order, limit);
    
    return results || [];
}

/**
 * Filter entities with automatic user scoping
 */
export async function filterMine(entity, filter = {}, order = '-created_date', limit = null) {
    const me = await getMe();
    const email = me?.email;

    if (!email) {
        throw new Error('User not authenticated');
    }

    const scopedFilter = { created_by: email, ...filter };
    return await entity.filter(scopedFilter, order, limit);
}