import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function PortfolioChart({ investments }) {
    const data = investments
        .filter(inv => inv.current_value && inv.cost_basis)
        .map(inv => ({
            name: inv.ticker_symbol || inv.account_name,
            value: inv.current_value,
            cost: inv.cost_basis,
            gain: inv.unrealized_gain_loss,
            gainPercent: inv.unrealized_gain_loss_percent
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);

    if (data.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg font-light">Portfolio Performance</CardTitle>
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
                <CardTitle className="text-lg font-light">Portfolio Performance</CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                        <XAxis dataKey="name" stroke="#6B7280" />
                        <YAxis stroke="#6B7280" />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#FFF',
                                border: '1px solid #E5E7EB',
                                borderRadius: '8px'
                            }}
                            formatter={(value, name) => {
                                if (name === 'value') return [`$${value.toLocaleString()}`, 'Current Value'];
                                if (name === 'cost') return [`$${value.toLocaleString()}`, 'Cost Basis'];
                                return value;
                            }}
                        />
                        <Bar dataKey="value" fill="#D4AF37" radius={[8, 8, 0, 0]} />
                        <Bar dataKey="cost" fill="#1a1a1a" radius={[8, 8, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}