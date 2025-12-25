import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import SEO from '@/components/SEO';

export default function Home() {
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        // Auto-redirect everyone to Dashboard (sandbox mode)
        navigate(createPageUrl('Dashboard'));
    }, [navigate]);

    return (
        <>
            <SEO 
                title="North Star Life Manager - Your Complete Life Organization Platform"
                description="AI-powered life management platform helping families organize documents, finances, properties, health records, and more. Secure, encrypted, and easy to use."
                keywords="life management software, document organization, financial planning, property management, health records, estate planning, family collaboration, AI assistant, secure document storage"
                structuredData={{
                    "@context": "https://schema.org",
                    "@type": "SoftwareApplication",
                    "name": "North Star Life Manager",
                    "applicationCategory": "ProductivityApplication",
                    "operatingSystem": "Web, iOS, Android",
                    "offers": {
                        "@type": "AggregateOffer",
                        "lowPrice": "49",
                        "highPrice": "199",
                        "priceCurrency": "USD",
                        "offerCount": "3"
                    },
                    "aggregateRating": {
                        "@type": "AggregateRating",
                        "ratingValue": "4.8",
                        "ratingCount": "1247"
                    },
                    "provider": {
                        "@type": "Organization",
                        "name": "A.I. Help Pros LLP",
                        "url": "https://aihelppros.com"
                    }
                }}
            />
        </>
    );
}