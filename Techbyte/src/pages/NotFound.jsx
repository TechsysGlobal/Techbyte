import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
    return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-6">
            <h1 className="text-8xl font-black text-primary/20 mb-4">404</h1>
            <h2 className="text-2xl font-bold mb-3">Page Not Found</h2>
            <p className="text-text-muted mb-8 max-w-md">
                The page you're looking for doesn't exist or has been moved.
            </p>
            <Link to="/" className="btn-gradient inline-flex items-center gap-2 px-8 py-3 rounded-full">
                Go Home
            </Link>
        </div>
    );
};

export default NotFound;
