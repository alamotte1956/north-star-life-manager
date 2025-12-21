import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Home, TrendingUp, Wrench, DollarSign, AlertTriangle, Sparkles, Users, Calendar, FileText, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { format } from 'date-fns';
import PrintButton from '@/components/PrintButton';
import TenantCommunications from '@/components/property/TenantCommunications';
import RentCollectionManager from '@/components/property/RentCollectionManager';
import PropertyValuation from '@/components/property/PropertyValuation';
import RentPricingSuggestions from '@/components/property/RentPricingSuggestions';
import TenantCommunicationHub from '@/components/property/TenantCommunicationHub';
import LeaseManagement from '@/components/property/LeaseManagement';
import LeaseAlerts from '@/components/property/LeaseAlerts';

export default function PropertyManagement() {
    const [selectedProperty, setSelectedProperty] = useState(null);
    const [loadingInsights, setLoadingInsights] = useState(false);
    const [insights, setInsights] = useState(null);

    const { data: properties = [], refetch } = useQuery({
        queryKey: ['properties'],
        queryFn: () => base44.entities.Property.list('-created_date')
    });

    const { data: maintenanceTasks = [] } = useQuery({
        queryKey: ['maintenanceTasks'],
        queryFn: () => base44.entities.MaintenanceTask.list('-next_due_date')
    });

    const { data: documents = [] } = useQuery({
        queryKey: ['propertyDocuments'],
        queryFn: () => base44.entities.Document.filter({ category: 'property' })
    });

    const getPropertyInsights = async (propertyId = null) => {
        setLoadingInsights(true);
        try {
            const result = await base44.functions.invoke('getPropertyInsights', {
                property_id: propertyId
            });
            setInsights(result.data.insights);
            toast.success('Property insights generated!');
        } catch (error) {
            toast.error('Failed to generate insights');
        }
        setLoadingInsights(false);
    };

    const getScoreColor = (score) => {
        if (score >= 80) return 'text-green-600';
        if (score >= 60) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getScoreBg = (score) => {
        if (score >= 80) return 'bg-green-100 border-green-200';
        if (score >= 60) return 'bg-yellow-100 border-yellow-200';
        return 'bg-red-100 border-red-200';
    };

    // Calculate portfolio summary
    const portfolioValue = properties.reduce((sum, p) => sum + (p.current_value || 0), 0);
    const totalRent = properties.reduce((sum, p) => sum + (p.monthly_rent || 0), 0);
    const overdueMaintenance = maintenanceTasks.filter(t => t.status === 'overdue').length;

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F8F7F4] via-white to-[#F8F7F4]">
            <div className="max-w-7xl mx-auto px-6 py-12">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div className="absolute inset-0 bg-[#D4AF37]/30 rounded-2xl blur-xl" />
                            <div className="relative bg-gradient-to-br from-[#1A2B44] to-[#0F1B2E] p-4 rounded-2xl">
                                <Home className="w-8 h-8 text-[#D4AF37]" />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-4xl font-light text-[#1A2B44]">Property Management</h1>
                            <p className="text-[#1A2B44]/60 font-light">AI-powered insights & analytics</p>
                        </div>
                    </div>
                    <div className="flex gap-2 print:hidden">
                        <PrintButton />
                        <Button
                            onClick={() => getPropertyInsights()}
                            disabled={loadingInsights}
                            className="bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] hover:shadow-lg"
                        >
                            <Sparkles className={`w-4 h-4 mr-2 ${loadingInsights ? 'animate-spin' : ''}`} />
                            Generate Insights
                        </Button>
                    </div>
                </div>

                {/* Portfolio Overview */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3 mb-2">
                                <Home className="w-5 h-5 text-blue-600" />
                                <span className="text-sm text-gray-600">Total Properties</span>
                            </div>
                            <div className="text-3xl font-light text-[#1A2B44]">{properties.length}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3 mb-2">
                                <DollarSign className="w-5 h-5 text-green-600" />
                                <span className="text-sm text-gray-600">Portfolio Value</span>
                            </div>
                            <div className="text-3xl font-light text-[#1A2B44]">
                                ${(portfolioValue / 1000000).toFixed(1)}M
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3 mb-2">
                                <TrendingUp className="w-5 h-5 text-purple-600" />
                                <span className="text-sm text-gray-600">Monthly Rent</span>
                            </div>
                            <div className="text-3xl font-light text-[#1A2B44]">
                                ${totalRent.toLocaleString()}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3 mb-2">
                                <AlertTriangle className="w-5 h-5 text-orange-600" />
                                <span className="text-sm text-gray-600">Overdue Tasks</span>
                            </div>
                            <div className="text-3xl font-light text-[#1A2B44]">{overdueMaintenance}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Lease Alerts */}
                <div className="mb-8">
                    <LeaseAlerts properties={properties} />
                </div>

                {/* AI Insights Section */}
                {insights && (
                    <div className="mb-8">
                        {Array.isArray(insights) ? (
                            <div className="space-y-6">
                                {insights.map(insight => (
                                    <PropertyInsightCard key={insight.property_id} insight={insight} />
                                ))}
                            </div>
                        ) : (
                            <PropertyInsightCard insight={insights} />
                        )}
                    </div>
                )}

                {/* Properties Grid */}
                <Tabs defaultValue="properties" className="space-y-6">
                    <TabsList>
                        <TabsTrigger value="properties">Properties</TabsTrigger>
                        <TabsTrigger value="pricing">AI Rent Pricing</TabsTrigger>
                        <TabsTrigger value="rent">Rent Collection</TabsTrigger>
                        <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
                        <TabsTrigger value="documents">Documents</TabsTrigger>
                        <TabsTrigger value="leases">Lease Management</TabsTrigger>
                        <TabsTrigger value="communications">Tenant Communications</TabsTrigger>
                    </TabsList>

                    <TabsContent value="pricing">
                        <div className="space-y-6">
                            {properties.map(property => (
                                <Card key={property.id}>
                                    <CardHeader>
                                        <CardTitle className="text-xl font-light">{property.name}</CardTitle>
                                        {property.address && (
                                            <p className="text-sm text-gray-600">{property.address}</p>
                                        )}
                                    </CardHeader>
                                    <CardContent>
                                        <RentPricingSuggestions property={property} onUpdate={() => refetch()} />
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="rent">
                        <RentCollectionManager properties={properties} />
                    </TabsContent>

                    <TabsContent value="properties">
                        <div className="grid grid-cols-1 gap-6">
                            {properties.map(property => (
                                <Card key={property.id} className="hover:shadow-xl transition-all">
                                    <CardHeader>
                                        <CardTitle className="flex items-start justify-between">
                                            <span className="text-xl font-light">{property.name}</span>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => getPropertyInsights(property.id)}
                                                disabled={loadingInsights}
                                            >
                                                <Sparkles className="w-4 h-4" />
                                            </Button>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-4">
                                                {property.address && (
                                                    <p className="text-sm text-gray-600">{property.address}</p>
                                                )}

                                                {(property.ai_maintenance_score || property.ai_financial_score) && (
                                                    <div className="space-y-3">
                                                        {property.ai_maintenance_score && (
                                                            <div>
                                                                <div className="flex justify-between text-sm mb-1">
                                                                    <span>Maintenance Health</span>
                                                                    <span className={getScoreColor(property.ai_maintenance_score)}>
                                                                        {property.ai_maintenance_score}/100
                                                                    </span>
                                                                </div>
                                                                <Progress value={property.ai_maintenance_score} />
                                                            </div>
                                                        )}
                                                        {property.ai_financial_score && (
                                                            <div>
                                                                <div className="flex justify-between text-sm mb-1">
                                                                    <span>Financial Health</span>
                                                                    <span className={getScoreColor(property.ai_financial_score)}>
                                                                        {property.ai_financial_score}/100
                                                                    </span>
                                                                </div>
                                                                <Progress value={property.ai_financial_score} />
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {property.tenant_name && (
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <Users className="w-4 h-4 text-blue-600" />
                                                        <span>Tenant: {property.tenant_name}</span>
                                                    </div>
                                                )}

                                                {property.lease_end_date && (
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <Calendar className="w-4 h-4 text-orange-600" />
                                                        <span>Lease ends: {format(new Date(property.lease_end_date), 'MMM d, yyyy')}</span>
                                                    </div>
                                                )}

                                                {property.monthly_rent && (
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <DollarSign className="w-4 h-4 text-green-600" />
                                                        <span>Rent: ${property.monthly_rent.toLocaleString()}/month</span>
                                                    </div>
                                                )}

                                                {property.next_major_repair && (
                                                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                                                        <div className="flex items-start gap-2">
                                                            <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5" />
                                                            <div>
                                                                <p className="text-sm font-medium text-orange-900">
                                                                    {property.next_major_repair}
                                                                </p>
                                                                {property.estimated_repair_cost && (
                                                                    <p className="text-sm text-orange-700 mt-1">
                                                                        Est. ${property.estimated_repair_cost.toLocaleString()}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <PropertyValuation property={property} onUpdate={() => refetch()} />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="maintenance">
                        <div className="space-y-4">
                            {maintenanceTasks.map(task => (
                                <Card key={task.id}>
                                    <CardContent className="pt-6">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <h3 className="font-medium text-[#1A2B44]">{task.title}</h3>
                                                <p className="text-sm text-gray-600 mt-1">{task.property_name}</p>
                                                <div className="flex items-center gap-4 mt-3">
                                                    <Badge className={
                                                        task.status === 'overdue' ? 'bg-red-100 text-red-700' :
                                                        task.status === 'due' ? 'bg-orange-100 text-orange-700' :
                                                        'bg-blue-100 text-blue-700'
                                                    }>
                                                        {task.status}
                                                    </Badge>
                                                    {task.next_due_date && (
                                                        <span className="text-sm text-gray-600">
                                                            Due: {format(new Date(task.next_due_date), 'MMM d, yyyy')}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <Wrench className="w-5 h-5 text-[#D4AF37]" />
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="documents">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {documents.map(doc => (
                                <Card key={doc.id}>
                                    <CardContent className="pt-6">
                                        <div className="flex items-start gap-3">
                                            <FileText className="w-5 h-5 text-[#D4AF37]" />
                                            <div className="flex-1">
                                                <h3 className="font-medium text-[#1A2B44]">{doc.title}</h3>
                                                <p className="text-sm text-gray-600 mt-1">{doc.document_type}</p>
                                                {doc.ai_summary && (
                                                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">{doc.ai_summary}</p>
                                                )}
                                                {doc.amount && (
                                                    <p className="text-sm font-medium text-green-700 mt-2">
                                                        ${doc.amount.toLocaleString()}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="leases">
                        <div className="space-y-6">
                            {properties.map(property => (
                                <Card key={property.id}>
                                    <CardHeader>
                                        <CardTitle className="text-xl font-light">{property.name}</CardTitle>
                                        {property.address && (
                                            <p className="text-sm text-gray-600">{property.address}</p>
                                        )}
                                    </CardHeader>
                                    <CardContent>
                                        <LeaseManagement property={property} onUpdate={refetch} />
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="communications">
                        <div className="space-y-6">
                            {properties.map(property => (
                                <Card key={property.id}>
                                    <CardHeader>
                                        <CardTitle className="text-xl font-light">{property.name}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <TenantCommunicationHub property={property} />
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}

function PropertyInsightCard({ insight }) {
    const getScoreColor = (score) => {
        if (score >= 80) return 'text-green-600';
        if (score >= 60) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getScoreBg = (score) => {
        if (score >= 80) return 'bg-green-100 border-green-200';
        if (score >= 60) return 'bg-yellow-100 border-yellow-200';
        return 'bg-red-100 border-red-200';
    };

    return (
        <Card className="shadow-xl">
            <CardHeader>
                <CardTitle className="text-2xl font-light flex items-center gap-2">
                    <Sparkles className="w-6 h-6 text-[#D4AF37]" />
                    {insight.property_name} - AI Insights
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Scores */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className={`p-4 rounded-lg border ${getScoreBg(insight.maintenance_score)}`}>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">Maintenance Health</span>
                            <span className={`text-2xl font-light ${getScoreColor(insight.maintenance_score)}`}>
                                {insight.maintenance_score}
                            </span>
                        </div>
                        <Progress value={insight.maintenance_score} />
                    </div>
                    <div className={`p-4 rounded-lg border ${getScoreBg(insight.financial_score)}`}>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">Financial Health</span>
                            <span className={`text-2xl font-light ${getScoreColor(insight.financial_score)}`}>
                                {insight.financial_score}
                            </span>
                        </div>
                        <Progress value={insight.financial_score} />
                    </div>
                </div>

                {/* Analysis */}
                {insight.maintenance_trends && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="font-medium text-blue-900 mb-2">Maintenance Trends</h4>
                        <p className="text-sm text-blue-800">{insight.maintenance_trends}</p>
                    </div>
                )}

                {insight.financial_performance && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <h4 className="font-medium text-green-900 mb-2">Financial Performance</h4>
                        <p className="text-sm text-green-800">{insight.financial_performance}</p>
                    </div>
                )}

                {insight.lease_insights && (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                        <h4 className="font-medium text-purple-900 mb-2">Lease Insights</h4>
                        <p className="text-sm text-purple-800">{insight.lease_insights}</p>
                    </div>
                )}

                {/* Risk Factors */}
                {insight.risk_factors?.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <h4 className="font-medium text-red-900 mb-3 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            Risk Factors
                        </h4>
                        <ul className="space-y-2">
                            {insight.risk_factors.map((risk, i) => (
                                <li key={i} className="text-sm text-red-800 flex items-start gap-2">
                                    <span>•</span>
                                    {risk}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Recommendations */}
                {insight.recommendations?.length > 0 && (
                    <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                        <h4 className="font-medium text-indigo-900 mb-3">Recommendations</h4>
                        <ul className="space-y-2">
                            {insight.recommendations.map((rec, i) => (
                                <li key={i} className="text-sm text-indigo-800 flex items-start gap-2">
                                    <span className="font-bold">{i + 1}.</span>
                                    {rec}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Upcoming Deadlines */}
                {insight.upcoming_deadlines?.length > 0 && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                        <h4 className="font-medium text-orange-900 mb-3 flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            Upcoming Deadlines
                        </h4>
                        <ul className="space-y-2">
                            {insight.upcoming_deadlines.map((deadline, i) => (
                                <li key={i} className="text-sm text-orange-800 flex items-start gap-2">
                                    <span>📅</span>
                                    {deadline}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}