import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

// Cache critical data for offline access
export default function OfflineDataManager() {
    // Cache documents for offline viewing
    const { data: documents } = useQuery({
        queryKey: ['offline-documents'],
        queryFn: () => base44.entities.Document.list('-created_date', 50),
        staleTime: 1000 * 60 * 30, // 30 minutes
        cacheTime: 1000 * 60 * 60 * 24 // 24 hours
    });

    // Cache financial summary
    const { data: investments } = useQuery({
        queryKey: ['offline-investments'],
        queryFn: () => base44.entities.Investment.list(),
        staleTime: 1000 * 60 * 30,
        cacheTime: 1000 * 60 * 60 * 24
    });

    // Cache properties
    const { data: properties } = useQuery({
        queryKey: ['offline-properties'],
        queryFn: () => base44.entities.Property.list(),
        staleTime: 1000 * 60 * 30,
        cacheTime: 1000 * 60 * 60 * 24
    });

    // Cache emergency info
    const { data: emergencyContacts } = useQuery({
        queryKey: ['offline-emergency'],
        queryFn: () => base44.entities.EmergencyInfo.list(),
        staleTime: 1000 * 60 * 60, // 1 hour
        cacheTime: 1000 * 60 * 60 * 24 * 7 // 7 days
    });

    // Cache bills
    const { data: bills } = useQuery({
        queryKey: ['offline-bills'],
        queryFn: () => base44.entities.BillPayment.filter({ status: 'active' }),
        staleTime: 1000 * 60 * 30,
        cacheTime: 1000 * 60 * 60 * 24
    });

    useEffect(() => {
        // Store critical data in localStorage for offline access
        if (documents) {
            localStorage.setItem('offline-documents', JSON.stringify(documents.slice(0, 20)));
        }
        if (investments) {
            localStorage.setItem('offline-investments', JSON.stringify(investments));
        }
        if (properties) {
            localStorage.setItem('offline-properties', JSON.stringify(properties));
        }
        if (emergencyContacts) {
            localStorage.setItem('offline-emergency', JSON.stringify(emergencyContacts));
        }
        if (bills) {
            localStorage.setItem('offline-bills', JSON.stringify(bills));
        }
    }, [documents, investments, properties, emergencyContacts, bills]);

    return null; // This component doesn't render anything
}

// Helper functions to retrieve offline data
export const getOfflineData = (key) => {
    try {
        const data = localStorage.getItem(`offline-${key}`);
        return data ? JSON.parse(data) : null;
    } catch {
        return null;
    }
};

export const isOffline = () => !navigator.onLine;