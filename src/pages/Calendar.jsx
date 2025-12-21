import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Calendar as CalendarIcon, Plus, Bell } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { format, isBefore, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isToday, isSameDay } from 'date-fns';

const categoryLabels = {
    birthday: 'Birthday',
    anniversary: 'Anniversary',
    tax_deadline: 'Tax Deadline',
    renewal: 'Renewal',
    appointment: 'Appointment',
    event: 'Event',
    holiday: 'Holiday',
    other: 'Other'
};

const categoryColors = {
    birthday: 'bg-pink-100 text-pink-700 border-pink-200',
    anniversary: 'bg-purple-100 text-purple-700 border-purple-200',
    tax_deadline: 'bg-red-100 text-red-700 border-red-200',
    renewal: 'bg-orange-100 text-orange-700 border-orange-200',
    appointment: 'bg-blue-100 text-blue-700 border-blue-200',
    event: 'bg-green-100 text-green-700 border-green-200',
    holiday: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    other: 'bg-gray-100 text-gray-700 border-gray-200'
};

export default function Calendar() {
    const [open, setOpen] = useState(false);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [formData, setFormData] = useState({
        title: '',
        date: '',
        category: 'other',
        recurring: false,
        reminder_days_before: 7,
        person_name: '',
        notes: ''
    });

    const { data: dates = [], refetch } = useQuery({
        queryKey: ['importantDates'],
        queryFn: () => base44.entities.ImportantDate.list('date')
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        await base44.entities.ImportantDate.create(formData);
        setOpen(false);
        setFormData({
            title: '',
            date: '',
            category: 'other',
            recurring: false,
            reminder_days_before: 7,
            person_name: '',
            notes: ''
        });
        refetch();
    };

    const upcomingDates = dates.filter(d => 
        isBefore(new Date(), addDays(new Date(d.date), 1))
    ).slice(0, 10);

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

    const getDatesForDay = (day) => {
        return dates.filter(d => isSameDay(new Date(d.date), day));
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F8F7F4] via-white to-[#F8F7F4]">
            <div className="max-w-7xl mx-auto px-6 py-12">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div className="absolute inset-0 bg-[#C9A95C]/30 rounded-2xl blur-xl" />
                            <div className="relative bg-gradient-to-br from-[#1A2B44] to-[#0F1B2E] p-4 rounded-2xl">
                                <CalendarIcon className="w-8 h-8 text-[#C9A95C]" />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-4xl font-light text-[#1A2B44]">Calendar</h1>
                            <p className="text-[#1A2B44]/60 font-light">Important dates & reminders</p>
                        </div>
                        </div>

                        <div className="flex gap-2 print:hidden">
                        <PrintButton />
                        <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-gradient-to-r from-[#1A2B44] to-[#0F1B2E] hover:shadow-lg text-white">
                                <Plus className="w-4 h-4 mr-2" />
                                Add Date
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>Add Important Date</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>Title</Label>
                                        <Input
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <Label>Category</Label>
                                        <Select
                                            value={formData.category}
                                            onValueChange={(value) => setFormData({ ...formData, category: value })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Object.entries(categoryLabels).map(([key, label]) => (
                                                    <SelectItem key={key} value={key}>{label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>Date</Label>
                                        <Input
                                            type="date"
                                            value={formData.date}
                                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <Label>Person (if applicable)</Label>
                                        <Input
                                            value={formData.person_name}
                                            onChange={(e) => setFormData({ ...formData, person_name: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={formData.recurring}
                                        onChange={(e) => setFormData({ ...formData, recurring: e.target.checked })}
                                        className="rounded"
                                    />
                                    <Label>Recurring annually</Label>
                                </div>

                                <div>
                                    <Label>Remind me (days before)</Label>
                                    <Input
                                        type="number"
                                        value={formData.reminder_days_before}
                                        onChange={(e) => setFormData({ ...formData, reminder_days_before: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <Label>Notes</Label>
                                    <Textarea
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        rows={2}
                                    />
                                </div>

                                <Button type="submit" className="w-full bg-gradient-to-r from-[#C9A95C] to-[#D4AF37]">
                                    Add Date
                                </Button>
                            </form>
                        </DialogContent>
                        </Dialog>
                        </div>
                        </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Upcoming Dates */}
                    <div className="lg:col-span-1">
                        <Card className="shadow-lg">
                            <CardContent className="pt-6">
                                <h2 className="text-xl font-light text-[#1A2B44] mb-4 flex items-center gap-2">
                                    <Bell className="w-5 h-5 text-[#C9A95C]" />
                                    Upcoming
                                </h2>
                                {upcomingDates.length > 0 ? (
                                    <div className="space-y-3">
                                        {upcomingDates.map(date => (
                                            <div key={date.id} className="p-3 bg-[#F8F7F4] rounded-lg">
                                                <div className="flex items-start justify-between mb-1">
                                                    <div className="font-light text-[#1A2B44]">{date.title}</div>
                                                    <Badge className={`${categoryColors[date.category]} border text-xs`}>
                                                        {categoryLabels[date.category]}
                                                    </Badge>
                                                </div>
                                                <div className="text-sm text-[#1A2B44]/60">
                                                    {format(new Date(date.date), 'MMM d, yyyy')}
                                                </div>
                                                {date.person_name && (
                                                    <div className="text-xs text-[#1A2B44]/50 mt-1">
                                                        {date.person_name}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-[#1A2B44]/40 text-sm font-light">No upcoming dates</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Calendar View */}
                    <div className="lg:col-span-2">
                        <Card className="shadow-lg">
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-2xl font-light text-[#1A2B44]">
                                        {format(currentDate, 'MMMM yyyy')}
                                    </h2>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))}
                                        >
                                            ←
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentDate(new Date())}
                                        >
                                            Today
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))}
                                        >
                                            →
                                        </Button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-7 gap-2">
                                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                        <div key={day} className="text-center text-sm font-light text-[#1A2B44]/60 pb-2">
                                            {day}
                                        </div>
                                    ))}
                                    {daysInMonth.map(day => {
                                        const dayDates = getDatesForDay(day);
                                        return (
                                            <div
                                                key={day.toString()}
                                                className={`min-h-24 p-2 border rounded-lg ${
                                                    isToday(day)
                                                        ? 'bg-[#C9A95C]/10 border-[#C9A95C]'
                                                        : 'border-[#1A2B44]/10 hover:bg-[#F8F7F4]'
                                                } transition-colors`}
                                            >
                                                <div className={`text-sm font-light mb-1 ${
                                                    isToday(day) ? 'text-[#C9A95C] font-medium' : 'text-[#1A2B44]'
                                                }`}>
                                                    {format(day, 'd')}
                                                </div>
                                                <div className="space-y-1">
                                                    {dayDates.map(date => (
                                                        <div
                                                            key={date.id}
                                                            className="text-xs bg-[#C9A95C]/20 text-[#1A2B44] px-1 py-0.5 rounded truncate"
                                                            title={date.title}
                                                        >
                                                            {date.title}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}