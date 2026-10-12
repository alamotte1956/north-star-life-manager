import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { emergency_type, message, latitude, longitude, address } = await req.json();

        // Get emergency contacts
        const emergencyContacts = await base44.entities.EmergencyInfo.filter({ 
            user_email: user.email 
        });

        // Get medical profile
        const medicalProfiles = await base44.entities.MedicalEmergencyInfo.filter({ 
            user_email: user.email 
        });
        const medicalProfile = medicalProfiles[0];

        const contactsNotified = [];

        // Send notifications to emergency contacts
        for (const contact of emergencyContacts) {
            const emergencyMessage = `🚨 EMERGENCY ALERT from ${user.full_name}

Type: ${emergency_type}
Message: ${message}
Location: ${address || `${latitude}, ${longitude}`}

${medicalProfile ? `
CRITICAL MEDICAL INFO:
Blood Type: ${medicalProfile.blood_type || 'Unknown'}
Allergies: ${medicalProfile.allergies?.join(', ') || 'None listed'}
Medications: ${medicalProfile.current_medications?.join(', ') || 'None listed'}
Conditions: ${medicalProfile.medical_conditions?.join(', ') || 'None listed'}
` : ''}

Reply SAFE to confirm ${user.full_name.split(' ')[0]} is okay.`;

            // Send email
            try {
                await base44.integrations.Core.SendEmail({
                    to: contact.email,
                    subject: `🚨 EMERGENCY: ${user.full_name}`,
                    body: emergencyMessage
                });

                contactsNotified.push({
                    name: contact.name,
                    email: contact.email,
                    phone: contact.phone,
                    notified_at: new Date().toISOString(),
                    delivery_status: 'sent'
                });
            } catch (emailError) {
                console.error('Email error:', emailError);
                contactsNotified.push({
                    name: contact.name,
                    email: contact.email,
                    phone: contact.phone,
                    notified_at: new Date().toISOString(),
                    delivery_status: 'failed'
                });
            }

            // Send SMS if available
            if (contact.phone) {
                try {
                    await base44.functions.invoke('sendTwilioSMS', {
                        to: contact.phone,
                        message: `🚨 EMERGENCY: ${user.full_name} - ${emergency_type} - ${message} - Location: ${address || 'GPS: ' + latitude + ',' + longitude}`
                    });
                } catch (smsError) {
                    console.error('SMS error:', smsError);
                }
            }
        }

        // Create emergency broadcast record
        const broadcast = await base44.entities.EmergencyBroadcast.create({
            user_email: user.email,
            user_name: user.full_name,
            emergency_type,
            message,
            location: {
                latitude: latitude || null,
                longitude: longitude || null,
                address: address || null
            },
            contacts_notified: contactsNotified,
            medical_info_sent: !!medicalProfile,
            resolved: false
        });

        return Response.json({
            success: true,
            broadcast_id: broadcast.id,
            contacts_notified: contactsNotified.length,
            message: `Emergency broadcast sent to ${contactsNotified.length} contact(s)`
        });

    } catch (error) {
        console.error('Emergency broadcast error:', error);
        return Response.json({ 
            error: error.message,
            success: false 
        }, { status: 500 });
    }
});