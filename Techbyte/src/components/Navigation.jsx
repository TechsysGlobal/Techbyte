import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navigation = () => {
    const location = useLocation();

    const navLinks = [
        { path: '/', label: 'Home' },
        { path: '/products', label: 'Products' }
    ];

    const isActive = (path) => {
        if (path === '/') return location.pathname === '/';
        return location.pathname.startsWith(path);
    };

    // Smooth scroll to top when clicking navigation links
    const handleLinkClick = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    return (
        <nav className="z-40 bg-primary">
            <div className="container mx-auto px-6 py-3">
                <ul className="flex list-none gap-1">
                    {navLinks.map((link) => (
                        <li key={link.path}>
                            <Link
                                to={link.path}
                                onClick={handleLinkClick}
                                className={`relative block py-2 px-4 text-sm font-semibold transition-all duration-300 rounded-full ${isActive(link.path)
                                    ? 'text-white bg-white/20'
                                    : 'text-white/80 hover:text-white hover:bg-white/10'
                                    }`}
                            >
                                {link.label}
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>
        </nav>
    );
};

export default Navigation;
