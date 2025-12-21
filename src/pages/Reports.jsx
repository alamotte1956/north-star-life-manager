import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { FileText, Download, DollarSign, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, startOfYear, endOfYear, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';

export default function Reports() {
    const [period, setPeriod] = useState('year');
    const [year, setYear] = useState(new Date().getFullYear());
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [exporting, setExporting] = useState(false);

    const { data: vehicles = [] } = useQuery({
        queryKey: ['vehicles-reports'],
        queryFn: () => base44.entities.Vehicle.list()
    });

    const { data: subscriptions = [] } = useQuery({
        queryKey: ['subscriptions-reports'],
        queryFn: () => base44.entities.Subscription.list()
    });

    const { data: maintenanceTasks = [] } = useQuery({
        queryKey: ['maintenance-reports'],
        queryFn: () => base44.entities.MaintenanceTask.list()
    });

    const { data: properties = [] } = useQuery({
        queryKey: ['properties-reports'],
        queryFn: () => base44.entities.Property.list()
    });

    const dateRange = useMemo(() => {
        if (period === 'year') {
            return {
                start: startOfYear(new Date(year, 0, 1)),
                end: endOfYear(new Date(year, 0, 1))
            };
        } else {
            return {
                start: startOfMonth(new Date(year, month - 1, 1)),
                end: endOfMonth(new Date(year, month - 1, 1))
            };
        }
    }, [period, year, month]);

    const financialSummary = useMemo(() => {
        const summary = {
            subscriptions: 0,
            maintenance: 0,
            properties: 0,
            vehicles: 0,
            total: 0,
            details: {
                subscriptions: [],
                maintenance: [],
                properties: [],
                vehicles: []
            }
        };

        // Subscriptions - annualize or calculate for period
        subscriptions.forEach(sub => {
            if (sub.billing_amount) {
                let annualCost = 0;
                switch (sub.billing_frequency) {
                    case 'monthly': annualCost = sub.billing_amount * 12; break;
                    case 'quarterly': annualCost = sub.billing_amount * 4; break;
                    case 'semi_annual': annualCost = sub.billing_amount * 2; break;
                    case 'annual': annualCost = sub.billing_amount; break;
                    default: annualCost = sub.billing_amount;
                }
                
                const periodCost = period === 'year' ? annualCost : annualCost / 12;
                summary.subscriptions += periodCost;
                summary.details.subscriptions.push({
                    name: sub.name,
                    provider: sub.provider,
                    amount: periodCost
                });
            }
        });

        // Maintenance - filter by date if completed
        maintenanceTasks.forEach(task => {
            if (task.estimated_cost && task.last_completed) {
                try {
                    const completedDate = parseISO(task.last_completed);
                    if (isWithinInterval(completedDate, dateRange)) {
                        summary.maintenance += task.estimated_cost;
                        summary.details.maintenance.push({
                            title: task.title,
                            property: task.property_name,
                            amount: task.estimated_cost,
                            date: task.last_completed
                        });
                    }
                } catch (e) {
                    // Skip invalid dates
                }
            }
        });

        // Properties - annual tax divided by period
        properties.forEach(prop => {
            if (prop.property_tax_annual) {
                const periodTax = period === 'year' ? prop.property_tax_annual : prop.property_tax_annual / 12;
                summary.properties += periodTax;
                summary.details.properties.push({
                    name: prop.name,
                    amount: periodTax,
                    type: 'Property Tax'
                });
            }
        });

        // Vehicles - just list them for reference
        vehicles.forEach(vehicle => {
            if (vehicle.last_service_date) {
                try {
                    const serviceDate = parseISO(vehicle.last_service_date);
                    if (isWithinInterval(serviceDate, dateRange)) {
                        summary.details.vehicles.push({
                            name: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
                            date: vehicle.last_service_date
                        });
                    }
                } catch (e) {
                    // Skip invalid dates
                }
            }
        });

        summary.total = summary.subscriptions + summary.maintenance + summary.properties;
        return summary;
    }, [subscriptions, maintenanceTasks, properties, vehicles, dateRange, period]);

    const handleExport = async () => {
        setExporting(true);
        try {
            const response = await base44.functions.invoke('generateFinancialReport', {
                period,
                year,
                month,
                summary: financialSummary
            });
            
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `financial-report-${period}-${year}${period === 'month' ? `-${month}` : ''}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
        } catch (error) {
            console.error('Export failed:', error);
        } finally {
            setExporting(false);
        }
    };

    const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);
    const months = [
        { value: 1, label: 'January' },
        { value: 2, label: 'February' },
        { value: 3, label: 'March' },
        { value: 4, label: 'April' },
        { value: 5, label: 'May' },
        { value: 6, label: 'June' },
        { value: 7, label: 'July' },
        { value: 8, label: 'August' },
        { value: 9, label: 'September' },
        { value: 10, label: 'October' },
        { value: 11, label: 'November' },
        { value: 12, label: 'December' }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F8F7F4] via-white to-[#F8F7F4]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div className="absolute inset-0 bg-[#C9A95C]/30 rounded-2xl blur-xl" />
                            <div className="relative bg-gradient-to-br from-[#1A2B44] to-[#0F1B2E] p-4 rounded-2xl">
                                <FileText className="w-8 h-8 text-[#C9A95C]" />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-4xl font-light text-[#1A2B44]">Financial Reports</h1>
                            <p className="text-[#1A2B44]/60 font-light">Expense summaries for tax & budgeting</p>
                        </div>
                    </div>

                    <Button
                        onClick={handleExport}
                        disabled={exporting}
                        className="bg-gradient-to-r from-[#1A2B44] to-[#0F1B2E] hover:shadow-lg text-white"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        {exporting ? 'Generating...' : 'Export PDF'}
                    </Button>
                </div>

                {/* Filters */}
                <Card className="mb-6">
                    <CardContent className="pt-6">
                        <div className="flex flex-wrap gap-4">
                            <div>
                                <Label>Period</Label>
                                <Select value={period} onValueChange={setPeriod}>
                                    <SelectTrigger className="w-32">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="month">Monthly</SelectItem>
                                        <SelectItem value="year">Yearly</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label>Year</Label>
                                <Select value={year.toString()} onValueChange={(v) => setYear(parseInt(v))}>
                                    <SelectTrigger className="w-32">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {years.map(y => (
                                            <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {period === 'month' && (
                                <div>
                                    <Label>Month</Label>
                                    <Select value={month.toString()} onValueChange={(v) => setMonth(parseInt(v))}>
                                        <SelectTrigger className="w-40">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {months.map(m => (
                                                <SelectItem key={m.value} value={m.value.toString()}>
                                                    {m.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between mb-2">
                                <div className="text-sm text-[#1A2B44]/60">Subscriptions</div>
                                <DollarSign className="w-5 h-5 text-green-600" />
                            </div>
                            <div className="text-2xl font-light text-[#1A2B44]">
                                ${financialSummary.subscriptions.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between mb-2">
                                <div className="text-sm text-[#1A2B44]/60">Maintenance</div>
                                <TrendingUp className="w-5 h-5 text-orange-600" />
                            </div>
                            <div className="text-2xl font-light text-[#1A2B44]">
                                ${financialSummary.maintenance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between mb-2">
                                <div className="text-sm text-[#1A2B44]/60">Property Tax</div>
                                <FileText className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="text-2xl font-light text-[#1A2B44]">
                                ${financialSummary.properties.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-[#1A2B44] to-[#0F1B2E]">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between mb-2">
                                <div className="text-sm text-white/80">Total Expenses</div>
                                <DollarSign className="w-5 h-5 text-[#C9A95C]" />
                            </div>
                            <div className="text-2xl font-light text-white">
                                ${financialSummary.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Detailed Breakdown */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Subscriptions */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg font-light">Subscriptions Breakdown</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {financialSummary.details.subscriptions.length > 0 ? (
                                <div className="space-y-3">
                                    {financialSummary.details.subscriptions.map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-start pb-3 border-b last:border-0">
                                            <div>
                                                <div className="font-medium text-[#1A2B44]">{item.name}</div>
                                                <div className="text-xs text-[#1A2B44]/60">{item.provider}</div>
                                            </div>
                                            <div className="text-sm text-[#1A2B44]">
                                                ${item.amount.toFixed(2)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-[#1A2B44]/40">No subscription expenses</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Maintenance */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg font-light">Maintenance Costs</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {financialSummary.details.maintenance.length > 0 ? (
                                <div className="space-y-3">
                                    {financialSummary.details.maintenance.map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-start pb-3 border-b last:border-0">
                                            <div>
                                                <div className="font-medium text-[#1A2B44]">{item.title}</div>
                                                <div className="text-xs text-[#1A2B44]/60">
                                                    {item.property} • {format(parseISO(item.date), 'MMM d, yyyy')}
                                                </div>
                                            </div>
                                            <div className="text-sm text-[#1A2B44]">
                                                ${item.amount.toFixed(2)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-[#1A2B44]/40">No maintenance costs in this period</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Property Tax */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg font-light">Property Expenses</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {financialSummary.details.properties.length > 0 ? (
                                <div className="space-y-3">
                                    {financialSummary.details.properties.map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-start pb-3 border-b last:border-0">
                                            <div>
                                                <div className="font-medium text-[#1A2B44]">{item.name}</div>
                                                <div className="text-xs text-[#1A2B44]/60">{item.type}</div>
                                            </div>
                                            <div className="text-sm text-[#1A2B44]">
                                                ${item.amount.toFixed(2)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-[#1A2B44]/40">No property expenses</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Vehicle Services */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg font-light">Vehicle Services</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {financialSummary.details.vehicles.length > 0 ? (
                                <div className="space-y-3">
                                    {financialSummary.details.vehicles.map((item, idx) => (
                                        <div key={idx} className="pb-3 border-b last:border-0">
                                            <div className="font-medium text-[#1A2B44]">{item.name}</div>
                                            <div className="text-xs text-[#1A2B44]/60">
                                                Service: {format(parseISO(item.date), 'MMM d, yyyy')}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-[#1A2B44]/40">No vehicle services in this period</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}