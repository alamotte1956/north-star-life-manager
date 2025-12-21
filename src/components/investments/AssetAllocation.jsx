import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const COLORS = ['#D4AF37', '#1a1a1a', '#F4D03F', '#8B7355', '#C5B358', '#6B5D4F'];

const assetTypeLabels = {
    stocks: 'Stocks',
    bonds: 'Bonds',
    mutual_funds: 'Mutual Funds',
    etf: 'ETF',
    crypto: 'Cryptocurrency',
    real_estate: 'Real Estate',
    commodities: 'Commodities',
    cash: 'Cash',
    other: 'Other'
};

export default function AssetAllocation({ investments }) {
    const allocation = {};
    
    investments.forEach(inv => {
        const type = inv.asset_type || 'other';
        allocation[type] = (allocation[type] || 0) + (inv.current_value || 0);
    });

    const data = Object.entries(allocation)
        .map(([type, value]) => ({
            name: assetTypeLabels[type] || type,
            value: value
        }))
        .sort((a, b) => b.value - a.value);

    if (data.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg font-light">Asset Allocation</CardTitle>
                </CardHeader>
                <CardContent className="h-80 flex items-center justify-center">
                    <p className="text-white/40">No data to display</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg font-light">Asset Allocation</CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip
                            formatter={(value) => `$${value.toLocaleString()}`}
                            contentStyle={{
                                backgroundColor: '#FFF',
                                border: '1px solid #E5E7EB',
                                borderRadius: '8px'
                            }}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}