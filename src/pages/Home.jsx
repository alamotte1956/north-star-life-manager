import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
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
                title="North Star Life Manager - Organize Your Life's Important Information"
                description="Comprehensive life organization platform for managing documents, properties, vehicles, finances, and family information. AI-powered insights, secure storage, expiration tracking, and family collaboration tools."
                keywords="life management software, document organization, property management, vehicle tracking, financial planning, estate planning, family collaboration, AI assistant, secure document vault, expiration alerts"
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