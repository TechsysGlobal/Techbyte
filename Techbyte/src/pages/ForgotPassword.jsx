import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import '../pages/pages-enhanced.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const ForgotPassword = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [showExpired, setShowExpired] = useState(false);
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Detect expired link redirect and show banner
    useEffect(() => {
        if (searchParams.get('expired') === 'true') {
            setShowExpired(true);
            // Clean up the URL so refreshing won't re-show the banner
            searchParams.delete('expired');
            setSearchParams(searchParams, { replace: true });
        }
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
                credentials: 'include',
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Request failed');
            setSubmitted(true);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="auth-page">
                <div className="container mx-auto px-6">
                    <div className="auth-card text-center">
                        <div className="auth-header">
                            <h1>Check Your Email</h1>
                            <p>If an account exists with that email, we've sent a password reset link.</p>
                        </div>
                        <Link to="/login" className="btn-gradient inline-block mt-6">Back to Login</Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-page">
            <div className="container mx-auto px-6">
                <div className="flex items-center gap-2 text-sm text-text-muted mb-8">
                    <Link to="/" className="hover:text-primary transition-colors">Home</Link>
                    <span>/</span>
                    <Link to="/login" className="hover:text-primary transition-colors">Login</Link>
                    <span>/</span>
                    <span>Forgot Password</span>
                </div>

                {showExpired && (
                    <div className="bg-amber-50 border border-amber-300 text-amber-800 px-4 py-3 rounded-lg mb-6 flex items-start justify-between">
                        <div>
                            <p className="font-semibold text-sm">Link Expired</p>
                            <p className="text-sm mt-0.5">Your password reset link has expired. Please request a new one below.</p>
                        </div>
                        <button
                            onClick={() => setShowExpired(false)}
                            className="text-amber-600 hover:text-amber-800 ml-4 text-lg font-bold leading-none"
                            aria-label="Dismiss"
                        >&times;</button>
                    </div>
                )}

                <div className="auth-card">
                    <div className="auth-header">
                        <h1>Forgot Password</h1>
                        <p>Enter your email and we'll send you a reset link</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-semibold text-text-dark mb-2">Email Address</label>
                            <input
                                type="email"
                                placeholder="you@example.com"
                                className="enhanced-input"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        {error && (
                            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        <button disabled={loading} type="submit" className="btn-gradient w-full mt-6 disabled:opacity-70">
                            {loading ? 'Sending...' : 'Send Reset Link'}
                        </button>

                        <p className="text-center text-sm text-text-muted mt-4">
                            Remember your password? <Link to="/login" className="text-primary font-semibold hover:underline">Sign In</Link>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
