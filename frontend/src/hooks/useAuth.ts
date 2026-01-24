import { useState, useEffect, useCallback } from 'react';

/**
 * Azure SWA Auth user info from /.auth/me
 */
export interface AuthUser {
    identityProvider: string;
    userId: string;
    userDetails: string; // Usually email or username
    userRoles: string[];
    claims?: Array<{ typ: string; val: string }>;
}

interface AuthResponse {
    clientPrincipal: AuthUser | null;
}

interface UseAuthReturn {
    isAuthenticated: boolean;
    authUser: AuthUser | null;
    isLoading: boolean;
    error: string | null;
    logout: () => void;
    checkAuth: () => Promise<void>;
    isLocalDev: boolean;
}

// Check if we're running in local development (Vite dev server)
const isLocalDevelopment = import.meta.env.DEV ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1';

/**
 * Hook to check Azure SWA authentication status via /.auth/me
 * 
 * In local development, returns a mock authenticated user for testing.
 * In production (Azure SWA), checks the real /.auth/me endpoint.
 * 
 * @returns Authentication state and helper functions
 */
export function useAuth(): UseAuthReturn {
    const [authUser, setAuthUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const checkAuth = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        // In local development, use mock auth (bypass SWA)
        if (isLocalDevelopment) {
            // Check localStorage for mock auth state
            const mockAuth = localStorage.getItem('sublet-mock-auth');
            if (mockAuth) {
                setAuthUser(JSON.parse(mockAuth));
            } else {
                setAuthUser(null);
            }
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch('/.auth/me');

            if (!response.ok) {
                throw new Error('Failed to check authentication');
            }

            const data: AuthResponse = await response.json();
            setAuthUser(data.clientPrincipal);

        } catch (err) {
            console.error('Auth check failed:', err);
            setError(err instanceof Error ? err.message : 'Authentication check failed');
            setAuthUser(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    const logout = useCallback(() => {
        if (isLocalDevelopment) {
            // Clear mock auth in local dev
            localStorage.removeItem('sublet-mock-auth');
            setAuthUser(null);
            window.location.href = '/login';
        } else {
            // Redirect to SWA logout endpoint
            window.location.href = '/.auth/logout?post_logout_redirect_uri=/login';
        }
    }, []);

    return {
        isAuthenticated: authUser !== null,
        authUser,
        isLoading,
        error,
        logout,
        checkAuth,
        isLocalDev: isLocalDevelopment,
    };
}
