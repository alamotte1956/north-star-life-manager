import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, AlertCircle, Info, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

export default function AnomalyReport({ anomalyData }) {
    const { anomalies, summary, transactions_analyzed, timeframe_days } = anomalyData;

    const getAnomalyIcon = (type) => {
        const icons = {
            fraud_risk: AlertTriangle,
            duplicate: AlertCircle,
            data_error: Info,
            unusual_amount: TrendingUp,
            suspicious_pattern: AlertTriangle,
            category_mismatch: Info,
            outlier: TrendingUp
        };
        return icons[type] || AlertCircle;
    };

    const getSeverityColor = (severity) => {
        const colors = {
            critical: 'bg-red-100 text-red-700 border-red-300',
            high: 'bg-orange-100 text-orange-700 border-orange-300',
            medium: 'bg-yellow-100 text-yellow-700 border-yellow-300',
            low: 'bg-blue-100 text-blue-700 border-blue-300'
        };
        return colors[severity] || colors.medium;
    };

    const getTypeLabel = (type) => {
        return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    if (!anomalies || anomalies.length === 0) {
        return (
            <Card>
                <CardContent className="py-12 text-center">
                    <div className="text-green-600 mb-4">
                        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Anomalies Detected</h3>
                    <p className="text-sm text-gray-600">
                        Analyzed {transactions_analyzed} transactions from the last {timeframe_days} days. 
                        Everything looks good!
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Summary Card */}
            <Card className="border-l-4 border-orange-500">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-orange-600" />
                        Anomaly Detection Summary
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-[#1A2B44]">{summary.total_anomalies}</div>
                            <div className="text-xs text-gray-600">Total Anomalies</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-red-600">{summary.critical_count}</div>
                            <div className="text-xs text-gray-600">Critical</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-orange-600">{summary.potential_fraud_count}</div>
                            <div className="text-xs text-gray-600">Fraud Risk</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">{summary.potential_errors_count}</div>
                            <div className="text-xs text-gray-600">Data Errors</div>
                        </div>
                    </div>

                    {summary.estimated_financial_impact > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <div className="text-sm font-medium text-red-900">Estimated Financial Impact</div>
                            <div className="text-xl font-bold text-red-700">
                                ${summary.estimated_financial_impact.toLocaleString()}
                            </div>
                        </div>
                    )}

                    <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Key Recommendations</h4>
                        <ul className="space-y-1">
                            {summary.recommendations.map((rec, idx) => (
                                <li key={idx} className="text-xs text-gray-600 flex items-start gap-2">
                                    <span className="text-blue-600 font-bold">→</span>
                                    {rec}
                                </li>
                            ))}
                        </ul>
                    </div>
                </CardContent>
            </Card>

            {/* Anomalies List */}
            <Card>
                <CardHeader>
                    <CardTitle>Detected Anomalies</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {anomalies.map((anomaly, idx) => {
                            const Icon = getAnomalyIcon(anomaly.anomaly_type);
                            
                            return (
                                <div key={idx} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-start gap-3">
                                            <Icon className={`w-5 h-5 mt-1 ${
                                                anomaly.severity === 'critical' ? 'text-red-600' :
                                                anomaly.severity === 'high' ? 'text-orange-600' :
                                                'text-yellow-600'
                                            }`} />
                                            <div>
                                                <div className="font-medium text-[#1A2B44]">
                                                    {anomaly.transaction_description || anomaly.merchant}
                                                </div>
                                                <div className="text-sm text-gray-600">
                                                    {anomaly.merchant} • {format(new Date(anomaly.date), 'MMM d, yyyy')}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-lg font-bold text-[#1A2B44]">
                                                ${Math.abs(anomaly.amount).toLocaleString()}
                                            </div>
                                            <Badge className={`${getSeverityColor(anomaly.severity)} border mt-1`}>
                                                {anomaly.severity}
                                            </Badge>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="text-xs">
                                                {getTypeLabel(anomaly.anomaly_type)}
                                            </Badge>
                                            <Badge className="bg-gray-100 text-gray-700 text-xs">
                                                {anomaly.confidence_score}% confidence
                                            </Badge>
                                        </div>

                                        <div className="bg-gray-50 rounded-lg p-3">
                                            <div className="text-xs font-medium text-gray-700 mb-1">Analysis</div>
                                            <p className="text-sm text-gray-700">{anomaly.explanation}</p>
                                        </div>

                                        {anomaly.expected_value && (
                                            <div className="flex items-center gap-2 text-xs text-gray-600">
                                                <span>Expected: ${anomaly.expected_value.toLocaleString()}</span>
                                                <span>•</span>
                                                <span className="text-orange-700">{anomaly.deviation_from_norm}</span>
                                            </div>
                                        )}

                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                            <div className="text-xs font-medium text-blue-900 mb-1">
                                                Recommended Action
                                            </div>
                                            <p className="text-sm text-blue-800">{anomaly.recommended_action}</p>
                                        </div>

                                        {anomaly.related_transaction_ids?.length > 0 && (
                                            <div className="text-xs text-gray-600">
                                                <span className="font-medium">Related Transactions: </span>
                                                {anomaly.related_transaction_ids.length} found
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}