import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { jsPDF } from 'npm:jspdf@2.5.2';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { period, year, month, summary } = await req.json();

        const doc = new jsPDF();
        let y = 20;

        // Header
        doc.setFontSize(24);
        doc.text('Financial Report', 20, y);
        y += 10;

        doc.setFontSize(12);
        const periodText = period === 'year' 
            ? `Year: ${year}` 
            : `${getMonthName(month)} ${year}`;
        doc.text(periodText, 20, y);
        y += 5;

        doc.setFontSize(10);
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, y);
        y += 15;

        // Summary Section
        doc.setFontSize(16);
        doc.text('Summary', 20, y);
        y += 10;

        doc.setFontSize(12);
        const summaryItems = [
            { label: 'Subscriptions', amount: summary.subscriptions },
            { label: 'Maintenance', amount: summary.maintenance },
            { label: 'Property Tax', amount: summary.properties },
            { label: 'Total Expenses', amount: summary.total, bold: true }
        ];

        summaryItems.forEach(item => {
            if (item.bold) {
                doc.setFontSize(14);
                doc.setFont(undefined, 'bold');
            }
            doc.text(item.label, 20, y);
            doc.text(`$${item.amount.toFixed(2)}`, 150, y);
            if (item.bold) {
                doc.setFontSize(12);
                doc.setFont(undefined, 'normal');
            }
            y += 8;
        });

        y += 10;

        // Detailed Breakdown
        if (summary.details.subscriptions.length > 0) {
            y = addSection(doc, y, 'Subscriptions Breakdown', summary.details.subscriptions.map(s => ({
                name: `${s.name} (${s.provider})`,
                amount: s.amount
            })));
        }

        if (summary.details.maintenance.length > 0) {
            y = addSection(doc, y, 'Maintenance Costs', summary.details.maintenance.map(m => ({
                name: `${m.title} - ${m.property}`,
                amount: m.amount
            })));
        }

        if (summary.details.properties.length > 0) {
            y = addSection(doc, y, 'Property Expenses', summary.details.properties.map(p => ({
                name: `${p.name} (${p.type})`,
                amount: p.amount
            })));
        }

        // Footer
        const pageCount = doc.internal.pages.length - 1;
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.text(`Page ${i} of ${pageCount}`, 105, 285, { align: 'center' });
        }

        const pdfBytes = doc.output('arraybuffer');

        return new Response(pdfBytes, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename=financial-report-${year}.pdf`
            }
        });

    } catch (error) {
        console.error('Report generation error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});

function addSection(doc, startY, title, items) {
    let y = startY;

    if (y > 250) {
        doc.addPage();
        y = 20;
    }

    doc.setFontSize(14);
    doc.text(title, 20, y);
    y += 8;

    doc.setFontSize(10);
    items.forEach(item => {
        if (y > 270) {
            doc.addPage();
            y = 20;
        }
        const text = item.name.length > 60 ? item.name.substring(0, 60) + '...' : item.name;
        doc.text(text, 25, y);
        doc.text(`$${item.amount.toFixed(2)}`, 150, y);
        y += 6;
    });

    return y + 10;
}

function getMonthName(monthNum) {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                    'July', 'August', 'September', 'October', 'November', 'December'];
    return months[monthNum - 1];
}