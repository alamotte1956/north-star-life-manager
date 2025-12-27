import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity } from 'lucide-react';

export default function WearableDataChart({ data, type, title, color = '#D4AF37' }) {
    if (!data || data.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg font-light">
                        <Activity className="w-5 h-5" style={{ color }} />
                        {title}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-black/40">
                        No {type} data available
                    </div>
                </CardContent>
            </Card>
        );
    }

    const chartData = data
        .filter(d => d.data_type === type)
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(-14)
        .map(d => ({
            date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            value: type === 'sleep' ? (d.duration_minutes || 0) / 60 : d.value,
            fullDate: d.date
        }));

    const avg = chartData.reduce((sum, d) => sum + d.value, 0) / chartData.length;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center justify-between text-lg font-light">
                    <div className="flex items-center gap-2">
                        <Activity className="w-5 h-5" style={{ color }} />
                        {title}
                    </div>
                    <div className="text-sm font-normal text-black/60">
                        Avg: {avg.toFixed(1)} {type === 'heart_rate' ? 'bpm' : type === 'sleep' ? 'hrs' : ''}
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis 
                            dataKey="date" 
                            tick={{ fill: '#6b7280', fontSize: 12 }}
                        />
                        <YAxis 
                            tick={{ fill: '#6b7280', fontSize: 12 }}
                        />
                        <Tooltip 
                            contentStyle={{ 
                                backgroundColor: 'white',
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px'
                            }}
                        />
                        <Line 
                            type="monotone" 
                            dataKey="value" 
                            stroke={color} 
                            strokeWidth={2}
                            dot={{ fill: color, r: 4 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}