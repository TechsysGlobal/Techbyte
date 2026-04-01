import { useEffect } from 'react';
import { useCookieConsent } from '../hooks/useCookieConsent';


/**
 * ConsentTracker: A non-rendering component that manages 
 * the conditional loading of 3rd party tracking scripts
 * based on the user's cookie consent preferences.
 */
const ConsentTracker = () => {
  const { consent } = useCookieConsent();

  useEffect(() => {
    if (!consent) return;

    // 1. Marketing Cookies (e.g. Facebook Pixel, LinkedIn Insight)
    if (consent.marketing) {
      console.log('Marketing consent granted: Initializing marketing trackers...');
      // Example: fbq('init', 'YOUR_PIXEL_ID');
    }

    // 2. Analytics Cookies (e.g. Google Analytics, Hotjar)
    if (consent.analytics) {
      console.log('Analytics consent granted: Initializing analytics trackers...');
      // Example: window.gtag('config', 'UA-XXXXX-Y');
    }

  }, [consent]);


  return null; // This component doesn't render anything UI-wise
};

export default ConsentTracker;
