import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import jsPDF from 'npm:jspdf@2.5.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch all critical data
        const [
            documents,
            properties,
            vehicles,
            contacts,
            healthRecords,
            beneficiaries,
            emergencyInfo,
            investments,
            subscriptions
        ] = await Promise.all([
            base44.entities.Document.list('-created_date', 100),
            base44.entities.Property.list(),
            base44.entities.Vehicle.list(),
            base44.entities.Contact.filter({ category: 'family' }),
            base44.entities.HealthRecord.list('-created_date', 20),
            base44.entities.Beneficiary.list(),
            base44.entities.EmergencyInfo.list(),
            base44.entities.Investment.list(),
            base44.entities.Subscription.filter({ status: 'active' })
        ]);

        const doc = new jsPDF();
        let y = 20;

        // Cover Page
        doc.setFontSize(32);
        doc.text('Family Master Binder', 105, 60, { align: 'center' });
        doc.setFontSize(16);
        doc.text(user.full_name || 'Family Records', 105, 80, { align: 'center' });
        doc.setFontSize(12);
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 105, 100, { align: 'center' });
        doc.setFontSize(10);
        doc.text('CONFIDENTIAL - KEEP SECURE', 105, 120, { align: 'center' });

        // Table of Contents
        doc.addPage();
        y = 20;
        doc.setFontSize(20);
        doc.text('Table of Contents', 20, y);
        y += 15;
        doc.setFontSize(12);
        const sections = [
            'Emergency Information',
            'Family Contacts',
            'Properties',
            'Vehicles',
            'Financial Summary',
            'Health Records',
            'Estate Planning',
            'Important Documents'
        ];
        sections.forEach((section, i) => {
            doc.text(`${i + 1}. ${section}`, 30, y);
            y += 8;
        });

        // Emergency Information
        doc.addPage();
        y = 20;
        doc.setFontSize(18);
        doc.text('Emergency Information', 20, y);
        y += 15;

        if (emergencyInfo.length > 0) {
            doc.setFontSize(12);
            emergencyInfo.slice(0, 3).forEach(info => {
                if (y > 250) { doc.addPage(); y = 20; }
                doc.setFont(undefined, 'bold');
                doc.text(info.contact_name || 'Emergency Contact', 20, y);
                y += 7;
                doc.setFont(undefined, 'normal');
                doc.text(`Relationship: ${info.relationship || 'N/A'}`, 25, y);
                y += 6;
                doc.text(`Phone: ${info.phone_number || 'N/A'}`, 25, y);
                y += 6;
                if (info.address) {
                    doc.text(`Address: ${info.address}`, 25, y);
                    y += 6;
                }
                y += 5;
            });
        }

        // Family Contacts
        doc.addPage();
        y = 20;
        doc.setFontSize(18);
        doc.text('Family Contacts', 20, y);
        y += 15;

        doc.setFontSize(12);
        contacts.forEach(contact => {
            if (y > 260) { doc.addPage(); y = 20; }
            doc.setFont(undefined, 'bold');
            doc.text(contact.name, 20, y);
            y += 7;
            doc.setFont(undefined, 'normal');
            if (contact.email) {
                doc.text(`Email: ${contact.email}`, 25, y);
                y += 6;
            }
            if (contact.phone) {
                doc.text(`Phone: ${contact.phone}`, 25, y);
                y += 6;
            }
            y += 5;
        });

        // Properties
        doc.addPage();
        y = 20;
        doc.setFontSize(18);
        doc.text('Properties', 20, y);
        y += 15;

        doc.setFontSize(12);
        properties.forEach(property => {
            if (y > 250) { doc.addPage(); y = 20; }
            doc.setFont(undefined, 'bold');
            doc.text(property.name || property.address, 20, y);
            y += 7;
            doc.setFont(undefined, 'normal');
            if (property.address) {
                doc.text(`Address: ${property.address}`, 25, y);
                y += 6;
            }
            if (property.property_type) {
                doc.text(`Type: ${property.property_type}`, 25, y);
                y += 6;
            }
            if (property.estimated_value) {
                doc.text(`Value: $${property.estimated_value.toLocaleString()}`, 25, y);
                y += 6;
            }
            y += 5;
        });

        // Vehicles
        doc.addPage();
        y = 20;
        doc.setFontSize(18);
        doc.text('Vehicles', 20, y);
        y += 15;

        doc.setFontSize(12);
        vehicles.forEach(vehicle => {
            if (y > 260) { doc.addPage(); y = 20; }
            doc.setFont(undefined, 'bold');
            doc.text(`${vehicle.year} ${vehicle.make} ${vehicle.model}`, 20, y);
            y += 7;
            doc.setFont(undefined, 'normal');
            if (vehicle.vin) {
                doc.text(`VIN: ${vehicle.vin}`, 25, y);
                y += 6;
            }
            if (vehicle.license_plate) {
                doc.text(`License: ${vehicle.license_plate}`, 25, y);
                y += 6;
            }
            y += 5;
        });

        // Financial Summary
        doc.addPage();
        y = 20;
        doc.setFontSize(18);
        doc.text('Financial Summary', 20, y);
        y += 15;

        doc.setFontSize(12);
        const totalInvestments = investments.reduce((sum, inv) => sum + (inv.current_value || 0), 0);
        doc.text(`Total Investments: $${totalInvestments.toLocaleString()}`, 20, y);
        y += 10;
        doc.text(`Active Subscriptions: ${subscriptions.length}`, 20, y);
        y += 10;
        doc.text(`Properties: ${properties.length}`, 20, y);
        y += 10;
        doc.text(`Vehicles: ${vehicles.length}`, 20, y);

        // Estate Planning
        doc.addPage();
        y = 20;
        doc.setFontSize(18);
        doc.text('Estate Planning', 20, y);
        y += 15;

        doc.setFontSize(12);
        if (beneficiaries.length > 0) {
            doc.text('Beneficiaries:', 20, y);
            y += 10;
            beneficiaries.forEach(ben => {
                if (y > 260) { doc.addPage(); y = 20; }
                doc.text(`• ${ben.name} (${ben.relationship})`, 25, y);
                y += 7;
            });
        }

        // Documents List
        doc.addPage();
        y = 20;
        doc.setFontSize(18);
        doc.text('Important Documents', 20, y);
        y += 15;

        doc.setFontSize(10);
        documents.forEach(document => {
            if (y > 270) { doc.addPage(); y = 20; }
            doc.text(`• ${document.title}`, 20, y);
            if (document.category) {
                doc.text(`[${document.category}]`, 150, y);
            }
            y += 6;
        });

        const pdfBytes = doc.output('arraybuffer');
        return new Response(pdfBytes, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': 'attachment; filename="Family-Master-Binder.pdf"'
            }
        });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});