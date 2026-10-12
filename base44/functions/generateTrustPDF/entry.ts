import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import jsPDF from 'npm:jspdf@2.5.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { trust_id } = await req.json();
        const trust = await base44.entities.Document.get(trust_id);

        if (!trust) {
            return Response.json({ error: 'Trust not found' }, { status: 404 });
        }

        const data = trust.extracted_data || {};
        const generatedContent = data.generated_content || {};

        const doc = new jsPDF();
        let y = 20;

        // Title Page
        doc.setFontSize(24);
        doc.text(trust.title || 'Trust Document', 105, 60, { align: 'center' });
        y = 80;
        doc.setFontSize(12);
        doc.text(trust.document_type || 'Trust Agreement', 105, y, { align: 'center' });
        y = 100;
        doc.setFontSize(10);
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 105, y, { align: 'center' });
        y = 120;
        doc.setFontSize(8);
        doc.text('DRAFT - REQUIRES ATTORNEY REVIEW', 105, y, { align: 'center' });

        // Executive Summary
        doc.addPage();
        y = 20;
        doc.setFontSize(16);
        doc.text('Executive Summary', 20, y);
        y += 10;
        doc.setFontSize(10);
        if (generatedContent.executive_summary) {
            const lines = doc.splitTextToSize(generatedContent.executive_summary, 170);
            doc.text(lines, 20, y);
            y += lines.length * 5 + 10;
        }

        // Trust Details
        doc.addPage();
        y = 20;
        doc.setFontSize(16);
        doc.text('Trust Details', 20, y);
        y += 12;
        doc.setFontSize(10);

        const details = [
            ['Trust Name:', trust.title],
            ['Type:', trust.document_type],
            ['Grantor:', data.grantor_name],
            ['Trustee:', data.trustee_name],
            ['Establishment Date:', data.establishment_date],
            ['Estimated Value:', `$${data.trust_value?.toLocaleString() || 0}`]
        ];

        details.forEach(([label, value]) => {
            if (value) {
                doc.setFont(undefined, 'bold');
                doc.text(label, 20, y);
                doc.setFont(undefined, 'normal');
                doc.text(String(value), 70, y);
                y += 7;
            }
        });

        // Beneficiaries
        if (data.beneficiaries) {
            if (y > 250) { doc.addPage(); y = 20; }
            y += 5;
            doc.setFontSize(14);
            doc.text('Beneficiaries', 20, y);
            y += 10;
            doc.setFontSize(10);
            const benLines = doc.splitTextToSize(data.beneficiaries, 170);
            doc.text(benLines, 20, y);
            y += benLines.length * 5 + 10;
        }

        // Key Provisions
        if (generatedContent.key_provisions?.length > 0) {
            doc.addPage();
            y = 20;
            doc.setFontSize(16);
            doc.text('Key Provisions', 20, y);
            y += 12;
            doc.setFontSize(10);
            
            generatedContent.key_provisions.forEach((provision, i) => {
                if (y > 270) { doc.addPage(); y = 20; }
                const text = doc.splitTextToSize(`${i + 1}. ${provision}`, 170);
                doc.text(text, 20, y);
                y += text.length * 5 + 5;
            });
        }

        // Full Document Text
        if (generatedContent.document_text) {
            doc.addPage();
            y = 20;
            doc.setFontSize(16);
            doc.text('Trust Agreement', 20, y);
            y += 12;
            doc.setFontSize(9);
            
            const fullText = doc.splitTextToSize(generatedContent.document_text, 170);
            fullText.forEach(line => {
                if (y > 280) { doc.addPage(); y = 20; }
                doc.text(line, 20, y);
                y += 4;
            });
        }

        // Legal Review Checklist
        if (generatedContent.legal_review_checklist?.length > 0) {
            doc.addPage();
            y = 20;
            doc.setFontSize(16);
            doc.text('Legal Review Checklist', 20, y);
            y += 12;
            doc.setFontSize(10);
            
            generatedContent.legal_review_checklist.forEach((item, i) => {
                if (y > 270) { doc.addPage(); y = 20; }
                doc.text(`☐ ${item}`, 20, y);
                y += 7;
            });
        }

        // Signature Page
        doc.addPage();
        y = 20;
        doc.setFontSize(16);
        doc.text('Signatures', 20, y);
        y += 20;
        doc.setFontSize(10);

        if (generatedContent.required_signatures) {
            generatedContent.required_signatures.forEach(signature => {
                if (y > 250) { doc.addPage(); y = 20; }
                doc.text(signature, 20, y);
                y += 10;
                doc.line(20, y, 120, y);
                y += 3;
                doc.setFontSize(8);
                doc.text('Signature', 20, y);
                doc.text('Date', 100, y);
                y += 15;
                doc.setFontSize(10);
            });
        }

        const pdfBytes = doc.output('arraybuffer');
        return new Response(pdfBytes, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${trust.title || 'Trust'}.pdf"`
            }
        });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});