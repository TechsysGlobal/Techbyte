import React from 'react';
import { Outlet } from 'react-router-dom';
import TopBar from './TopBar';
import Header from './Header';
import Navigation from './Navigation';
import Footer from './Footer';
import CartDrawer from './cart/CartDrawer';
import CookieBanner from './CookieBanner';

const PageLoader = () => (
    <div className="flex justify-center flex-col items-center min-h-[50vh] space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        <p className="text-sm text-gray-500 font-medium tracking-wide animate-pulse">Loading content...</p>
    </div>
);

const Layout = () => {
    return (
        <div className="flex flex-col min-h-screen font-sans text-text-dark bg-bg-white">
            <div className="sticky top-0 z-50 w-full bg-white flex flex-col shadow-sm">
                <Header />
                <Navigation />
            </div>

            <main className="flex-grow">
                <React.Suspense fallback={<PageLoader />}>
                    <Outlet />
                </React.Suspense>
            </main>

            <Footer />
            <CartDrawer />
            <CookieBanner />
        </div>
    );
};

export default Layout;
