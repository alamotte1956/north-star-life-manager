import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import jsPDF from 'npm:jspdf@2.5.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch comprehensive year data
        const [transactions, investments, properties, documents, healthRecords] = await Promise.all([
            base44.entities.Transaction.list('-date', 500),
            base44.entities.Investment.list(),
            base44.entities.Property.list(),
            base44.entities.Document.list('-created_date', 200),
            base44.entities.HealthRecord.list('-created_date', 50)
        ]);

        // AI Analysis
        const aiInsights = await base44.integrations.Core.InvokeLLM({
            prompt: `Create a comprehensive annual family report with insights and recommendations.

Financial Data:
- Transactions: ${transactions.length} total
- Investments: ${investments.length} holdings, Total Value: $${investments.reduce((sum, inv) => sum + (inv.current_value || 0), 0).toLocaleString()}
- Properties: ${properties.length}

Documents: ${documents.length}
Health Records: ${healthRecords.length}

Provide:
1. Executive Summary (2-3 paragraphs about the year)
2. Financial Highlights (top achievements and concerns)
3. Asset Growth Analysis
4. Document Organization Status
5. Health & Wellness Summary
6. Key Accomplishments (5-7 points)
7. Areas for Improvement (3-5 points)
8. Goals for Next Year (5 recommended goals)`,
            response_json_schema: {
                type: "object",
                properties: {
                    executive_summary: { type: "string" },
                    financial_highlights: { type: "string" },
                    asset_growth: { type: "string" },
                    document_status: { type: "string" },
                    health_summary: { type: "string" },
                    accomplishments: { type: "array", items: { type: "string" } },
                    improvements: { type: "array", items: { type: "string" } },
                    next_year_goals: { type: "array", items: { type: "string" } }
                }
            }
        });

        // Generate PDF
        const doc = new jsPDF();
        let y = 20;

        // Cover
        doc.setFontSize(28);
        doc.text(`${new Date().getFullYear()} Annual Family Report`, 105, 80, { align: 'center' });
        doc.setFontSize(16);
        doc.text(user.full_name || 'Family Report', 105, 100, { align: 'center' });
        doc.setFontSize(12);
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 105, 120, { align: 'center' });

        // Executive Summary
        doc.addPage();
        y = 20;
        doc.setFontSize(18);
        doc.text('Executive Summary', 20, y);
        y += 12;
        doc.setFontSize(11);
        const summaryLines = doc.splitTextToSize(aiInsights.executive_summary, 170);
        doc.text(summaryLines, 20, y);
        y += summaryLines.length * 6 + 10;

        // Financial Highlights
        if (y > 200) { doc.addPage(); y = 20; }
        doc.setFontSize(16);
        doc.text('Financial Highlights', 20, y);
        y += 10;
        doc.setFontSize(11);
        const finLines = doc.splitTextToSize(aiInsights.financial_highlights, 170);
        doc.text(finLines, 20, y);

        // Accomplishments
        doc.addPage();
        y = 20;
        doc.setFontSize(16);
        doc.text('Key Accomplishments', 20, y);
        y += 12;
        doc.setFontSize(11);
        aiInsights.accomplishments.forEach((item, i) => {
            if (y > 270) { doc.addPage(); y = 20; }
            const text = doc.splitTextToSize(`${i + 1}. ${item}`, 170);
            doc.text(text, 20, y);
            y += text.length * 6 + 5;
        });

        // Goals for Next Year
        doc.addPage();
        y = 20;
        doc.setFontSize(16);
        doc.text('Goals for Next Year', 20, y);
        y += 12;
        doc.setFontSize(11);
        aiInsights.next_year_goals.forEach((goal, i) => {
            if (y > 270) { doc.addPage(); y = 20; }
            const text = doc.splitTextToSize(`${i + 1}. ${goal}`, 170);
            doc.text(text, 20, y);
            y += text.length * 6 + 5;
        });

        const pdfBytes = doc.output('arraybuffer');
        return new Response(pdfBytes, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="Annual-Family-Report-${new Date().getFullYear()}.pdf"`
            }
        });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});