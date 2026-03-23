import React from 'react';
import { Link } from 'react-router-dom';
import { useCookieConsent } from '../hooks/useCookieConsent';

const Footer = () => {
    const { openBanner } = useCookieConsent();
    return (
        <footer className="bg-bg-light pt-16 pb-6 border-t border-border">
            <div className="container mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-10">
                    <div className="lg:col-span-2">
                        <Link to="/" className="inline-block mb-4">
                            <img
                                src="/Techbyte Logo.png"
                                alt="TechByte Logo"
                                className="h-8 w-auto object-contain"
                            />
                        </Link>
                        <p className="text-sm text-text-muted leading-relaxed">
                            You need a reliable partner who helps you find the stock that you are looking for.
                        </p>
                    </div>

                    <div>
                        <h4 className="text-sm font-semibold mb-4 text-text-dark">Information</h4>
                        <ul className="space-y-2">
                            <li><Link to="/about" className="text-sm text-primary hover:underline">About us</Link></li>
                            <li><Link to="/contact" className="text-sm text-primary hover:underline">Contact Us</Link></li>
                            <li><Link to="/terms" className="text-sm text-primary hover:underline">Terms and Condition</Link></li>
                            <li><Link to="/privacy" className="text-sm text-primary hover:underline">Privacy Statement</Link></li>
                            <li><button onClick={openBanner} className="text-sm text-primary hover:underline text-left">Cookie Preferences</button></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-sm font-semibold mb-4 text-text-dark">Timing</h4>
                        <ul className="space-y-2 text-sm text-primary">
                            <li>Monday to Friday (9 am to 5 pm)</li>
                            <li>Saturday and Sunday (Closed)</li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-sm font-semibold mb-4 text-text-dark">Contact</h4>
                        <ul className="space-y-2 text-sm text-text-muted">
                            <li>Phone Number: +385 – 016 13 60</li>
                            <li>Email: info@techbyte.nl</li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-border pt-6 text-center">
                    <p className="text-xs text-text-muted">© Copyright 2026, TechByte, Powered by Techbyte</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
