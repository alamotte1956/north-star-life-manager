import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { document_id, action } = await req.json();

        // Get user's family and role
        const users = await base44.entities.User.filter({ email: user.email });
        if (!users.length) {
            return Response.json({ hasPermission: false, reason: 'User not found' });
        }

        const userRecord = users[0];
        const family_id = userRecord.family_id;

        // Admins have all permissions
        if (userRecord.role === 'admin') {
            return Response.json({ hasPermission: true });
        }

        // Get user's role assignment
        const roleAssignments = await base44.entities.FamilyMemberRole.filter({
            family_id,
            user_email: user.email
        });

        if (!roleAssignments.length) {
            return Response.json({ 
                hasPermission: false, 
                reason: 'No role assigned. Contact family admin.' 
            });
        }

        const userRole = roleAssignments[0];
        const permissions = userRole.permissions?.documents || {};

        // Check permission based on action
        const actionMap = {
            'view': permissions.view,
            'edit': permissions.edit,
            'delete': permissions.delete,
            'upload': permissions.edit // upload requires edit permission
        };

        const hasPermission = actionMap[action] === true;

        return Response.json({ 
            hasPermission,
            role: userRole.role_name,
            reason: hasPermission ? null : `Your role (${userRole.role_name}) does not have ${action} permission`
        });
    } catch (error) {
        console.error('Error checking permission:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});