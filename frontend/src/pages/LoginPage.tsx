import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Loader2 } from 'lucide-react';

// Microsoft and GitHub brand colors
const MICROSOFT_BLUE = '#0078D4';
const GITHUB_BLACK = '#24292e';

// Check if we're running in local development
const isLocalDev = import.meta.env.DEV ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1';

export function LoginPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { isAuthenticated, isLoading } = useAuth();

    // Redirect if already authenticated (only on initial load, not on every render)
    useEffect(() => {
        if (!isLoading && isAuthenticated) {
            // Get redirect destination from query params or default to home
            const params = new URLSearchParams(location.search);
            const redirectTo = params.get('redirect') || '/';
            navigate(redirectTo, { replace: true });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated, isLoading]); // Intentionally exclude navigate and location to prevent loops

    const handleMicrosoftLogin = () => {
        if (isLocalDev) {
            // In local dev, set mock auth and use full page reload to avoid react-router loops
            const mockUser = {
                identityProvider: 'aad',
                userId: 'mock-microsoft-user-' + Date.now(),
                userDetails: 'dev@example.com',
                userRoles: ['authenticated'],
            };
            localStorage.setItem('sublet-mock-auth', JSON.stringify(mockUser));
            window.location.href = '/';  // Full page reload
        } else {
            const currentPath = location.pathname + location.search;
            const redirectUri = currentPath !== '/login' ? currentPath : '/';
            window.location.href = `/.auth/login/aad?post_login_redirect_uri=${encodeURIComponent(redirectUri)}`;
        }
    };

    const handleGitHubLogin = () => {
        if (isLocalDev) {
            // In local dev, set mock auth and use full page reload to avoid react-router loops
            const mockUser = {
                identityProvider: 'github',
                userId: 'mock-github-user-' + Date.now(),
                userDetails: 'devuser',
                userRoles: ['authenticated'],
            };
            localStorage.setItem('sublet-mock-auth', JSON.stringify(mockUser));
            window.location.href = '/';  // Full page reload
        } else {
            const currentPath = location.pathname + location.search;
            const redirectUri = currentPath !== '/login' ? currentPath : '/';
            window.location.href = `/.auth/login/github?post_login_redirect_uri=${encodeURIComponent(redirectUri)}`;
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0f1a23' }}>
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div
            className="min-h-screen flex flex-col items-center justify-center px-6"
            style={{ backgroundColor: '#0f1a23' }}
        >
            {/* Logo / Branding */}
            <div className="text-center mb-12">
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <svg
                        viewBox="0 0 24 24"
                        className="w-10 h-10 text-white"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                        <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">SubletConnect</h1>
                <p className="text-slate-400">Find your perfect sublet match</p>
                {isLocalDev && (
                    <p className="text-amber-400 text-xs mt-2">🔧 Local Dev Mode - Using Mock Auth</p>
                )}
            </div>

            {/* Sign In Buttons */}
            <div className="w-full max-w-sm space-y-4">
                {/* Microsoft Sign In */}
                <button
                    onClick={handleMicrosoftLogin}
                    className="w-full h-14 rounded-xl font-semibold text-white flex items-center justify-center gap-3 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-lg"
                    style={{
                        backgroundColor: MICROSOFT_BLUE,
                        boxShadow: `0 4px 20px ${MICROSOFT_BLUE}40`
                    }}
                >
                    {/* Microsoft Logo */}
                    <svg width="21" height="21" viewBox="0 0 21 21" fill="none">
                        <rect width="10" height="10" fill="#f25022" />
                        <rect x="11" width="10" height="10" fill="#7fba00" />
                        <rect y="11" width="10" height="10" fill="#00a4ef" />
                        <rect x="11" y="11" width="10" height="10" fill="#ffb900" />
                    </svg>
                    <span>Continue with Microsoft</span>
                </button>

                {/* GitHub Sign In */}
                <button
                    onClick={handleGitHubLogin}
                    className="w-full h-14 rounded-xl font-semibold text-white flex items-center justify-center gap-3 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-lg"
                    style={{
                        backgroundColor: GITHUB_BLACK,
                        boxShadow: `0 4px 20px ${GITHUB_BLACK}60`
                    }}
                >
                    {/* GitHub Logo */}
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                    </svg>
                    <span>Continue with GitHub</span>
                </button>
            </div>

            {/* Footer */}
            <div className="mt-12 text-center">
                <p className="text-slate-500 text-sm">
                    By signing in, you agree to our Terms of Service
                </p>
            </div>
        </div>
    );
}

