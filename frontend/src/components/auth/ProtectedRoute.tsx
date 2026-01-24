import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuthContext } from './AuthProvider';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requireOnboarding?: boolean;
}

/**
 * Route wrapper that requires authentication.
 * 
 * - If not authenticated → redirect to /login
 * - If authenticated but not onboarded and requireOnboarding is true → redirect to /onboarding
 * - Otherwise → render children
 */
export function ProtectedRoute({ children, requireOnboarding = true }: ProtectedRouteProps) {
    const location = useLocation();
    const {
        isAuthenticated,
        isAuthLoading,
        isAppUserLoading,
        hasCompletedOnboarding
    } = useAuthContext();

    // Show loading while checking auth
    if (isAuthLoading || isAppUserLoading) {
        return (
            <div
                className="min-h-screen flex items-center justify-center"
                style={{ backgroundColor: '#0f1a23' }}
            >
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    // Not authenticated → go to login
    if (!isAuthenticated) {
        return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
    }

    // Authenticated but not onboarded → go to onboarding
    if (requireOnboarding && !hasCompletedOnboarding) {
        return <Navigate to="/onboarding" replace />;
    }

    return <>{children}</>;
}
