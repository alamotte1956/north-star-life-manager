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
                maintenance_due_enabled: true,
                maintenance_due_days_before: 7,
                document_expiry_enabled: true,
                document_expiry_days_before: 30,
                subscription_renewal_enabled: true,
                subscription_renewal_days_before: 7,
                bill_due_enabled: true,
                bill_due_days_before: 3,
                policy_renewal_enabled: true,
                policy_renewal_days_before: 30,
                medication_refill_enabled: true,
                medication_refill_days_before: 5,
                vehicle_registration_enabled: true,
                vehicle_registration_days_before: 30,
                vehicle_service_enabled: true,
                vehicle_service_days_before: 7,
                lease_expiring_enabled: true,
                lease_expiring_days_before: 60,
                financial_goal_enabled: true,
                email_enabled: true,
                in_app_enabled: true,
                push_enabled: false
            };

            const userNotifications = [];
            const today = new Date();

            // Maintenance Tasks
            if (userPrefs.maintenance_due_enabled) {
                const tasks = await base44.asServiceRole.entities.MaintenanceTask.filter({
                    created_by: user.email
                });

                for (const task of tasks) {
                    if (task.next_due_date) {
                        const dueDate = new Date(task.next_due_date);
                        const daysUntil = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
                        
                        if (daysUntil > 0 && daysUntil <= userPrefs.maintenance_due_days_before) {
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
            if (userPrefs.document_expiry_enabled) {
                const documents = await base44.asServiceRole.entities.Document.filter({
                    created_by: user.email
                });

                for (const doc of documents) {
                    if (doc.expiry_date) {
                        const expiryDate = new Date(doc.expiry_date);
                        const daysUntil = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
                        
                        if (daysUntil > 0 && daysUntil <= userPrefs.document_expiry_days_before) {
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
            if (userPrefs.subscription_renewal_enabled) {
                const subscriptions = await base44.asServiceRole.entities.Subscription.filter({
                    created_by: user.email,
                    status: 'active'
                });

                for (const sub of subscriptions) {
                    if (sub.next_billing_date) {
                        const billingDate = new Date(sub.next_billing_date);
                        const daysUntil = Math.ceil((billingDate - today) / (1000 * 60 * 60 * 24));
                        
                        if (daysUntil > 0 && daysUntil <= userPrefs.subscription_renewal_days_before) {
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
            
            // Bill Payments
            if (userPrefs.bill_due_enabled) {
                const bills = await base44.asServiceRole.entities.BillPayment.filter({
                    user_email: user.email,
                    status: 'active'
                });

                for (const bill of bills) {
                    if (bill.next_due_date) {
                        const dueDate = new Date(bill.next_due_date);
                        const daysUntil = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
                        
                        if (daysUntil > 0 && daysUntil <= userPrefs.bill_due_days_before) {
                            userNotifications.push({
                                type: 'Bill Payment Due',
                                title: bill.name,
                                amount: bill.amount,
                                dueDate: bill.next_due_date,
                                daysUntil
                            });
                        }
                    }
                }
            }
            
            // Insurance Policies
            if (userPrefs.policy_renewal_enabled) {
                const investments = await base44.asServiceRole.entities.Investment.filter({
                    created_by: user.email,
                    investment_type: 'insurance'
                });

                for (const policy of investments) {
                    if (policy.maturity_date || policy.next_review_date) {
                        const renewalDate = new Date(policy.maturity_date || policy.next_review_date);
                        const daysUntil = Math.ceil((renewalDate - today) / (1000 * 60 * 60 * 24));
                        
                        if (daysUntil > 0 && daysUntil <= userPrefs.policy_renewal_days_before) {
                            userNotifications.push({
                                type: 'Insurance Policy Renewal',
                                title: policy.name,
                                provider: policy.institution,
                                amount: policy.current_value,
                                renewalDate: policy.maturity_date || policy.next_review_date,
                                daysUntil
                            });
                        }
                    }
                }
            }
            
            // Medications
            if (userPrefs.medication_refill_enabled) {
                const medications = await base44.asServiceRole.entities.Medication.filter({
                    user_email: user.email,
                    status: 'active'
                });

                for (const med of medications) {
                    if (med.next_refill_date) {
                        const refillDate = new Date(med.next_refill_date);
                        const daysUntil = Math.ceil((refillDate - today) / (1000 * 60 * 60 * 24));
                        
                        if (daysUntil > 0 && daysUntil <= userPrefs.medication_refill_days_before) {
                            userNotifications.push({
                                type: 'Medication Refill',
                                title: med.name,
                                dosage: med.dosage,
                                refillDate: med.next_refill_date,
                                daysUntil
                            });
                        }
                    }
                }
            }
            
            // Lease Expirations
            if (userPrefs.lease_expiring_enabled) {
                const properties = await base44.asServiceRole.entities.Property.filter({
                    created_by: user.email
                });

                for (const property of properties) {
                    if (property.lease_end_date) {
                        const leaseEnd = new Date(property.lease_end_date);
                        const daysUntil = Math.ceil((leaseEnd - today) / (1000 * 60 * 60 * 24));
                        
                        if (daysUntil > 0 && daysUntil <= userPrefs.lease_expiring_days_before) {
                            userNotifications.push({
                                type: 'Lease Expiring',
                                title: property.name,
                                address: property.address,
                                leaseEndDate: property.lease_end_date,
                                daysUntil
                            });
                        }
                    }
                }
            }

            // Vehicles
            const vehicles = await base44.asServiceRole.entities.Vehicle.filter({
                created_by: user.email
            });

            for (const vehicle of vehicles) {
                // Registration expiration
                if (userPrefs.vehicle_registration_enabled && vehicle.registration_expires) {
                    const regDate = new Date(vehicle.registration_expires);
                    const daysUntil = Math.ceil((regDate - today) / (1000 * 60 * 60 * 24));
                    
                    if (daysUntil > 0 && daysUntil <= userPrefs.vehicle_registration_days_before) {
                        userNotifications.push({
                            type: 'Vehicle Registration',
                            title: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
                            dueDate: vehicle.registration_expires,
                            daysUntil
                        });
                    }
                }

                // Service due
                if (userPrefs.vehicle_service_enabled && vehicle.next_service_due) {
                    const serviceDate = new Date(vehicle.next_service_due);
                    const daysUntil = Math.ceil((serviceDate - today) / (1000 * 60 * 60 * 24));
                    
                    if (daysUntil > 0 && daysUntil <= userPrefs.vehicle_service_days_before) {
                        userNotifications.push({
                            type: 'Vehicle Service',
                            title: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
                            dueDate: vehicle.next_service_due,
                            daysUntil
                        });
                    }
                }
            }

            // Important Dates
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
            
            // Financial Goals - Monthly check-in
            if (userPrefs.financial_goal_enabled) {
                const goals = await base44.asServiceRole.entities.FinancialGoal.filter({
                    user_email: user.email,
                    status: 'active'
                });

                for (const goal of goals) {
                    // Check if it's been 30 days since last update or creation
                    const lastUpdate = goal.updated_date ? new Date(goal.updated_date) : new Date(goal.created_date);
                    const daysSinceUpdate = Math.ceil((today - lastUpdate) / (1000 * 60 * 60 * 24));
                    
                    if (daysSinceUpdate >= 30) {
                        const progress = goal.current_amount && goal.target_amount 
                            ? Math.round((goal.current_amount / goal.target_amount) * 100) 
                            : 0;
                        
                        userNotifications.push({
                            type: 'Financial Goal Check-in',
                            title: goal.name,
                            targetAmount: goal.target_amount,
                            currentAmount: goal.current_amount,
                            progress: progress,
                            targetDate: goal.target_date,
                            daysSinceUpdate
                        });
                    }
                }
            }

            // Send notifications if there are any
            if (userNotifications.length > 0) {
                // Send email
                if (userPrefs.email_enabled) {
                    const emailBody = generateEmailBody(user.full_name, userNotifications);
                    
                    await base44.asServiceRole.integrations.Core.SendEmail({
                        from_name: 'North Star Life Manager',
                        to: user.email,
                        subject: `📋 Upcoming Reminders - ${userNotifications.length} item${userNotifications.length > 1 ? 's' : ''}`,
                        body: emailBody
                    });
                }
                
                // Send push notifications
                if (userPrefs.push_enabled) {
                    for (const notif of userNotifications) {
                        try {
                            await base44.asServiceRole.functions.invoke('sendPushNotification', {
                                user_email: user.email,
                                title: `${notif.type}`,
                                body: `${notif.title} - ${notif.daysUntil === 1 ? 'Due tomorrow' : `in ${notif.daysUntil} days`}`,
                                url: getUrlForType(notif.type)
                            });
                        } catch (err) {
                            console.error('Push notification error:', err);
                        }
                    }
                }

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
            } else if (item.daysUntil) {
                body += ` - in ${item.daysUntil} days`;
            }
            if (item.property) body += ` (${item.property})`;
            if (item.amount) body += ` - $${item.amount}`;
            if (item.person) body += ` - ${item.person}`;
            if (item.progress !== undefined) body += ` - ${item.progress}% complete`;
            if (item.daysSinceUpdate) body += ` (${item.daysSinceUpdate} days since last update)`;
            body += '\n';
        });
    });

    body += '\n\nLog in to North Star Life Manager to view more details.\n\n';
    body += 'Best regards,\nNorth Star Life Manager';

    return body;
}

function getUrlForType(type) {
    const urlMap = {
        'Maintenance Task': '/Maintenance',
        'Document Expiring': '/Vault',
        'Subscription Renewal': '/Subscriptions',
        'Bill Payment Due': '/BillPayments',
        'Insurance Policy Renewal': '/InsuranceShopping',
        'Medication Refill': '/Health',
        'Lease Expiring': '/PropertyManagement',
        'Vehicle Registration': '/Vehicles',
        'Vehicle Service': '/Vehicles',
        'Important Date': '/Calendar',
        'Financial Goal Check-in': '/Budget'
    };
    return urlMap[type] || '/Dashboard';
}