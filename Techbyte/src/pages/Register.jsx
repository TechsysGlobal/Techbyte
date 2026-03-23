import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Register = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth(); // We can use login context to set user after reg if needed, or just redirect
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await register({
                personalName: name, // Mapping simple form name to personalName
                email,
                password,
                // Default fields for simple registration
                companyName: name + "'s Company",
                status: 'pending' // Backend handles this, but good to be explicit
            });
            // After successful registration, usually redirect to login or show success message
            // detailed in the migration plan: "Registration submitted. You will receive an email..."
            // For now, let's redirect to login with a state message or just login page
            navigate('/login');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="container mx-auto px-6">
                <div className="flex items-center gap-2 text-sm text-text-muted mb-4 md:mb-8">
                    <Link to="/" className="hover:text-primary transition-colors">Home</Link>
                    <span>/</span>
                    <span>Create Account</span>
                </div>

                <div className="auth-card">
                    <div className="auth-header">
                        <h1>Create Account</h1>
                        <p>Start your journey with us today</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-semibold text-text-dark mb-2">Full Name</label>
                            <input
                                type="text"
                                placeholder="Enter your full name"
                                className="enhanced-input"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>
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
                                placeholder="Choose a strong password"
                                className="enhanced-input"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <div className="flex items-start gap-2 text-sm">
                            <input type="checkbox" className="w-4 h-4 mt-1 accent-primary rounded" required />
                            <span className="text-text-muted">
                                I agree to the <a href="#" className="text-primary font-semibold hover:underline">Terms of Service</a> and <a href="#" className="text-primary font-semibold hover:underline">Privacy Policy</a>
                            </span>
                        </div>

                        {error && (
                            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4">
                                {error}
                            </div>
                        )}

                        <button disabled={loading} type="submit" className="btn-gradient w-full mt-6 disabled:opacity-70 disabled:cursor-not-allowed">
                            {loading ? 'Creating Account...' : 'Create Account'}
                        </button>

                        <div className="auth-divider">
                            <span>or</span>
                        </div>

                        <p className="text-center text-sm text-text-muted">
                            Already have an account? <Link to="/login" className="text-primary font-semibold hover:underline">Sign in</Link>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Register;
