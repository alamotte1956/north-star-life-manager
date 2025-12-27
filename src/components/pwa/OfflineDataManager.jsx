import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

// SECURITY: Only store minimal metadata for offline access - NO sensitive data
export default function OfflineDataManager() {
    // Cache ONLY non-sensitive metadata for offline access
    const { data: documents } = useQuery({
        queryKey: ['offline-documents'],
        queryFn: () => base44.entities.Document.list('-created_date', 50),
        staleTime: 1000 * 60 * 5
    });

    const { data: properties } = useQuery({
        queryKey: ['offline-properties'],
        queryFn: () => base44.entities.Property.list(),
        staleTime: 1000 * 60 * 5
    });

    const { data: bills } = useQuery({
        queryKey: ['offline-bills'],
        queryFn: () => base44.entities.BillPayment.list('-due_date', 20),
        staleTime: 1000 * 60 * 5
    });

    // Store ONLY minimal metadata (IDs, titles, dates) - strip sensitive data
    useEffect(() => {
        if (documents) {
            const metadata = documents.map(d => ({
                id: d.id,
                title: d.title,
                document_type: d.document_type,
                expiry_date: d.expiry_date,
                created_date: d.created_date
                // NO: file_url, extracted_text, extracted_data, ai_summary
            }));
            localStorage.setItem('offline-documents', JSON.stringify(metadata));
        }
    }, [documents]);

    useEffect(() => {
        if (properties) {
            const metadata = properties.map(p => ({
                id: p.id,
                name: p.name,
                address: p.address,
                property_type: p.property_type
                // NO: financial data, tenant info, detailed records
            }));
            localStorage.setItem('offline-properties', JSON.stringify(metadata));
        }
    }, [properties]);

    useEffect(() => {
        if (bills) {
            const metadata = bills.map(b => ({
                id: b.id,
                bill_name: b.bill_name,
                due_date: b.due_date,
                status: b.status
                // NO: amounts, account numbers, payment methods
            }));
            localStorage.setItem('offline-bills', JSON.stringify(metadata));
        }
    }, [bills]);

    // Clear offline data on logout/unmount
    useEffect(() => {
        return () => {
            clearOfflineData();
        };
    }, []);

    return null;
}

// Helper to retrieve offline data
export function getOfflineData(key) {
    const data = localStorage.getItem(`offline-${key}`);
    return data ? JSON.parse(data) : null;
}

// Clear all offline data (call on logout)
export function clearOfflineData() {
    localStorage.removeItem('offline-documents');
    localStorage.removeItem('offline-properties');
    localStorage.removeItem('offline-bills');
}

// Check if offline
export function isOffline() {
    return !navigator.onLine;
}