import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useAuth, type AuthUser } from '../../hooks/useAuth';
import { useStore } from '../../stores/useStore';
import { type ApiUser } from '../../lib/api';

interface AuthContextType {
    // Azure SWA auth state
    isAuthenticated: boolean;
    authUser: AuthUser | null;
    isAuthLoading: boolean;

    // App user state (from our database)
    appUser: ApiUser | null;
    isAppUserLoading: boolean;
    hasCompletedOnboarding: boolean;

    // Actions
    logout: () => void;
    refreshAppUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuthContext() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuthContext must be used within an AuthProvider');
    }
    return context;
}

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const { isAuthenticated, authUser, isLoading: isAuthLoading, logout } = useAuth();
    const { user: storedUser, setUser, isOnboarded, setIsOnboarded } = useStore();

    const [appUser, setAppUser] = useState<ApiUser | null>(storedUser);
    const [isAppUserLoading, setIsAppUserLoading] = useState(false);

    // Sync stored user to local state
    useEffect(() => {
        setAppUser(storedUser);
    }, [storedUser]);

    // When authenticated, try to load user from backend
    const refreshAppUser = async () => {
        if (!isAuthenticated || !authUser) {
            return;
        }

        setIsAppUserLoading(true);

        try {
            // Try to fetch user by their identity ID
            // The identityId is stored as the user's ID when they complete onboarding
            const response = await fetch(`/api/users/identity/${encodeURIComponent(authUser.userId)}`);

            if (response.ok) {
                const userData: ApiUser = await response.json();
                setAppUser(userData);
                setUser(userData);
                setIsOnboarded(true);
            } else if (response.status === 404) {
                // User not found - they need to complete onboarding
                setAppUser(null);
                setIsOnboarded(false);
            }
        } catch (err) {
            console.error('Failed to fetch app user:', err);
        } finally {
            setIsAppUserLoading(false);
        }
    };

    // Load user when auth state changes
    useEffect(() => {
        if (isAuthenticated && authUser && !isOnboarded) {
            refreshAppUser();
        }
    }, [isAuthenticated, authUser]);

    const value: AuthContextType = {
        isAuthenticated,
        authUser,
        isAuthLoading,
        appUser,
        isAppUserLoading,
        hasCompletedOnboarding: isOnboarded,
        logout,
        refreshAppUser,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}
