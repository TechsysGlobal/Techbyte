import React, { useState } from 'react';
import { Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import '../pages/pages-enhanced.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const SetPassword = () => {
    const { search } = useLocation();
    const navigate = useNavigate();

    // Extract standard query parameter (not Supabase hash)
    const queryParams = new URLSearchParams(search);
    const token = queryParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Redirect immediately if there is no token
    if (!token && !success) {
        return <Navigate to="/login" replace />;
    }

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
            const res = await fetch(`${API_BASE}/auth/set-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password }),
            });
            const data = await res.json();

            if (!res.ok) {
                // Handle Zod validation errors if present
                if (data.fields) {
                    const fieldErrorKeys = Object.keys(data.fields).filter(k => k !== '_errors');
                    if (fieldErrorKeys.length > 0 && data.fields[fieldErrorKeys[0]]._errors) {
                        throw new Error(`Validation Error: ${data.fields[fieldErrorKeys[0]]._errors[0]}`);
                    }
                }
                throw new Error(data.error || 'Failed to set password');
            }

            setSuccess(true);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="auth-page">
                <div className="container mx-auto px-6">
                    <div className="auth-card text-center">
                        <div className="auth-header">
                            <h1>Password Set Successfully!</h1>
                            <p>Your account is now active. You can sign in using your email and new password.</p>
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
                        <h1>Set Your Password</h1>
                        <p>Welcome! Please choose a secure password to activate your account.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-semibold text-text-dark mb-2">New Password</label>
                            <input
                                type="password"
                                placeholder="Min. 8 characters, 1 uppercase, 1 number"
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
                            {loading ? 'Setting Password...' : 'Activate Account'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default SetPassword;
