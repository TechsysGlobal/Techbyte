import React, { useState } from 'react';
import { useCookieConsent } from '../hooks/useCookieConsent';

const CookieBanner = () => {
    const { showBanner, acceptAll, rejectAll, updateConsent } = useCookieConsent();
    const [showCustomize, setShowCustomize] = useState(false);
    const [preferences, setPreferences] = useState({
        analytics: false,
        marketing: false
    });

    if (!showBanner) return null;

    const handleSavePreferences = () => {
        updateConsent({ essential: true, ...preferences });
        setShowCustomize(false);
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[9999] bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] font-sans text-gray-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {!showCustomize ? (
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex-1">
                            <h3 className="font-semibold text-lg mb-2 text-gray-900 border-none outline-none">Cookie Preferences</h3>
                            <p className="text-sm text-gray-600 border-none outline-none">
                                We use cookies and similar technologies to ensure our website works properly, analyze traffic, and personalize your experience. Essential cookies are required for the site to function and cannot be disabled.
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                            <button
                                onClick={() => setShowCustomize(true)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors flex-1 md:flex-none"
                            >
                                Customize
                            </button>
                            <button
                                onClick={rejectAll}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors flex-1 md:flex-none shadow-sm"
                            >
                                Reject Non-Essential
                            </button>
                            <button
                                onClick={acceptAll}
                                className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-opacity-90 transition-colors flex-1 md:flex-none shadow-sm"
                            >
                                Accept All
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-6">
                        <div>
                            <h3 className="font-semibold text-lg mb-2 text-gray-900">Customize Cookies</h3>
                            <p className="text-sm text-gray-600">Choose which cookies you want to allow.</p>
                        </div>

                        <div className="space-y-4 max-w-3xl">
                            {/* Essential */}
                            <div className="flex items-start justify-between py-3 border-b border-gray-100">
                                <div className="pr-4">
                                    <p className="font-medium text-gray-900 text-sm">Strictly Necessary Cookies</p>
                                    <p className="text-sm text-gray-500 mt-1">Required for the website to function securely and allow session management.</p>
                                </div>
                                <div className="text-sm font-medium text-gray-400 bg-gray-100 px-3 py-1 rounded">Always Active</div>
                            </div>

                            {/* Analytics */}
                            <div className="flex items-start justify-between py-3 border-b border-gray-100">
                                <div className="pr-4">
                                    <p className="font-medium text-gray-900 text-sm">Analytics Cookies</p>
                                    <p className="text-sm text-gray-500 mt-1">Help us understand how visitors interact with our website to improve performance.</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer mt-1 shrink-0">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={preferences.analytics}
                                        onChange={(e) => setPreferences(prev => ({ ...prev, analytics: e.target.checked }))}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                </label>
                            </div>

                            {/* Marketing */}
                            <div className="flex items-start justify-between py-3">
                                <div className="pr-4">
                                    <p className="font-medium text-gray-900 text-sm">Marketing Cookies</p>
                                    <p className="text-sm text-gray-500 mt-1">Used to track visitors across websites to display relevant advertisements.</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer mt-1 shrink-0">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={preferences.marketing}
                                        onChange={(e) => setPreferences(prev => ({ ...prev, marketing: e.target.checked }))}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                </label>
                            </div>
                        </div>

                        <div className="flex gap-3 justify-end mt-2">
                            <button
                                onClick={() => setShowCustomize(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                            >
                                Back
                            </button>
                            <button
                                onClick={handleSavePreferences}
                                className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-opacity-90 transition-colors shadow-sm"
                            >
                                Save My Preferences
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CookieBanner;
