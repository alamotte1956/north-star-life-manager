import React, { useState, useEffect } from 'react';
import logger from '@/utils/logger';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Loader2 } from 'lucide-react';

export default function HistoricalChart({ ticker, assetName }) {
    const [timeframe, setTimeframe] = useState('1M');
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(null);

    useEffect(() => {
        if (ticker) {
            fetchHistoricalData();
        }
    }, [ticker, timeframe]);

    const fetchHistoricalData = async () => {
        setLoading(true);
        try {
            const result = await base44.functions.invoke('fetchMarketPrices', {
                ticker,
                timeframe
            });
            setData(result.data);
        } catch (error) {
            logger.error('Failed to fetch historical data:', error);
        }
        setLoading(false);
    };

    const timeframes = [
        { value: '1D', label: '1D' },
        { value: '1W', label: '1W' },
        { value: '1M', label: '1M' },
        { value: '1Y', label: '1Y' },
        { value: '5Y', label: '5Y' }
    ];

    if (loading) {
        return (
            <Card>
                <CardContent className="pt-6 flex items-center justify-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin text-[#4A90E2]" />
                </CardContent>
            </Card>
        );
    }

    if (!data || !data.historical_data || data.historical_data.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg font-light">{assetName || ticker} Performance</CardTitle>
                </CardHeader>
                <CardContent className="text-center py-8 text-gray-500">
                    No historical data available
                </CardContent>
            </Card>
        );
    }

    const isPositive = (data.change_percent || 0) >= 0;

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-lg font-light">{assetName || ticker}</CardTitle>
                        <div className="flex items-center gap-3 mt-2">
                            <span className="text-2xl font-light">${data.current_price?.toFixed(2)}</span>
                            <Badge className={`flex items-center gap-1 ${isPositive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                {isPositive ? '+' : ''}{data.change_percent?.toFixed(2)}%
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
                <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={data.historical_data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis 
                            dataKey="date" 
                            tick={{ fontSize: 12 }}
                            tickFormatter={(value) => {
                                const date = new Date(value);
                                if (timeframe === '1D') return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                if (timeframe === '5Y') return date.toLocaleDateString([], { year: '2-digit', month: 'short' });
                                return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
                            }}
                        />
                        <YAxis 
                            tick={{ fontSize: 12 }}
                            tickFormatter={(value) => `$${value.toFixed(0)}`}
                        />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                            labelFormatter={(value) => new Date(value).toLocaleString()}
                            formatter={(value) => [`$${value.toFixed(2)}`, 'Price']}
                        />
                        <Line 
                            type="monotone" 
                            dataKey="price" 
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