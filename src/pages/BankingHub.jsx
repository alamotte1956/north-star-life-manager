import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, RefreshCw, TrendingUp, TrendingDown, Download, DollarSign, CreditCard } from 'lucide-react';
import { toast } from 'sonner';

export default function BankingHub() {
    const [syncing, setSyncing] = useState(null);
    const queryClient = useQueryClient();

    const { data: accounts = [], isLoading } = useQuery({
        queryKey: ['bank-accounts'],
        queryFn: () => base44.entities.BankAccount.list('-last_sync')
    });

    const syncMutation = useMutation({
        mutationFn: (accountId) => base44.functions.invoke('syncBankTransactions', { account_id: accountId, days: 30 }),
        onSuccess: (result, accountId) => {
            queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            toast.success(`Synced ${result.data.imported_count} transactions`);
            setSyncing(null);
        },
        onError: () => {
            toast.error('Sync failed');
            setSyncing(null);
        }
    });

    const handleSync = (accountId) => {
        setSyncing(accountId);
        syncMutation.mutate(accountId);
    };

    const connectPlaid = () => {
        toast.info('Plaid Link integration - requires Plaid Link setup in frontend');
        // In production, initialize Plaid Link here
    };

    const totalBalance = accounts.reduce((sum, acc) => sum + (acc.current_balance || 0), 0);
    const totalAvailable = accounts.reduce((sum, acc) => sum + (acc.available_balance || 0), 0);

    if (isLoading) {
        return <div className="flex items-center justify-center min-h-screen">
            <RefreshCw className="w-8 h-8 animate-spin text-[#D4AF37]" />
        </div>;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F8F7F4] via-white to-[#F8F7F4] p-6">
            <div className="max-w-6xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-4xl font-light text-[#1A2B44] mb-2">Banking Hub</h1>
                    <p className="text-[#1A2B44]/60">Connect and sync your bank accounts automatically</p>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-[#1A2B44]/60">Total Balance</span>
                                <DollarSign className="w-5 h-5 text-green-600" />
                            </div>
                            <div className="text-3xl font-light text-[#1A2B44]">
                                ${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-[#1A2B44]/60">Available</span>
                                <CreditCard className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="text-3xl font-light text-[#1A2B44]">
                                ${totalAvailable.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-[#1A2B44]/60">Connected Accounts</span>
                                <Building2 className="w-5 h-5 text-[#D4AF37]" />
                            </div>
                            <div className="text-3xl font-light text-[#1A2B44]">{accounts.length}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Connect Account */}
                {accounts.length === 0 && (
                    <Card className="mb-8 border-[#D4AF37]/30">
                        <CardContent className="pt-6 text-center py-12">
                            <Building2 className="w-16 h-16 mx-auto mb-4 text-[#D4AF37]" />
                            <h3 className="text-xl font-light text-[#1A2B44] mb-2">Connect Your Bank Account</h3>
                            <p className="text-[#1A2B44]/60 mb-6">
                                Securely link your bank accounts to automatically import transactions
                            </p>
                            <Button onClick={connectPlaid} className="bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-black">
                                <Building2 className="w-5 h-5 mr-2" />
                                Connect with Plaid
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* Accounts List */}
                <div className="space-y-4">
                    {accounts.map((account) => (
                        <Card key={account.id}>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 bg-gradient-to-br from-[#1B4B7F] to-[#0F2847] rounded-lg">
                                            <Building2 className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg">{account.account_name}</CardTitle>
                                            <p className="text-sm text-[#1A2B44]/60">
                                                {account.institution_name} •••• {account.last_four}
                                            </p>
                                        </div>
                                    </div>
                                    <Badge className={
                                        account.status === 'active' ? 'bg-green-100 text-green-700' :
                                        account.status === 'error' ? 'bg-red-100 text-red-700' :
                                        'bg-gray-100 text-gray-700'
                                    }>
                                        {account.status}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                    <div>
                                        <div className="text-sm text-[#1A2B44]/60 mb-1">Current Balance</div>
                                        <div className="text-lg font-light text-[#1A2B44]">
                                            ${(account.current_balance || 0).toLocaleString()}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-[#1A2B44]/60 mb-1">Available</div>
                                        <div className="text-lg font-light text-[#1A2B44]">
                                            ${(account.available_balance || 0).toLocaleString()}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-[#1A2B44]/60 mb-1">Type</div>
                                        <div className="text-lg font-light text-[#1A2B44] capitalize">
                                            {account.account_type.replace('_', ' ')}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-[#1A2B44]/60 mb-1">Last Synced</div>
                                        <div className="text-sm font-light text-[#1A2B44]">
                                            {account.last_sync ? new Date(account.last_sync).toLocaleDateString() : 'Never'}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        onClick={() => handleSync(account.id)}
                                        disabled={syncing === account.id}
                                        className="bg-[#D4AF37] hover:bg-[#C5A059] text-black"
                                    >
                                        {syncing === account.id ? (
                                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                        ) : (
                                            <RefreshCw className="w-4 h-4 mr-2" />
                                        )}
                                        Sync Transactions
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Instructions */}
                <Card className="mt-8 bg-blue-50 border-blue-200">
                    <CardContent className="pt-6">
                        <h3 className="font-medium text-blue-900 mb-3">🔒 Secure Banking Integration</h3>
                        <ul className="space-y-2 text-sm text-blue-800">
                            <li>• Powered by Plaid - bank-level security and encryption</li>
                            <li>• Automatically imports and categorizes transactions</li>
                            <li>• Real-time balance updates across all accounts</li>
                            <li>• Never stores your banking credentials</li>
                        </ul>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}