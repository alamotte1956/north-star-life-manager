import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Get all users who should receive notifications
        const users = await base44.asServiceRole.entities.User.list();
        const notifications = [];

        for (const user of users) {
            // Get user preferences
            const prefs = await base44.asServiceRole.entities.NotificationPreference.filter({
                created_by: user.email
            });
            
            const userPrefs = prefs[0] || {
                maintenance_reminders: true,
                maintenance_days_before: 7,
                document_reminders: true,
                document_days_before: 30,
                subscription_reminders: true,
                subscription_days_before: 5,
                vehicle_reminders: true,
                vehicle_days_before: 7,
                important_date_reminders: true
            };

            const userNotifications = [];
            const today = new Date();

            // Maintenance Tasks
            if (userPrefs.maintenance_reminders) {
                const tasks = await base44.asServiceRole.entities.MaintenanceTask.filter({
                    created_by: user.email
                });

                for (const task of tasks) {
                    if (task.next_due_date) {
                        const dueDate = new Date(task.next_due_date);
                        const daysUntil = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
                        
                        if (daysUntil > 0 && daysUntil <= userPrefs.maintenance_days_before) {
                            userNotifications.push({
                                type: 'Maintenance Task',
                                title: task.title,
                                property: task.property_name,
                                dueDate: task.next_due_date,
                                daysUntil
                            });
                        }
                    }
                }
            }

            // Documents
            if (userPrefs.document_reminders) {
                const documents = await base44.asServiceRole.entities.Document.filter({
                    created_by: user.email
                });

                for (const doc of documents) {
                    if (doc.expiry_date) {
                        const expiryDate = new Date(doc.expiry_date);
                        const daysUntil = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
                        
                        if (daysUntil > 0 && daysUntil <= userPrefs.document_days_before) {
                            userNotifications.push({
                                type: 'Document Expiring',
                                title: doc.title,
                                documentType: doc.document_type,
                                expiryDate: doc.expiry_date,
                                daysUntil
                            });
                        }
                    }
                }
            }

            // Subscriptions
            if (userPrefs.subscription_reminders) {
                const subscriptions = await base44.asServiceRole.entities.Subscription.filter({
                    created_by: user.email
                });

                for (const sub of subscriptions) {
                    if (sub.next_billing_date && sub.status === 'active') {
                        const billingDate = new Date(sub.next_billing_date);
                        const daysUntil = Math.ceil((billingDate - today) / (1000 * 60 * 60 * 24));
                        
                        if (daysUntil > 0 && daysUntil <= userPrefs.subscription_days_before) {
                            userNotifications.push({
                                type: 'Subscription Renewal',
                                title: sub.name,
                                provider: sub.provider,
                                amount: sub.billing_amount,
                                billingDate: sub.next_billing_date,
                                daysUntil
                            });
                        }
                    }
                }
            }

            // Vehicles
            if (userPrefs.vehicle_reminders) {
                const vehicles = await base44.asServiceRole.entities.Vehicle.filter({
                    created_by: user.email
                });

                for (const vehicle of vehicles) {
                    // Registration expiration
                    if (vehicle.registration_expires) {
                        const regDate = new Date(vehicle.registration_expires);
                        const daysUntil = Math.ceil((regDate - today) / (1000 * 60 * 60 * 24));
                        
                        if (daysUntil > 0 && daysUntil <= userPrefs.vehicle_days_before) {
                            userNotifications.push({
                                type: 'Vehicle Registration',
                                title: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
                                dueDate: vehicle.registration_expires,
                                daysUntil
                            });
                        }
                    }

                    // Service due
                    if (vehicle.next_service_due) {
                        const serviceDate = new Date(vehicle.next_service_due);
                        const daysUntil = Math.ceil((serviceDate - today) / (1000 * 60 * 60 * 24));
                        
                        if (daysUntil > 0 && daysUntil <= userPrefs.vehicle_days_before) {
                            userNotifications.push({
                                type: 'Vehicle Service',
                                title: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
                                dueDate: vehicle.next_service_due,
                                daysUntil
                            });
                        }
                    }
                }
            }

            // Important Dates
            if (userPrefs.important_date_reminders) {
                const dates = await base44.asServiceRole.entities.ImportantDate.filter({
                    created_by: user.email
                });

                for (const date of dates) {
                    const eventDate = new Date(date.date);
                    const daysUntil = Math.ceil((eventDate - today) / (1000 * 60 * 60 * 24));
                    const reminderDays = date.reminder_days_before || 7;
                    
                    if (daysUntil > 0 && daysUntil <= reminderDays) {
                        userNotifications.push({
                            type: 'Important Date',
                            title: date.title,
                            category: date.category,
                            person: date.person_name,
                            date: date.date,
                            daysUntil
                        });
                    }
                }
            }

            // Send email if there are notifications
            if (userNotifications.length > 0) {
                const emailBody = generateEmailBody(user.full_name, userNotifications);
                
                await base44.asServiceRole.integrations.Core.SendEmail({
                    from_name: 'North Star Life Manager',
                    to: user.email,
                    subject: `Upcoming Reminders - ${userNotifications.length} item${userNotifications.length > 1 ? 's' : ''}`,
                    body: emailBody
                });

                notifications.push({
                    user: user.email,
                    count: userNotifications.length
                });
            }
        }

        return Response.json({
            success: true,
            notificationsSent: notifications.length,
            details: notifications
        });

    } catch (error) {
        console.error('Reminder error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});

function generateEmailBody(userName, notifications) {
    let body = `Hi ${userName},\n\n`;
    body += `You have ${notifications.length} upcoming item${notifications.length > 1 ? 's' : ''} that need your attention:\n\n`;

    // Group by type
    const grouped = {};
    notifications.forEach(notif => {
        if (!grouped[notif.type]) grouped[notif.type] = [];
        grouped[notif.type].push(notif);
    });

    Object.entries(grouped).forEach(([type, items]) => {
        body += `\n${type}:\n`;
        items.forEach(item => {
            body += `  • ${item.title}`;
            if (item.daysUntil === 1) {
                body += ` - DUE TOMORROW`;
            } else {
                body += ` - in ${item.daysUntil} days`;
            }
            if (item.property) body += ` (${item.property})`;
            if (item.amount) body += ` - $${item.amount}`;
            if (item.person) body += ` - ${item.person}`;
            body += '\n';
        });
    });

    body += '\n\nLog in to North Star Life Manager to view more details.\n\n';
    body += 'Best regards,\nNorth Star Life Manager';

    return body;
}