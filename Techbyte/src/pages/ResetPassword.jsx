import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Link, useLocation, Navigate } from 'react-router-dom';
import { resetPassword as apiResetPassword } from '../services/api';
import '../pages/pages-enhanced.css';


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
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
            await apiResetPassword(token, code, password);
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
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Min. 8 characters"
                                    className="enhanced-input pr-12"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={8}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((value) => !value)}
                                    className="absolute inset-y-0 right-0 flex items-center px-3 text-text-muted hover:text-text-dark"
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-text-dark mb-2">Confirm Password</label>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    placeholder="Re-enter password"
                                    className="enhanced-input pr-12"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword((value) => !value)}
                                    className="absolute inset-y-0 right-0 flex items-center px-3 text-text-muted hover:text-text-dark"
                                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                                >
                                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
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
