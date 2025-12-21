import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch all documents with expiry dates
        const allDocs = await base44.asServiceRole.entities.Document.list();
        const userDocs = allDocs.filter(d => d.created_by === user.email && d.expiry_date);

        const now = new Date();
        const expiringDocs = [];

        userDocs.forEach(doc => {
            const expiryDate = new Date(doc.expiry_date);
            const daysUntilExpiry = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));

            // Categorize by urgency
            if (daysUntilExpiry <= 7 && daysUntilExpiry > 0) {
                expiringDocs.push({
                    ...doc,
                    urgency: 'critical',
                    daysUntilExpiry,
                    message: `Expires in ${daysUntilExpiry} day${daysUntilExpiry === 1 ? '' : 's'}!`
                });
            } else if (daysUntilExpiry <= 30 && daysUntilExpiry > 7) {
                expiringDocs.push({
                    ...doc,
                    urgency: 'warning',
                    daysUntilExpiry,
                    message: `Expires in ${daysUntilExpiry} days`
                });
            } else if (daysUntilExpiry <= 60 && daysUntilExpiry > 30) {
                expiringDocs.push({
                    ...doc,
                    urgency: 'info',
                    daysUntilExpiry,
                    message: `Expires in ${daysUntilExpiry} days`
                });
            } else if (daysUntilExpiry < 0) {
                expiringDocs.push({
                    ...doc,
                    urgency: 'expired',
                    daysUntilExpiry: Math.abs(daysUntilExpiry),
                    message: `Expired ${Math.abs(daysUntilExpiry)} day${Math.abs(daysUntilExpiry) === 1 ? '' : 's'} ago`
                });
            }
        });

        // Sort by urgency and days until expiry
        expiringDocs.sort((a, b) => {
            const urgencyOrder = { expired: 0, critical: 1, warning: 2, info: 3 };
            if (urgencyOrder[a.urgency] !== urgencyOrder[b.urgency]) {
                return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
            }
            return a.daysUntilExpiry - b.daysUntilExpiry;
        });

        return Response.json({
            success: true,
            expiring_documents: expiringDocs,
            summary: {
                expired: expiringDocs.filter(d => d.urgency === 'expired').length,
                critical: expiringDocs.filter(d => d.urgency === 'critical').length,
                warning: expiringDocs.filter(d => d.urgency === 'warning').length,
                info: expiringDocs.filter(d => d.urgency === 'info').length
            }
        });

    } catch (error) {
        console.error('Expiry check error:', error);
        return Response.json({ 
            error: error.message,
            success: false 
        }, { status: 500 });
    }
});