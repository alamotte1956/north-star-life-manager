import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Get all users with notification preferences
        const allPrefs = await base44.asServiceRole.entities.NotificationPreference.list();
        const reminders = [];
        
        for (const prefs of allPrefs) {
            const userReminders = [];
            const today = new Date();
            
            // Check documents expiring
            if (prefs.document_expiry_enabled) {
                const documents = await base44.asServiceRole.entities.Document.filter({});
                for (const doc of documents) {
                    if (doc.expiry_date) {
                        const expiryDate = new Date(doc.expiry_date);
                        const daysUntil = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
                        
                        if (daysUntil === prefs.document_expiry_days_before) {
                            userReminders.push({
                                type: 'document_expiry',
                                title: `Document Expiring Soon: ${doc.title}`,
                                message: `Your document "${doc.title}" will expire in ${daysUntil} days on ${expiryDate.toLocaleDateString()}.`,
                                priority: daysUntil <= 7 ? 'high' : 'medium',
                                action_url: `/vault`,
                                metadata: { document_id: doc.id, expiry_date: doc.expiry_date }
                            });
                        }
                    }
                }
            }
            
            // Check maintenance tasks
            if (prefs.maintenance_due_enabled) {
                const tasks = await base44.asServiceRole.entities.MaintenanceTask.filter({ status: 'pending' });
                for (const task of tasks) {
                    if (task.scheduled_date) {
                        const taskDate = new Date(task.scheduled_date);
                        const daysUntil = Math.ceil((taskDate - today) / (1000 * 60 * 60 * 24));
                        
                        if (daysUntil === prefs.maintenance_due_days_before) {
                            userReminders.push({
                                type: 'maintenance_due',
                                title: `Maintenance Due: ${task.title}`,
                                message: `Maintenance task "${task.title}" is scheduled in ${daysUntil} days.`,
                                priority: daysUntil <= 3 ? 'high' : 'medium',
                                action_url: `/maintenance`,
                                metadata: { task_id: task.id, scheduled_date: task.scheduled_date }
                            });
                        }
                    }
                }
            }
            
            // Check bills due
            if (prefs.bill_due_enabled) {
                const bills = await base44.asServiceRole.entities.BillPayment.filter({ status: 'pending' });
                for (const bill of bills) {
                    if (bill.due_date) {
                        const dueDate = new Date(bill.due_date);
                        const daysUntil = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
                        
                        if (daysUntil === prefs.bill_due_days_before) {
                            userReminders.push({
                                type: 'bill_due',
                                title: `Bill Due: ${bill.bill_name}`,
                                message: `Your ${bill.bill_name} payment of $${bill.amount} is due in ${daysUntil} days.`,
                                priority: 'high',
                                action_url: `/bill-payments`,
                                metadata: { bill_id: bill.id, amount: bill.amount, due_date: bill.due_date }
                            });
                        }
                    }
                }
            }
            
            // Check subscription renewals
            if (prefs.subscription_renewal_enabled) {
                const subscriptions = await base44.asServiceRole.entities.Subscription.filter({ status: 'active' });
                for (const sub of subscriptions) {
                    if (sub.renewal_date) {
                        const renewalDate = new Date(sub.renewal_date);
                        const daysUntil = Math.ceil((renewalDate - today) / (1000 * 60 * 60 * 24));
                        
                        if (daysUntil === prefs.subscription_renewal_days_before) {
                            userReminders.push({
                                type: 'subscription_renewal',
                                title: `Subscription Renewal: ${sub.name}`,
                                message: `Your ${sub.name} subscription ($${sub.monthly_cost}/mo) renews in ${daysUntil} days.`,
                                priority: 'medium',
                                action_url: `/subscriptions`,
                                metadata: { subscription_id: sub.id, cost: sub.monthly_cost, renewal_date: sub.renewal_date }
                            });
                        }
                    }
                }
            }
            
            // Check lease expirations
            if (prefs.lease_expiring_enabled) {
                const properties = await base44.asServiceRole.entities.Property.filter({});
                for (const prop of properties) {
                    if (prop.lease_end_date) {
                        const leaseEnd = new Date(prop.lease_end_date);
                        const daysUntil = Math.ceil((leaseEnd - today) / (1000 * 60 * 60 * 24));
                        
                        if (daysUntil === prefs.lease_expiring_days_before) {
                            userReminders.push({
                                type: 'lease_expiring',
                                title: `Lease Expiring: ${prop.name}`,
                                message: `The lease for ${prop.name} expires in ${daysUntil} days.`,
                                priority: 'high',
                                action_url: `/properties`,
                                metadata: { property_id: prop.id, lease_end_date: prop.lease_end_date }
                            });
                        }
                    }
                }
            }
            
            // Check medication refills
            if (prefs.medication_refill_enabled) {
                const medications = await base44.asServiceRole.entities.Medication.filter({ status: 'active' });
                for (const med of medications) {
                    if (med.refill_date) {
                        const refillDate = new Date(med.refill_date);
                        const daysUntil = Math.ceil((refillDate - today) / (1000 * 60 * 60 * 24));
                        
                        if (daysUntil === prefs.medication_refill_days_before) {
                            userReminders.push({
                                type: 'medication_refill',
                                title: `Medication Refill: ${med.medication_name}`,
                                message: `Time to refill ${med.medication_name}. You have about ${daysUntil} days of supply left.`,
                                priority: 'high',
                                action_url: `/health`,
                                metadata: { medication_id: med.id, refill_date: med.refill_date }
                            });
                        }
                    }
                }
            }
            
            // Send reminders
            if (userReminders.length > 0) {
                for (const reminder of userReminders) {
                    // Create in-app notification
                    if (prefs.in_app_enabled) {
                        await base44.asServiceRole.entities.FamilyNotification.create({
                            family_id: prefs.family_id || 'default',
                            recipient_email: prefs.user_email,
                            notification_type: reminder.type,
                            title: reminder.title,
                            message: reminder.message,
                            priority: reminder.priority,
                            action_url: reminder.action_url,
                            metadata: reminder.metadata
                        });
                    }
                    
                    // Send email notification
                    if (prefs.email_enabled) {
                        try {
                            await base44.asServiceRole.integrations.Core.SendEmail({
                                to: prefs.user_email,
                                subject: `Reminder: ${reminder.title}`,
                                body: `
                                    <h2>${reminder.title}</h2>
                                    <p>${reminder.message}</p>
                                    <p><a href="https://app.northstar.com${reminder.action_url}">View Details</a></p>
                                `
                            });
                        } catch (emailError) {
                            console.error('Failed to send email:', emailError);
                        }
                    }
                    
                    // Send push notification
                    if (prefs.push_enabled) {
                        try {
                            await base44.asServiceRole.functions.invoke('sendPushNotification', {
                                user_email: prefs.user_email,
                                title: reminder.title,
                                body: reminder.message,
                                data: { url: reminder.action_url }
                            });
                        } catch (pushError) {
                            console.error('Failed to send push:', pushError);
                        }
                    }
                }
                
                reminders.push({
                    user_email: prefs.user_email,
                    reminders_sent: userReminders.length
                });
            }
        }
        
        return Response.json({ 
            success: true, 
            processed: allPrefs.length,
            reminders_sent: reminders
        });
        
    } catch (error) {
        console.error('Error checking reminders:', error);
        return Response.json({ 
            success: false, 
            error: error.message 
        }, { status: 500 });
    }
});