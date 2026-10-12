import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import jsPDF from 'npm:jspdf@2.5.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const payload = await req.json();

        // Generate will using AI
        const willDocument = await base44.integrations.Core.InvokeLLM({
            prompt: `Generate a comprehensive Last Will and Testament with these details:

Testator: ${payload.testator_name}
State: ${payload.state}
Marital Status: ${payload.marital_status}
Spouse: ${payload.spouse_name || 'N/A'}
Children: ${payload.children || 'None'}
Executor: ${payload.executor}
Beneficiaries: ${payload.beneficiaries}
Asset Distribution: ${payload.asset_distribution}
Guardian for Minors: ${payload.guardian_minors || 'N/A'}
Special Bequests: ${payload.special_bequests || 'None'}
Funeral Wishes: ${payload.funeral_wishes || 'None'}

Generate a complete Last Will and Testament following ${payload.state} state laws with:
1. Declaration and revocation of prior wills
2. Executor appointment and powers
3. Guardian appointments (if applicable)
4. Asset distribution provisions
5. Residuary clause
6. Specific bequests
7. Witnesses and attestation clause
8. Self-proving affidavit language

Include all standard legal clauses and proper formatting.`,
            response_json_schema: {
                type: "object",
                properties: {
                    document_text: { type: "string" },
                    executive_summary: { type: "string" },
                    key_provisions: { type: "array", items: { type: "string" } },
                    state_requirements: { type: "array", items: { type: "string" } },
                    execution_instructions: { type: "array", items: { type: "string" } },
                    next_steps: { type: "array", items: { type: "string" } }
                }
            }
        });

        // Generate PDF
        const doc = new jsPDF();
        let y = 20;

        // Title
        doc.setFontSize(20);
        doc.text('LAST WILL AND TESTAMENT', 105, 60, { align: 'center' });
        y = 80;
        doc.setFontSize(14);
        doc.text(`of ${payload.testator_name}`, 105, y, { align: 'center' });
        y = 100;
        doc.setFontSize(10);
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 105, y, { align: 'center' });
        y = 110;
        doc.setFontSize(8);
        doc.text('DRAFT - MUST BE REVIEWED BY ATTORNEY', 105, y, { align: 'center' });

        // Document Text
        doc.addPage();
        y = 20;
        doc.setFontSize(12);
        doc.text('WILL', 20, y);
        y += 10;
        doc.setFontSize(9);

        const fullText = doc.splitTextToSize(willDocument.document_text, 170);
        fullText.forEach(line => {
            if (y > 280) { doc.addPage(); y = 20; }
            doc.text(line, 20, y);
            y += 4;
        });

        // State Requirements
        if (willDocument.state_requirements?.length > 0) {
            doc.addPage();
            y = 20;
            doc.setFontSize(12);
            doc.text(`${payload.state} State Requirements`, 20, y);
            y += 10;
            doc.setFontSize(9);
            
            willDocument.state_requirements.forEach((req, i) => {
                if (y > 270) { doc.addPage(); y = 20; }
                const text = doc.splitTextToSize(`• ${req}`, 170);
                doc.text(text, 20, y);
                y += text.length * 4 + 3;
            });
        }

        // Execution Instructions
        doc.addPage();
        y = 20;
        doc.setFontSize(12);
        doc.text('How to Execute This Will', 20, y);
        y += 10;
        doc.setFontSize(9);
        
        if (willDocument.execution_instructions) {
            willDocument.execution_instructions.forEach((instruction, i) => {
                if (y > 270) { doc.addPage(); y = 20; }
                const text = doc.splitTextToSize(`${i + 1}. ${instruction}`, 170);
                doc.text(text, 20, y);
                y += text.length * 4 + 5;
            });
        }

        // Signature Page
        doc.addPage();
        y = 40;
        doc.setFontSize(10);
        doc.text('IN WITNESS WHEREOF, I have signed this Will on this _____ day of __________, 20___.', 20, y);
        y += 30;
        doc.line(20, y, 120, y);
        y += 5;
        doc.text(`${payload.testator_name}, Testator`, 20, y);
        
        y += 30;
        doc.setFontSize(9);
        doc.text('WITNESSES:', 20, y);
        y += 15;
        doc.line(20, y, 120, y);
        y += 5;
        doc.text('Witness #1 Signature', 20, y);
        doc.text('Date', 100, y);

        y += 20;
        doc.line(20, y, 120, y);
        y += 5;
        doc.text('Witness #2 Signature', 20, y);
        doc.text('Date', 100, y);

        const pdfBytes = doc.output('arraybuffer');
        return new Response(pdfBytes, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="Last-Will-${payload.testator_name}.pdf"`
            }
        });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});