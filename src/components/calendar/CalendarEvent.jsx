import React from 'react';
import { Calendar, Wrench, Plane, DollarSign, Star } from 'lucide-react';

const eventTypeConfig = {
    maintenance: { icon: Wrench, color: 'bg-orange-100 text-orange-700 border-orange-200' },
    travel: { icon: Plane, color: 'bg-sky-100 text-sky-700 border-sky-200' },
    subscription: { icon: DollarSign, color: 'bg-green-100 text-green-700 border-green-200' },
    custom: { icon: Star, color: 'bg-purple-100 text-purple-700 border-purple-200' },
    important_date: { icon: Calendar, color: 'bg-pink-100 text-pink-700 border-pink-200' }
};

export default function CalendarEvent({ event, onClick }) {
    const config = eventTypeConfig[event.type] || eventTypeConfig.custom;
    const Icon = config.icon;

    return (
        <button
            onClick={onClick}
            className={`w-full text-left px-2 py-1 rounded text-xs mb-1 border ${config.color} hover:opacity-80 transition-opacity truncate`}
        >
            <div className="flex items-center gap-1">
                <Icon className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{event.title}</span>
            </div>
        </button>
    );
}