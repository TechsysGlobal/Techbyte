import React, { useState } from 'react';
import { Link, useLocation, Navigate } from 'react-router-dom';
import '../pages/pages-enhanced.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const ResetPassword = () => {
    const { hash, search } = useLocation();

    // Supabase appends parameters as a hash fragment (#access_token=...)
    const hashParams = new URLSearchParams(hash.replace('#', '?'));
    const queryParams = new URLSearchParams(search);
    const token = hashParams.get('access_token') || queryParams.get('token');
    const code = queryParams.get('code');
    const authError = hashParams.get('error') || queryParams.get('error');
    const authErrorDesc = hashParams.get('error_description') || queryParams.get('error_description');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, code, password }),
                credentials: 'include',
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Reset failed');
            setSuccess(true);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Redirect immediately if there is no token/code and no error from Supabase
    if (!token && !code && !authError) {
        return <Navigate to="/forgot-password" replace />;
    }

    // Display expired link / error link UI
    if (authError || (!token && !code)) {
        return (
            <div className="auth-page">
                <div className="container mx-auto px-6">
                    <div className="auth-card text-center">
                        <div className="auth-header">
                            <h1>Link Invalid or Expired</h1>
                            <p>{authErrorDesc ? authErrorDesc.replace(/\+/g, ' ') : 'This password reset link is invalid or has expired.'}</p>
                        </div>
                        <Link to="/forgot-password" className="btn-gradient inline-block mt-6">Request New Link</Link>
                    </div>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="auth-page">
                <div className="container mx-auto px-6">
                    <div className="auth-card text-center">
                        <div className="auth-header">
                            <h1>Password Reset!</h1>
                            <p>Your password has been updated. You can now sign in.</p>
                        </div>
                        <Link to="/login" className="btn-gradient inline-block mt-6">Sign In</Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-page">
            <div className="container mx-auto px-6">
                <div className="auth-card">
                    <div className="auth-header">
                        <h1>Reset Password</h1>
                        <p>Enter your new password</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-semibold text-text-dark mb-2">New Password</label>
                            <input
                                type="password"
                                placeholder="Min. 8 characters"
                                className="enhanced-input"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={8}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-text-dark mb-2">Confirm Password</label>
                            <input
                                type="password"
                                placeholder="Re-enter password"
                                className="enhanced-input"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>

                        {error && (
                            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        <button disabled={loading} type="submit" className="btn-gradient w-full mt-6 disabled:opacity-70">
                            {loading ? 'Resetting...' : 'Reset Password'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
