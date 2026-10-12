import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import jsPDF from 'npm:jspdf@2.5.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { report_type, format = 'pdf', parameters = {} } = await req.json();

        let reportData = {};
        let reportTitle = '';
        let reportContent = '';

        // Generate report based on type
        if (report_type === 'monthly_spending') {
            const transactions = await base44.entities.Transaction.list('-date', 100);
            const budgets = await base44.entities.Budget.list();
            
            const aiAnalysis = await base44.integrations.Core.InvokeLLM({
                prompt: `Analyze this monthly spending data and create a comprehensive spending analysis report.
                
Transactions: ${JSON.stringify(transactions.slice(0, 50))}
Budgets: ${JSON.stringify(budgets)}

Provide:
1. Executive Summary (2-3 sentences)
2. Top 5 spending categories with amounts
3. Budget vs actual comparison
4. Spending trends
5. Actionable recommendations (3-5 items)
6. Areas of concern
7. Positive financial behaviors`,
                response_json_schema: {
                    type: "object",
                    properties: {
                        executive_summary: { type: "string" },
                        top_categories: { 
                            type: "array", 
                            items: { 
                                type: "object",
                                properties: {
                                    category: { type: "string" },
                                    amount: { type: "number" },
                                    percentage: { type: "number" }
                                }
                            }
                        },
                        budget_analysis: { type: "string" },
                        trends: { type: "string" },
                        recommendations: { type: "array", items: { type: "string" } },
                        concerns: { type: "array", items: { type: "string" } },
                        positive_behaviors: { type: "array", items: { type: "string" } }
                    }
                }
            });

            reportTitle = 'Monthly Spending Analysis';
            reportData = aiAnalysis;
            
        } else if (report_type === 'investment_performance') {
            const investments = await base44.entities.Investment.list();
            const goals = await base44.entities.FinancialGoal.list();
            
            const aiAnalysis = await base44.integrations.Core.InvokeLLM({
                prompt: `Analyze this investment portfolio and create a comprehensive performance review.
                
Investments: ${JSON.stringify(investments)}
Financial Goals: ${JSON.stringify(goals)}

Provide:
1. Portfolio Overview (total value, total gains/losses)
2. Top 5 performing assets
3. Underperforming assets (if any)
4. Risk assessment
5. Diversification analysis
6. Recommendations for rebalancing
7. Progress toward financial goals
8. Market opportunities`,
                response_json_schema: {
                    type: "object",
                    properties: {
                        portfolio_overview: { type: "string" },
                        top_performers: { 
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    name: { type: "string" },
                                    return: { type: "number" },
                                    value: { type: "number" }
                                }
                            }
                        },
                        underperformers: { type: "array", items: { type: "string" } },
                        risk_assessment: { type: "string" },
                        diversification: { type: "string" },
                        rebalancing_recommendations: { type: "array", items: { type: "string" } },
                        goal_progress: { type: "string" },
                        market_opportunities: { type: "array", items: { type: "string" } }
                    }
                }
            });

            reportTitle = 'Investment Performance Review';
            reportData = aiAnalysis;
            
        } else if (report_type === 'succession_documents') {
            const documents = await base44.entities.Document.list('-created_date', 500);
            const directives = await base44.entities.AdvanceDirective.list();
            const beneficiaries = await base44.entities.Beneficiary.list();
            const emergencyInfo = await base44.entities.EmergencyInfo.list();
            
            const aiAnalysis = await base44.integrations.Core.InvokeLLM({
                prompt: `Review succession planning documents and create a status report.
                
Documents: ${documents.length} total
Advance Directives: ${JSON.stringify(directives)}
Beneficiaries: ${JSON.stringify(beneficiaries)}
Emergency Info: ${emergencyInfo.length} entries

Provide:
1. Completeness Assessment (percentage complete)
2. Missing Critical Documents
3. Documents Needing Updates
4. Beneficiary Coverage Analysis
5. Emergency Access Readiness
6. Recommendations for improvement
7. Legal compliance check`,
                response_json_schema: {
                    type: "object",
                    properties: {
                        completeness_score: { type: "number" },
                        completeness_assessment: { type: "string" },
                        missing_documents: { type: "array", items: { type: "string" } },
                        documents_needing_update: { type: "array", items: { type: "string" } },
                        beneficiary_analysis: { type: "string" },
                        emergency_readiness: { type: "string" },
                        recommendations: { type: "array", items: { type: "string" } },
                        compliance_check: { type: "string" }
                    }
                }
            });

            reportTitle = 'Succession Document Status Report';
            reportData = aiAnalysis;
        }

        // Generate PDF
        if (format === 'pdf') {
            const doc = new jsPDF();
            let y = 20;

            // Title
            doc.setFontSize(24);
            doc.text(reportTitle, 20, y);
            y += 10;

            // Date
            doc.setFontSize(10);
            doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, y);
            y += 15;

            // Content
            doc.setFontSize(12);
            
            for (const [key, value] of Object.entries(reportData)) {
                if (y > 270) {
                    doc.addPage();
                    y = 20;
                }

                // Section header
                doc.setFont(undefined, 'bold');
                const header = key.replace(/_/g, ' ').toUpperCase();
                doc.text(header, 20, y);
                y += 7;
                doc.setFont(undefined, 'normal');

                // Section content
                if (Array.isArray(value)) {
                    value.forEach(item => {
                        if (y > 270) {
                            doc.addPage();
                            y = 20;
                        }
                        const text = typeof item === 'object' ? JSON.stringify(item) : `• ${item}`;
                        const lines = doc.splitTextToSize(text, 170);
                        doc.text(lines, 25, y);
                        y += lines.length * 5 + 3;
                    });
                } else if (typeof value === 'object') {
                    const text = JSON.stringify(value, null, 2);
                    const lines = doc.splitTextToSize(text, 170);
                    doc.text(lines, 25, y);
                    y += lines.length * 5;
                } else {
                    const lines = doc.splitTextToSize(String(value), 170);
                    doc.text(lines, 25, y);
                    y += lines.length * 5;
                }
                y += 8;
            }

            const pdfBytes = doc.output('arraybuffer');
            return new Response(pdfBytes, {
                status: 200,
                headers: {
                    'Content-Type': 'application/pdf',
                    'Content-Disposition': `attachment; filename="${reportTitle.replace(/ /g, '-')}.pdf"`
                }
            });
        }

        // Generate CSV
        if (format === 'csv') {
            let csv = `${reportTitle}\nGenerated: ${new Date().toLocaleDateString()}\n\n`;
            
            for (const [key, value] of Object.entries(reportData)) {
                csv += `\n${key.replace(/_/g, ' ').toUpperCase()}\n`;
                if (Array.isArray(value)) {
                    value.forEach(item => {
                        csv += `"${typeof item === 'object' ? JSON.stringify(item) : item}"\n`;
                    });
                } else {
                    csv += `"${value}"\n`;
                }
            }

            return new Response(csv, {
                status: 200,
                headers: {
                    'Content-Type': 'text/csv',
                    'Content-Disposition': `attachment; filename="${reportTitle.replace(/ /g, '-')}.csv"`
                }
            });
        }

        return Response.json({ report: reportData }, { status: 200 });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});