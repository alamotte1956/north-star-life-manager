import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function PortfolioPerformanceChart({ investments }) {
    const [timeframe, setTimeframe] = useState('1M');
    const [chartData, setChartData] = useState([]);

    useEffect(() => {
        generateChartData();
    }, [investments, timeframe]);

    const generateChartData = () => {
        if (!investments || investments.length === 0) return;

        const days = timeframe === '1D' ? 1 : 
                     timeframe === '1W' ? 7 : 
                     timeframe === '1M' ? 30 : 
                     timeframe === '1Y' ? 365 : 
                     365 * 5;

        const data = [];
        const today = new Date();
        
        // Calculate total current value
        const totalCurrentValue = investments.reduce((sum, inv) => sum + (inv.current_value || 0), 0);
        const totalCostBasis = investments.reduce((sum, inv) => sum + (inv.cost_basis || 0), 0);
        const totalReturn = totalCurrentValue - totalCostBasis;
        
        // Generate historical data points
        for (let i = days; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            
            // Simulate portfolio value over time based on current return
            const dayProgress = (days - i) / days;
            const historicalReturn = totalReturn * dayProgress;
            const portfolioValue = totalCostBasis + historicalReturn;
            
            data.push({
                date: date.toISOString().split('T')[0],
                value: portfolioValue
            });
        }

        setChartData(data);
    };

    const timeframes = [
        { value: '1D', label: '1D' },
        { value: '1W', label: '1W' },
        { value: '1M', label: '1M' },
        { value: '1Y', label: '1Y' },
        { value: '5Y', label: '5Y' }
    ];

    const totalCurrentValue = investments.reduce((sum, inv) => sum + (inv.current_value || 0), 0);
    const totalCostBasis = investments.reduce((sum, inv) => sum + (inv.cost_basis || 0), 0);
    const totalReturn = totalCurrentValue - totalCostBasis;
    const totalReturnPercent = totalCostBasis > 0 ? (totalReturn / totalCostBasis) * 100 : 0;
    const isPositive = totalReturn >= 0;

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-lg font-light">Portfolio Performance</CardTitle>
                        <div className="flex items-center gap-3 mt-2">
                            <span className="text-2xl font-light">${totalCurrentValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                            <Badge className={`flex items-center gap-1 ${isPositive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                {isPositive ? '+' : ''}{totalReturnPercent.toFixed(2)}%
                            </Badge>
                        </div>
                    </div>
                    <div className="flex gap-1">
                        {timeframes.map(tf => (
                            <Button
                                key={tf.value}
                                variant={timeframe === tf.value ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setTimeframe(tf.value)}
                                className={timeframe === tf.value ? 'bg-[#4A90E2] text-white' : ''}
                            >
                                {tf.label}
                            </Button>
                        ))}
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis 
                            dataKey="date" 
                            tick={{ fontSize: 12 }}
                            tickFormatter={(value) => {
                                const date = new Date(value);
                                if (timeframe === '5Y') return date.toLocaleDateString([], { year: '2-digit', month: 'short' });
                                return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
                            }}
                        />
                        <YAxis 
                            tick={{ fontSize: 12 }}
                            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                        />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                            labelFormatter={(value) => new Date(value).toLocaleDateString()}
                            formatter={(value) => [`$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, 'Portfolio Value']}
                        />
                        <Line 
                            type="monotone" 
                            dataKey="value" 
                            stroke={isPositive ? '#10b981' : '#ef4444'}
                            strokeWidth={2}
                            dot={false}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}