import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Shield, Users, Calendar } from 'lucide-react';
import ScenarioSimulator from '@/components/wealth/ScenarioSimulator';
import EstatePlanningGuidance from '@/components/wealth/EstatePlanningGuidance';
import WealthPreservation from '@/components/wealth/WealthPreservation';
import IntergenerationTransfer from '@/components/wealth/IntergenerationTransfer';

export default function WealthLegacyPlanning() {
    const { data: user } = useQuery({
        queryKey: ['user'],
        queryFn: () => base44.auth.me()
    });

    const { data: investments } = useQuery({
        queryKey: ['investments'],
        queryFn: () => base44.entities.Investment.filter({ created_by: user?.email }),
        enabled: !!user
    });

    const { data: properties } = useQuery({
        queryKey: ['properties'],
        queryFn: () => base44.entities.Property.filter({ created_by: user?.email }),
        enabled: !!user
    });

    const totalWealth = (investments?.reduce((sum, inv) => sum + (inv.current_value || 0), 0) || 0) +
                        (properties?.reduce((sum, prop) => sum + (prop.estimated_value || 0), 0) || 0);

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F8F9FA] via-white to-[#E8EEF5]">
            <div className="max-w-7xl mx-auto px-6 py-12">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <div className="relative">
                        <div className="absolute inset-0 bg-[#D4AF37]/30 rounded-2xl blur-xl" />
                        <div className="relative bg-gradient-to-br from-[#D4AF37] to-[#F4D03F] p-4 rounded-2xl">
                            <TrendingUp className="w-8 h-8 text-black" />
                        </div>
                    </div>
                    <div>
                        <h1 className="text-4xl font-light text-black">Wealth & Legacy Planning</h1>
                        <p className="text-[#0F1729]/60 font-light">AI-Powered Financial Strategy & Estate Planning</p>
                    </div>
                </div>

                {/* Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-light text-[#0F1729]/60">Total Wealth</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-light text-[#2E5C8A]">
                                ${totalWealth.toLocaleString()}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-light text-[#0F1729]/60">Investments</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-light text-[#2E5C8A]">
                                {investments?.length || 0}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-light text-[#0F1729]/60">Properties</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-light text-[#2E5C8A]">
                                {properties?.length || 0}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content Tabs */}
                <Tabs defaultValue="simulator" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
                        <TabsTrigger value="simulator" className="gap-2">
                            <Calendar className="w-4 h-4" />
                            Scenario Simulator
                        </TabsTrigger>
                        <TabsTrigger value="estate" className="gap-2">
                            <Shield className="w-4 h-4" />
                            Estate Planning
                        </TabsTrigger>
                        <TabsTrigger value="preservation" className="gap-2">
                            <TrendingUp className="w-4 h-4" />
                            Wealth Preservation
                        </TabsTrigger>
                        <TabsTrigger value="transfer" className="gap-2">
                            <Users className="w-4 h-4" />
                            Legacy Transfer
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="simulator">
                        <ScenarioSimulator totalWealth={totalWealth} />
                    </TabsContent>

                    <TabsContent value="estate">
                        <EstatePlanningGuidance />
                    </TabsContent>

                    <TabsContent value="preservation">
                        <WealthPreservation totalWealth={totalWealth} />
                    </TabsContent>

                    <TabsContent value="transfer">
                        <IntergenerationTransfer />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}