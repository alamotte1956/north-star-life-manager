import { useEffect } from 'react';

export default function SEO({ 
    title = "North Star Life Manager - Complete Life Organization Platform",
    description = "AI-powered life management platform for documents, finances, properties, health records, and family collaboration. Secure, encrypted, and HIPAA-compliant.",
    keywords = "life management, document management, financial planning, property management, health records, estate planning, family collaboration, AI assistant",
    ogImage = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6947dc1f392f53989af97bda/2bced8a31_Gemini_Generated_Image_gyjjqjgyjjqjgyjj.jpg",
    ogType = "website",
    canonical,
    structuredData
}) {
    useEffect(() => {
        // Set document title
        document.title = title;

        // Remove existing meta tags we'll be managing
        const metaTagsToRemove = [
            'description', 'keywords', 'og:title', 'og:description', 'og:image', 
            'og:type', 'og:url', 'twitter:card', 'twitter:title', 'twitter:description',
            'twitter:image', 'robots', 'author', 'viewport'
        ];
        
        metaTagsToRemove.forEach(name => {
            const existing = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
            if (existing) existing.remove();
        });

        // Basic meta tags
        const metaTags = [
            { name: 'description', content: description },
            { name: 'keywords', content: keywords },
            { name: 'author', content: 'A.I. Help Pros LLP' },
            { name: 'robots', content: 'index, follow' },
            { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=5' },
            
            // Open Graph
            { property: 'og:title', content: title },
            { property: 'og:description', content: description },
            { property: 'og:image', content: ogImage },
            { property: 'og:type', content: ogType },
            { property: 'og:url', content: window.location.href },
            { property: 'og:site_name', content: 'North Star Life Manager' },
            
            // Twitter Card
            { name: 'twitter:card', content: 'summary_large_image' },
            { name: 'twitter:title', content: title },
            { name: 'twitter:description', content: description },
            { name: 'twitter:image', content: ogImage },
            
            // Mobile optimization
            { name: 'mobile-web-app-capable', content: 'yes' },
            { name: 'apple-mobile-web-app-capable', content: 'yes' },
            { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
            { name: 'apple-mobile-web-app-title', content: 'North Star' },
            
            // Theme
            { name: 'theme-color', content: '#0F1729' },
            { name: 'msapplication-TileColor', content: '#0F1729' }
        ];

        metaTags.forEach(({ name, property, content }) => {
            const meta = document.createElement('meta');
            if (name) meta.name = name;
            if (property) meta.setAttribute('property', property);
            meta.content = content;
            document.head.appendChild(meta);
        });

        // Canonical URL
        if (canonical) {
            let link = document.querySelector('link[rel="canonical"]');
            if (!link) {
                link = document.createElement('link');
                link.rel = 'canonical';
                document.head.appendChild(link);
            }
            link.href = canonical;
        }

        // Structured Data (JSON-LD)
        if (structuredData) {
            let script = document.querySelector('script[type="application/ld+json"]');
            if (!script) {
                script = document.createElement('script');
                script.type = 'application/ld+json';
                document.head.appendChild(script);
            }
            script.textContent = JSON.stringify(structuredData);
        }

        // Cleanup function
        return () => {
            // Keep meta tags for navigation between pages
        };
    }, [title, description, keywords, ogImage, ogType, canonical, structuredData]);

    return null;
}