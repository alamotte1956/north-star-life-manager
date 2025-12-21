import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pill, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function MedicationTracker({ medications, onUpdate }) {
    const [logging, setLogging] = useState(null);

    const activeMeds = medications.filter(m => m.active);

    const logMedication = async (medId, taken) => {
        setLogging(medId);
        try {
            await base44.functions.invoke('logMedication', {
                medication_id: medId,
                taken
            });
            toast.success(taken ? 'Marked as taken' : 'Marked as missed');
            onUpdate();
        } catch (error) {
            toast.error('Failed to log medication');
        }
        setLogging(null);
    };

    const getAdherenceRate = (med) => {
        const log = med.adherence_log || [];
        const last7Days = log.slice(-7);
        if (last7Days.length === 0) return 100;
        return (last7Days.filter(l => l.taken).length / last7Days.length) * 100;
    };

    const getAdherenceColor = (rate) => {
        if (rate >= 80) return 'bg-green-100 text-green-700 border-green-300';
        if (rate >= 60) return 'bg-yellow-100 text-yellow-700 border-yellow-300';
        return 'bg-red-100 text-red-700 border-red-300';
    };

    if (activeMeds.length === 0) {
        return (
            <Card>
                <CardContent className="pt-6 text-center py-12">
                    <Pill className="w-12 h-12 text-black/20 mx-auto mb-4" />
                    <p className="text-black/40">No active medications</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {activeMeds.map(med => {
                const adherenceRate = getAdherenceRate(med);
                const lastTaken = med.last_taken ? new Date(med.last_taken) : null;
                const hoursSinceLastTaken = lastTaken ? (new Date() - lastTaken) / (1000 * 60 * 60) : null;
                const isDue = !lastTaken || hoursSinceLastTaken > 12;

                return (
                    <Card key={med.id} className={isDue ? 'border-yellow-300' : ''}>
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="bg-[#D4AF37]/10 p-2 rounded-lg">
                                        <Pill className="w-5 h-5 text-[#D4AF37]" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-base font-light">{med.name}</CardTitle>
                                        <p className="text-sm text-black/60">{med.dosage} · {med.frequency.replace(/_/g, ' ')}</p>
                                        {med.purpose && (
                                            <p className="text-xs text-black/50 mt-1">For: {med.purpose}</p>
                                        )}
                                    </div>
                                </div>
                                <Badge className={`${getAdherenceColor(adherenceRate)} border`}>
                                    {adherenceRate.toFixed(0)}% adherence
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-black/60">
                                    {lastTaken ? (
                                        <>Last taken: {lastTaken.toLocaleString()}</>
                                    ) : (
                                        <>Not taken yet today</>
                                    )}
                                    {med.quantity_remaining && (
                                        <span className="ml-3">
                                            {med.quantity_remaining <= 7 && (
                                                <span className="text-yellow-600 flex items-center gap-1">
                                                    <AlertCircle className="w-3 h-3" />
                                                    {med.quantity_remaining} left
                                                </span>
                                            )}
                                        </span>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        onClick={() => logMedication(med.id, true)}
                                        disabled={logging === med.id}
                                        className="bg-green-600 hover:bg-green-700"
                                    >
                                        <CheckCircle className="w-4 h-4 mr-1" />
                                        Taken
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => logMedication(med.id, false)}
                                        disabled={logging === med.id}
                                    >
                                        <XCircle className="w-4 h-4 mr-1" />
                                        Missed
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}