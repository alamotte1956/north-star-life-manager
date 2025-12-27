import React, { useState } from 'react';
import { Plus, X, Bell, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

const presetReminders = [
    { label: '15 minutes before', value: 15, unit: 'minutes' },
    { label: '30 minutes before', value: 30, unit: 'minutes' },
    { label: '1 hour before', value: 1, unit: 'hours' },
    { label: '2 hours before', value: 2, unit: 'hours' },
    { label: '1 day before', value: 1, unit: 'days' },
    { label: '2 days before', value: 2, unit: 'days' },
    { label: '1 week before', value: 1, unit: 'weeks' }
];

export default function ReminderManager({ reminders = [], onChange }) {
    const [showCustom, setShowCustom] = useState(false);
    const [customValue, setCustomValue] = useState(1);
    const [customUnit, setCustomUnit] = useState('days');

    const handleAddPreset = (preset) => {
        const exists = reminders.some(
            r => r.time_value === preset.value && r.time_unit === preset.unit
        );
        
        if (!exists) {
            onChange([...reminders, {
                time_value: preset.value,
                time_unit: preset.unit,
                triggered: false
            }]);
        }
    };

    const handleAddCustom = () => {
        if (customValue > 0) {
            const exists = reminders.some(
                r => r.time_value === customValue && r.time_unit === customUnit
            );
            
            if (!exists) {
                onChange([...reminders, {
                    time_value: customValue,
                    time_unit: customUnit,
                    triggered: false
                }]);
                setShowCustom(false);
                setCustomValue(1);
                setCustomUnit('days');
            }
        }
    };

    const handleRemove = (index) => {
        onChange(reminders.filter((_, i) => i !== index));
    };

    const formatReminder = (reminder) => {
        const value = reminder.time_value;
        const unit = reminder.time_unit;
        return `${value} ${value === 1 ? unit.slice(0, -1) : unit} before`;
    };

    return (
        <div className="space-y-3">
            <Label className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-[#4A90E2]" />
                Event Reminders
            </Label>

            {/* Current Reminders */}
            {reminders.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {reminders.map((reminder, index) => (
                        <Badge
                            key={index}
                            variant="outline"
                            className="gap-2 pr-1 bg-blue-50 border-blue-200"
                        >
                            <Clock className="w-3 h-3" />
                            <span className="text-xs">{formatReminder(reminder)}</span>
                            <button
                                type="button"
                                onClick={() => handleRemove(index)}
                                className="hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </Badge>
                    ))}
                </div>
            )}

            {/* Preset Reminders */}
            {!showCustom && (
                <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                        {presetReminders.map((preset, index) => (
                            <Button
                                key={index}
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleAddPreset(preset)}
                                className="text-xs"
                            >
                                <Plus className="w-3 h-3 mr-1" />
                                {preset.label}
                            </Button>
                        ))}
                    </div>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowCustom(true)}
                        className="text-xs text-[#4A90E2]"
                    >
                        + Custom reminder
                    </Button>
                </div>
            )}

            {/* Custom Reminder Input */}
            {showCustom && (
                <div className="flex items-end gap-2 p-3 bg-gray-50 rounded-lg border">
                    <div className="flex-1">
                        <Label className="text-xs mb-1">Time</Label>
                        <Input
                            type="number"
                            min="1"
                            value={customValue}
                            onChange={(e) => setCustomValue(parseInt(e.target.value) || 1)}
                            className="h-9"
                        />
                    </div>
                    <div className="flex-1">
                        <Label className="text-xs mb-1">Unit</Label>
                        <Select value={customUnit} onValueChange={setCustomUnit}>
                            <SelectTrigger className="h-9">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="minutes">Minutes</SelectItem>
                                <SelectItem value="hours">Hours</SelectItem>
                                <SelectItem value="days">Days</SelectItem>
                                <SelectItem value="weeks">Weeks</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Button
                        type="button"
                        size="sm"
                        onClick={handleAddCustom}
                        className="h-9"
                    >
                        Add
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowCustom(false)}
                        className="h-9"
                    >
                        Cancel
                    </Button>
                </div>
            )}

            {reminders.length === 0 && !showCustom && (
                <p className="text-xs text-gray-500">No reminders set. Add reminders to get notified before your event.</p>
            )}
        </div>
    );
}