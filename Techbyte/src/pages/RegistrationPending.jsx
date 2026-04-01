import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../pages/pages-enhanced.css';

const RegistrationPending = () => {
    const { state } = useLocation();
    const companyName = state?.companyName;
    const email = state?.email;
    const message = state?.message || 'Your registration is pending admin approval.';

    return (
        <div className="auth-page">
            <div className="container mx-auto px-6">
                <div className="auth-card text-center">
                    <div className="auth-header">
                        <h1>Application Received</h1>
                        <p>{message}</p>
                    </div>

                    <div className="text-sm text-text-muted space-y-2">
                        {companyName && <p><strong>Company:</strong> {companyName}</p>}
                        {email && <p><strong>Contact email:</strong> {email}</p>}
                        <p>Once an admin approves the application, we will email a password setup link.</p>
                        <p>After you set your password, you can sign in from the login page.</p>
                    </div>

                    <Link to="/" className="btn-gradient inline-block mt-6">
                        Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default RegistrationPending;
