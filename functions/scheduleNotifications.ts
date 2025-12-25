import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // This function runs on a schedule to send push notifications
        // for bills, maintenance, document expiry, etc.
        
        const notifications = [];
        const now = new Date();
        const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
        
        // Get all users with push subscriptions
        const users = await base44.asServiceRole.entities.User.list();
        
        for (const user of users) {
            // Check bills due soon
            const bills = await base44.asServiceRole.entities.BillPayment.filter({
                user_email: user.email,
                status: 'active'
            });
            
            for (const bill of bills) {
                if (bill.next_due_date) {
                    const dueDate = new Date(bill.next_due_date);
                    if (dueDate <= threeDaysFromNow && dueDate >= now) {
                        notifications.push({
                            user_email: user.email,
                            title: '💰 Bill Due Soon',
                            body: `${bill.name} is due on ${dueDate.toLocaleDateString()} - $${bill.amount}`,
                            url: '/BillPayments',
                            priority: 'high',
                            tag: `bill-${bill.id}`
                        });
                    }
                }
            }
            
            // Check document expiry
            const documents = await base44.asServiceRole.entities.Document.filter({
                created_by: user.email
            });
            
            for (const doc of documents) {
                if (doc.expiry_date) {
                    const expiryDate = new Date(doc.expiry_date);
                    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
                    
                    if (expiryDate <= thirtyDaysFromNow && expiryDate >= now) {
                        notifications.push({
                            user_email: user.email,
                            title: '📄 Document Expiring',
                            body: `${doc.title} expires on ${expiryDate.toLocaleDateString()}`,
                            url: '/Vault',
                            priority: 'normal',
                            tag: `doc-${doc.id}`
                        });
                    }
                }
            }
            
            // Check maintenance due
            const maintenance = await base44.asServiceRole.entities.MaintenanceTask.filter({
                created_by: user.email
            });
            
            for (const task of maintenance) {
                if (task.next_due_date) {
                    const dueDate = new Date(task.next_due_date);
                    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
                    
                    if (dueDate <= sevenDaysFromNow && dueDate >= now) {
                        notifications.push({
                            user_email: user.email,
                            title: '🔧 Maintenance Due',
                            body: `${task.title} is due on ${dueDate.toLocaleDateString()}`,
                            url: '/Maintenance',
                            priority: 'normal',
                            tag: `maintenance-${task.id}`
                        });
                    }
                }
            }
        }
        
        // Send all notifications
        let sent = 0;
        for (const notification of notifications) {
            try {
                await base44.asServiceRole.functions.invoke('sendPushNotification', notification);
                sent++;
            } catch (error) {
                console.error('Failed to send notification:', error);
            }
        }
        
        return Response.json({
            success: true,
            checked: users.length,
            notifications_sent: sent
        });
        
    } catch (error) {
        console.error('Schedule notifications error:', error);
        return Response.json({ 
            error: error.message,
            success: false 
        }, { status: 500 });
    }
});