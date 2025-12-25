import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';

export default function ForecastChart({ projections }) {
    const data = [
        {
            period: 'Now',
            netWorth: 0,
            investments: 0
        },
        {
            period: '1 Year',
            netWorth: projections.one_year.net_worth,
            investments: projections.one_year.investment_value,
            savings: projections.one_year.total_saved
        },
        {
            period: '5 Years',
            netWorth: projections.five_year.net_worth,
            investments: projections.five_year.investment_value,
            savings: projections.five_year.total_saved
        },
        {
            period: '10 Years',
            netWorth: projections.ten_year.net_worth,
            investments: projections.ten_year.investment_value,
            savings: projections.ten_year.total_saved
        }
    ];

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg font-light flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-[#C5A059]" />
                    Net Worth Projection
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="period" />
                        <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`} />
                        <Tooltip 
                            formatter={(value) => `$${value.toLocaleString()}`}
                            contentStyle={{ backgroundColor: '#fff', border: '1px solid #C5A059' }}
                        />
                        <Legend />
                        <Line type="monotone" dataKey="netWorth" stroke="#C5A059" strokeWidth={3} name="Net Worth" />
                        <Line type="monotone" dataKey="investments" stroke="#3B82F6" strokeWidth={2} name="Investments" />
                        <Line type="monotone" dataKey="savings" stroke="#10B981" strokeWidth={2} name="Total Saved" />
                    </LineChart>
                </ResponsiveContainer>

                <div className="grid grid-cols-3 gap-4 mt-6">
                    <div className="text-center p-4 bg-[#F8F9FA] rounded-lg">
                        <div className="text-2xl font-light text-[#0F172A]">
                            ${projections.one_year.net_worth.toLocaleString()}
                        </div>
                        <div className="text-xs text-[#64748B] mb-2">1 Year Projection</div>
                        <p className="text-xs text-[#0F172A]/70">{projections.one_year.summary}</p>
                    </div>
                    <div className="text-center p-4 bg-[#F8F9FA] rounded-lg">
                        <div className="text-2xl font-light text-[#0F172A]">
                            ${projections.five_year.net_worth.toLocaleString()}
                        </div>
                        <div className="text-xs text-[#64748B] mb-2">5 Year Projection</div>
                        <p className="text-xs text-[#0F172A]/70">{projections.five_year.summary}</p>
                    </div>
                    <div className="text-center p-4 bg-[#F8F9FA] rounded-lg">
                        <div className="text-2xl font-light text-[#0F172A]">
                            ${projections.ten_year.net_worth.toLocaleString()}
                        </div>
                        <div className="text-xs text-[#64748B] mb-2">10 Year Projection</div>
                        <p className="text-xs text-[#0F172A]/70">{projections.ten_year.summary}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}