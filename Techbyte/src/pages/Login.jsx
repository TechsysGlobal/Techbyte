import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../pages/pages-enhanced.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(email, password, rememberMe);
            navigate('/account');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="container mx-auto px-6">
                <div className="flex items-center gap-2 text-sm text-text-muted mb-8">
                    <Link to="/" className="hover:text-primary transition-colors">Home</Link>
                    <span>/</span>
                    <span>Login</span>
                </div>

                <div className="auth-card">
                    <div className="auth-header">
                        <h1>Welcome Back</h1>
                        <p>Sign in to continue to your account</p>
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
                        <div>
                            <label className="block text-sm font-semibold text-text-dark mb-2">Password</label>
                            <input
                                type="password"
                                placeholder="Enter your password"
                                className="enhanced-input"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <div className="flex justify-between items-center text-sm">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 accent-primary rounded"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                />
                                <span className="text-text-muted">Remember me</span>
                            </label>
                            <Link to="/forgot-password" className="text-primary font-semibold hover:underline">Forgot password?</Link>
                        </div>

                        {error && (
                            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4">
                                {error}
                            </div>
                        )}

                        <button disabled={loading} type="submit" className="btn-gradient w-full mt-6 disabled:opacity-70 disabled:cursor-not-allowed">
                            {loading ? 'Signing In...' : 'Sign In'}
                        </button>

                        <div className="auth-divider">
                            <span>or</span>
                        </div>

                        <p className="text-center text-sm text-text-muted">
                            Don't have an account? <Link to="/register" className="text-primary font-semibold hover:underline">Create account</Link>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;
