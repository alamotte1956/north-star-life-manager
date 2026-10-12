import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { document_id } = await req.json();
        
        // Get the document
        const document = await base44.entities.Document.filter({ id: document_id });
        if (!document || document.length === 0) {
            return Response.json({ error: 'Document not found' }, { status: 404 });
        }
        
        const doc = document[0];
        
        // Extract data using AI with OCR
        const extractedData = await base44.integrations.Core.InvokeLLM({
            prompt: `Analyze this financial document and extract all relevant information. This could be an invoice, receipt, bill, bank statement, or financial report.
            
            Document Title: ${doc.title}
            Document Type: ${doc.document_type || 'Unknown'}
            
            Extract and structure the following information:`,
            file_urls: [doc.file_url],
            response_json_schema: {
                type: 'object',
                properties: {
                    document_type: {
                        type: 'string',
                        enum: ['invoice', 'receipt', 'bill', 'bank_statement', 'tax_document', 'insurance_policy', 'contract', 'other']
                    },
                    vendor_name: { type: 'string' },
                    total_amount: { type: 'number' },
                    currency: { type: 'string', default: 'USD' },
                    transaction_date: { type: 'string' },
                    due_date: { type: 'string' },
                    expiry_date: { type: 'string' },
                    invoice_number: { type: 'string' },
                    payment_method: { type: 'string' },
                    category: {
                        type: 'string',
                        enum: ['property', 'vehicle', 'subscription', 'maintenance', 'health', 'utilities', 'groceries', 'dining', 'entertainment', 'travel', 'other']
                    },
                    line_items: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                description: { type: 'string' },
                                quantity: { type: 'number' },
                                unit_price: { type: 'number' },
                                total: { type: 'number' }
                            }
                        }
                    },
                    tax_amount: { type: 'number' },
                    subtotal: { type: 'number' },
                    notes: { type: 'string' },
                    extracted_text: { type: 'string' }
                }
            }
        });
        
        // Update document with extracted data
        await base44.entities.Document.update(document_id, {
            extracted_data: extractedData,
            document_type: extractedData.document_type,
            category: extractedData.category,
            amount: extractedData.total_amount,
            expiry_date: extractedData.expiry_date || extractedData.due_date,
            extracted_text: extractedData.extracted_text,
            analysis_status: 'completed'
        });
        
        // Auto-link to bills if it's a bill/invoice
        if (['invoice', 'bill'].includes(extractedData.document_type) && extractedData.total_amount) {
            const existingBills = await base44.entities.BillPayment.filter({
                bill_name: extractedData.vendor_name,
                amount: extractedData.total_amount
            });
            
            if (existingBills.length === 0) {
                // Create a new bill
                const newBill = await base44.entities.BillPayment.create({
                    bill_name: extractedData.vendor_name || doc.title,
                    amount: extractedData.total_amount,
                    due_date: extractedData.due_date || extractedData.transaction_date,
                    category: extractedData.category,
                    status: 'pending',
                    payment_method: extractedData.payment_method,
                    notes: `Auto-created from document: ${doc.title}`,
                    invoice_number: extractedData.invoice_number
                });
                
                // Link document to bill
                await base44.entities.Document.update(document_id, {
                    linked_entity_type: 'BillPayment',
                    linked_entity_id: newBill.id,
                    linked_entity_name: newBill.bill_name
                });
            }
        }
        
        // Auto-create budget transaction if category matches a budget
        if (extractedData.category && extractedData.total_amount) {
            const budgets = await base44.entities.Budget.filter({
                category: extractedData.category
            });
            
            for (const budget of budgets) {
                const periodStart = new Date(budget.period_start);
                const periodEnd = new Date(budget.period_end);
                const transactionDate = new Date(extractedData.transaction_date || Date.now());
                
                if (transactionDate >= periodStart && transactionDate <= periodEnd) {
                    // Check if transaction already exists
                    const existing = await base44.entities.BudgetTransaction.filter({
                        budget_id: budget.id,
                        source_type: 'manual',
                        description: doc.title
                    });
                    
                    if (existing.length === 0) {
                        await base44.entities.BudgetTransaction.create({
                            budget_id: budget.id,
                            category: extractedData.category,
                            amount: extractedData.total_amount,
                            description: `${extractedData.vendor_name || doc.title}`,
                            transaction_date: extractedData.transaction_date || new Date().toISOString().split('T')[0],
                            source_type: 'manual',
                            source_id: document_id,
                            notes: `Auto-linked from document analysis`
                        });
                        
                        // Update budget current spending
                        const transactions = await base44.entities.BudgetTransaction.filter({
                            budget_id: budget.id
                        });
                        const totalSpending = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
                        
                        await base44.entities.Budget.update(budget.id, {
                            current_spending: totalSpending
                        });
                    }
                }
            }
        }
        
        // Generate AI summary
        const summary = await base44.integrations.Core.InvokeLLM({
            prompt: `Create a concise 2-3 sentence summary of this financial document and its key information:
            
            ${JSON.stringify(extractedData, null, 2)}`,
            response_json_schema: {
                type: 'object',
                properties: {
                    summary: { type: 'string' },
                    key_points: {
                        type: 'array',
                        items: { type: 'string' }
                    },
                    action_items: {
                        type: 'array',
                        items: { type: 'string' }
                    }
                }
            }
        });
        
        await base44.entities.Document.update(document_id, {
            ai_summary: summary.summary,
            key_points: summary.key_points,
            action_items: summary.action_items
        });
        
        return Response.json({
            success: true,
            extracted_data: extractedData,
            summary: summary,
            auto_linked: {
                bill_created: ['invoice', 'bill'].includes(extractedData.document_type),
                budget_linked: extractedData.category ? true : false
            }
        });
        
    } catch (error) {
        console.error('Error analyzing financial document:', error);
        return Response.json({ 
            success: false, 
            error: error.message 
        }, { status: 500 });
    }
});