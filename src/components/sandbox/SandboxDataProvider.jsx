import React, { createContext, useContext, useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

const SandboxContext = createContext();

export function useSandboxData() {
    const context = useContext(SandboxContext);
    if (!context) {
        throw new Error('useSandboxData must be used within SandboxDataProvider');
    }
    return context;
}

export function SandboxDataProvider({ children }) {
    const [isAuthenticated, setIsAuthenticated] = useState(null);
    const [user, setUser] = useState(null);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const isAuth = await base44.auth.isAuthenticated();
            if (isAuth) {
                const userData = await base44.auth.me();
                setUser(userData);
                setIsAuthenticated(true);
            } else {
                setIsAuthenticated(false);
            }
        } catch {
            setIsAuthenticated(false);
        }
    };

    // Sandbox localStorage key prefix
    const SANDBOX_PREFIX = 'northstar_sandbox_';

    // Sandbox limits for demo users
    const SANDBOX_LIMITS = {
        Document: 2,
        Property: 0,
        BillPayment: 2,
        Investment: 3,
        Vehicle: 1,
        Contact: 5,
        Transaction: 10,
        CalendarEvent: 5,
        default: 5 // Default limit for other entities
    };

    const sandboxData = {
        isAuthenticated,
        user,
        isSandboxMode: !isAuthenticated,

        // Generic CRUD operations that auto-route to localStorage or DB
        async list(entityName, sortBy = '-created_date', limit = 100) {
            if (isAuthenticated) {
                return await base44.entities[entityName].list(sortBy, limit);
            } else {
                // Sandbox mode - use localStorage
                const key = `${SANDBOX_PREFIX}${entityName}`;
                const stored = localStorage.getItem(key);
                return stored ? JSON.parse(stored) : [];
            }
        },

        async filter(entityName, query = {}, sortBy = '-created_date', limit = 100) {
            if (isAuthenticated) {
                return await base44.entities[entityName].filter(query, sortBy, limit);
            } else {
                // Sandbox mode - simple filter on localStorage data
                const key = `${SANDBOX_PREFIX}${entityName}`;
                const stored = localStorage.getItem(key);
                const data = stored ? JSON.parse(stored) : [];
                
                // Simple client-side filtering
                return data.filter(item => {
                    return Object.entries(query).every(([k, v]) => item[k] === v);
                }).slice(0, limit);
            }
        },

        async create(entityName, data) {
            if (isAuthenticated) {
                return await base44.entities[entityName].create(data);
            } else {
                // Sandbox mode - check limits
                const key = `${SANDBOX_PREFIX}${entityName}`;
                const stored = localStorage.getItem(key);
                const existing = stored ? JSON.parse(stored) : [];
                
                const limit = SANDBOX_LIMITS[entityName] || SANDBOX_LIMITS.default;
                
                if (existing.length >= limit) {
                    throw new Error(`Demo limit reached: You can only create ${limit} ${entityName} items. Sign up for unlimited access!`);
                }
                
                const newItem = {
                    ...data,
                    id: `sandbox_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    created_date: new Date().toISOString(),
                    updated_date: new Date().toISOString(),
                    created_by: 'demo_user'
                };
                
                existing.push(newItem);
                localStorage.setItem(key, JSON.stringify(existing));
                return newItem;
            }
        },

        async update(entityName, id, data) {
            if (isAuthenticated) {
                return await base44.entities[entityName].update(id, data);
            } else {
                // Sandbox mode - update in localStorage
                const key = `${SANDBOX_PREFIX}${entityName}`;
                const stored = localStorage.getItem(key);
                const existing = stored ? JSON.parse(stored) : [];
                
                const index = existing.findIndex(item => item.id === id);
                if (index !== -1) {
                    existing[index] = {
                        ...existing[index],
                        ...data,
                        updated_date: new Date().toISOString()
                    };
                    localStorage.setItem(key, JSON.stringify(existing));
                    return existing[index];
                }
                return null;
            }
        },

        async delete(entityName, id) {
            if (isAuthenticated) {
                return await base44.entities[entityName].delete(id);
            } else {
                // Sandbox mode - delete from localStorage
                const key = `${SANDBOX_PREFIX}${entityName}`;
                const stored = localStorage.getItem(key);
                const existing = stored ? JSON.parse(stored) : [];
                
                const filtered = existing.filter(item => item.id !== id);
                localStorage.setItem(key, JSON.stringify(filtered));
                return { success: true };
            }
        },

        // Clear all sandbox data
        clearSandboxData() {
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith(SANDBOX_PREFIX)) {
                    localStorage.removeItem(key);
                }
            });
        },

        // Migrate sandbox data to real account after signup
        async migrateSandboxToReal() {
            if (!isAuthenticated) return;

            const migrations = [];
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith(SANDBOX_PREFIX)) {
                    const entityName = key.replace(SANDBOX_PREFIX, '');
                    const data = JSON.parse(localStorage.getItem(key));
                    
                    // Bulk create in database
                    if (data.length > 0) {
                        migrations.push(
                            base44.entities[entityName].bulkCreate(
                                data.map(item => {
                                    const { id, created_date, updated_date, created_by, ...rest } = item;
                                    return rest;
                                })
                            )
                        );
                    }
                }
            });

            await Promise.all(migrations);
            sandboxData.clearSandboxData();
        }
    };

    if (isAuthenticated === null) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F8F9FA] via-white to-[#E8EEF5]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4A90E2] mx-auto mb-4"></div>
                    <p className="text-[#0F1729]/60">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <SandboxContext.Provider value={sandboxData}>
            {children}
        </SandboxContext.Provider>
    );
}