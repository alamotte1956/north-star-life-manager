import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { 
            query, 
            category, 
            dateFrom, 
            dateTo, 
            minAmount, 
            maxAmount, 
            uploader,
            expiryStatus 
        } = await req.json();

        // Get all documents
        let documents = await base44.asServiceRole.entities.Document.list('-created_date', 1000);

        // Helper: Calculate Levenshtein distance for fuzzy matching
        const levenshteinDistance = (str1, str2) => {
            const s1 = str1.toLowerCase();
            const s2 = str2.toLowerCase();
            const costs = [];
            for (let i = 0; i <= s1.length; i++) {
                let lastValue = i;
                for (let j = 0; j <= s2.length; j++) {
                    if (i === 0) {
                        costs[j] = j;
                    } else if (j > 0) {
                        let newValue = costs[j - 1];
                        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
                            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
                        }
                        costs[j - 1] = lastValue;
                        lastValue = newValue;
                    }
                }
                if (i > 0) costs[s2.length] = lastValue;
            }
            return costs[s2.length];
        };

        // Helper: Calculate relevance score
        const calculateRelevance = (doc, searchTerms) => {
            let score = 0;
            const titleLower = (doc.title || '').toLowerCase();
            const extractedLower = (doc.extracted_text || '').toLowerCase();
            const summaryLower = (doc.ai_summary || '').toLowerCase();
            const typeLower = (doc.document_type || '').toLowerCase();

            searchTerms.forEach(term => {
                const termLower = term.toLowerCase();
                
                // Exact matches in title (highest weight)
                if (titleLower.includes(termLower)) {
                    score += 100;
                }
                
                // Exact matches in document type
                if (typeLower.includes(termLower)) {
                    score += 80;
                }
                
                // Exact matches in AI summary
                if (summaryLower.includes(termLower)) {
                    score += 60;
                }
                
                // Exact matches in extracted text
                if (extractedLower.includes(termLower)) {
                    score += 40;
                }
                
                // Fuzzy matching for typos (within 2 edits)
                const titleWords = titleLower.split(/\s+/);
                const textWords = extractedLower.split(/\s+/).slice(0, 500); // Limit for performance
                
                titleWords.forEach(word => {
                    const distance = levenshteinDistance(word, termLower);
                    if (distance <= 2 && word.length > 3) {
                        score += Math.max(0, 50 - (distance * 15));
                    }
                });
                
                textWords.forEach(word => {
                    const distance = levenshteinDistance(word, termLower);
                    if (distance <= 2 && word.length > 3) {
                        score += Math.max(0, 20 - (distance * 8));
                    }
                });
            });

            return score;
        };

        // Apply filters
        let filtered = documents;

        if (category) {
            filtered = filtered.filter(doc => doc.category === category);
        }

        if (dateFrom) {
            filtered = filtered.filter(doc => new Date(doc.created_date) >= new Date(dateFrom));
        }

        if (dateTo) {
            filtered = filtered.filter(doc => new Date(doc.created_date) <= new Date(dateTo));
        }

        if (minAmount !== null && minAmount !== undefined) {
            filtered = filtered.filter(doc => doc.amount >= minAmount);
        }

        if (maxAmount !== null && maxAmount !== undefined) {
            filtered = filtered.filter(doc => doc.amount <= maxAmount);
        }

        if (uploader) {
            filtered = filtered.filter(doc => doc.created_by === uploader);
        }

        if (expiryStatus) {
            const now = new Date();
            filtered = filtered.filter(doc => {
                if (!doc.expiry_date) return false;
                const expiryDate = new Date(doc.expiry_date);
                const daysUntil = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));

                if (expiryStatus === 'expired') return daysUntil < 0;
                if (expiryStatus === 'expiring_soon') return daysUntil >= 0 && daysUntil <= 30;
                if (expiryStatus === 'valid') return daysUntil > 30;
                return false;
            });
        }

        // Full-text search with relevance scoring
        const searchTerms = query.trim().split(/\s+/).filter(t => t.length > 0);
        
        const scoredResults = filtered.map(doc => {
            const relevanceScore = calculateRelevance(doc, searchTerms);
            
            // Generate highlight snippet from extracted text
            let snippet = '';
            if (doc.extracted_text && searchTerms.length > 0) {
                const lowerText = doc.extracted_text.toLowerCase();
                const firstTermLower = searchTerms[0].toLowerCase();
                const index = lowerText.indexOf(firstTermLower);
                
                if (index !== -1) {
                    const start = Math.max(0, index - 50);
                    const end = Math.min(doc.extracted_text.length, index + firstTermLower.length + 100);
                    snippet = '...' + doc.extracted_text.substring(start, end) + '...';
                } else {
                    snippet = doc.extracted_text.substring(0, 150) + '...';
                }
            }

            return {
                ...doc,
                relevance_score: relevanceScore,
                snippet
            };
        });

        // Filter by minimum relevance threshold and sort by score
        const results = scoredResults
            .filter(doc => doc.relevance_score > 0)
            .sort((a, b) => b.relevance_score - a.relevance_score)
            .slice(0, 50); // Limit to top 50 results

        return Response.json({
            success: true,
            results,
            total: results.length,
            query
        });

    } catch (error) {
        console.error('Search error:', error);
        return Response.json({ 
            error: error.message,
            success: false 
        }, { status: 500 });
    }
});