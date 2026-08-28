import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { encryptSensitiveFields, auditLog } from './lib/kmsService.ts';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { tax_year, software = 'turbotax' } = await req.json();

        // Fetch all tax-relevant data
        const [documents, transactions, properties, investments] = await Promise.all([
            base44.entities.Document.filter({ 
                created_by: user.email,
                category: 'tax'
            }),
            base44.entities.Transaction.list('-date', 1000),
            base44.entities.Property.filter({ created_by: user.email }),
            base44.entities.Investment.filter({ created_by: user.email })
        ]);

        // Generate tax summary
        const taxSummary = await base44.integrations.Core.InvokeLLM({
            prompt: `Generate a tax summary report for ${tax_year}:

Properties (rental income/expenses): ${JSON.stringify(properties)}
Investment transactions: ${JSON.stringify(investments)}
Tax documents: ${documents.length} documents

Organize into:
- Total rental income
- Deductible rental expenses
- Investment gains/losses
- Key deductions
- Documents needed for filing

Return JSON format.`,
            response_json_schema: {
                type: 'object',
                properties: {
                    rental_income: { type: 'number' },
                    rental_expenses: { type: 'number' },
                    investment_gains: { type: 'number' },
                    investment_losses: { type: 'number' },
                    key_deductions: { type: 'array', items: { type: 'object' } },
                    missing_documents: { type: 'array', items: { type: 'string' } }
                }
            }
        });

        // Generate export file
        const exportData = {
            tax_year,
            taxpayer: {
                name: user.full_name,
                email: user.email
            },
            summary: taxSummary,
            documents: documents.map(d => ({
                title: d.title,
                type: d.document_type,
                url: d.file_url,
                amount: d.amount
            })),
            rental_properties: properties.map(p => ({
                address: p.address,
                rental_income: p.monthly_rent * 12,
                expenses: 0 // Calculate from maintenance/bills
            })),
            investments: investments.map(i => ({
                name: i.name,
                type: i.asset_type,
                cost_basis: i.cost_basis,
                current_value: i.current_value,
                gain_loss: (i.current_value || 0) - (i.cost_basis || 0)
            }))
        };

        // Encrypt sensitive fields in export data using KMS
        const sensitiveFields = ['email', 'name'];
        const encryptedExportData = await encryptSensitiveFields(exportData.taxpayer, sensitiveFields);
        exportData.taxpayer = encryptedExportData;
        
        auditLog('TAX_DATA_EXPORTED', {
            userId: user.id,
            taxYear: tax_year,
            software
        });

        return Response.json({
            success: true,
            export_data: exportData,
            download_url: `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(exportData, null, 2))}`,
            message: `Tax data for ${tax_year} ready for ${software}`
        });

    } catch (error) {
        console.error('Tax export error:', error);
        auditLog('TAX_EXPORT_FAILED', {}, error as Error);
        return Response.json({ 
            error: error.message,
            success: false 
        }, { status: 500 });
    }
});