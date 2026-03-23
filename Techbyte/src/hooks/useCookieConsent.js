import { useState, useEffect } from 'react';

const CONSENT_KEY = 'tb_cookie_consent';

export const useCookieConsent = () => {
    const [consent, setConsent] = useState(() => {
        try {
            const item = window.localStorage.getItem(CONSENT_KEY);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            console.error('Error reading cookie consent', error);
            return null;
        }
    });

    const [showBanner, setShowBanner] = useState(false);

    useEffect(() => {
        // Automatically show banner if no consent state exists
        if (!consent) {
            setShowBanner(true);
        }
    }, [consent]);

    // This updates the local state and localStorage
    const updateConsent = (newConsentState) => {
        try {
            const payload = { ...newConsentState, timestamp: new Date().toISOString() };
            window.localStorage.setItem(CONSENT_KEY, JSON.stringify(payload));
            setConsent(payload);
            setShowBanner(false);
        } catch (error) {
            console.error('Error saving cookie consent', error);
        }
    };

    const acceptAll = () => {
        updateConsent({ essential: true, analytics: true, marketing: true });
    };

    const rejectAll = () => {
        updateConsent({ essential: true, analytics: false, marketing: false });
    };

    const hasConsented = () => {
        return consent !== null;
    };

    const openBanner = () => {
        setShowBanner(true);
    };

    return {
        consent,
        showBanner,
        updateConsent,
        acceptAll,
        rejectAll,
        hasConsented,
        openBanner,
        setShowBanner
    };
};
