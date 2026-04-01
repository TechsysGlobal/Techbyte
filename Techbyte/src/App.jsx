import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/react-query'
import { CartProvider } from './context/CartContext'
import { AuthProvider } from './context/AuthContext'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import ScrollToTop from './components/ScrollToTop'
import React, { lazy } from 'react'

// Lazy-loaded pages (code splitting)
const Home = lazy(() => import('./pages/Home'))
const Products = lazy(() => import('./pages/Products'))
const ProductDetail = lazy(() => import('./pages/ProductDetail'))
const Cart = lazy(() => import('./pages/Cart'))
const Checkout = lazy(() => import('./pages/Checkout'))
const Login = lazy(() => import('./pages/Login'))
const Signup = lazy(() => import('./pages/Signup'))
const Account = lazy(() => import('./pages/Account'))
const Contact = lazy(() => import('./pages/Contact'))
const About = lazy(() => import('./pages/About'))
const Privacy = lazy(() => import('./pages/Privacy'))
const Terms = lazy(() => import('./pages/Terms'))
const NotFound = lazy(() => import('./pages/NotFound'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'))
const ResetPassword = lazy(() => import('./pages/ResetPassword'))
const SetPassword = lazy(() => import('./pages/SetPassword'))
const RegistrationPending = lazy(() => import('./pages/RegistrationPending'))

// Global listener: intercept Supabase recovery payloads on any page and redirect appropriately
const AuthRedirectHandler = () => {
  const { hash, pathname, search } = useLocation()
  const hashParams = new URLSearchParams(hash.replace('#', '?'))
  const searchParams = new URLSearchParams(search)
  const errorCode = hashParams.get('error_code') || searchParams.get('error_code')
  const authError = hashParams.get('error') || searchParams.get('error')
  const type = hashParams.get('type') || searchParams.get('type')
  const hasRecoveryPayload =
    hashParams.has('access_token') ||
    Boolean(searchParams.get('code')) ||
    type === 'recovery'

  if (errorCode === 'otp_expired' || authError === 'access_denied') {
    return <Navigate to="/forgot-password?expired=true" replace />
  }

  if (hasRecoveryPayload && pathname !== '/reset-password') {
    return <Navigate to={`/reset-password${search}${hash}`} replace />
  }

  return null
}

import ConsentTracker from './components/ConsentTracker'

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <BrowserRouter>
            <ScrollToTop />
            <ConsentTracker />
            <AuthRedirectHandler />
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<Home />} />
                <Route path="products" element={<Products />} />
                <Route path="products/:handle" element={<ProductDetail />} />
                <Route path="cart" element={<Cart />} />
                <Route path="checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
                <Route path="login" element={<Login />} />
                <Route path="register" element={<Signup />} />
                <Route path="registration-pending" element={<RegistrationPending />} />
                <Route path="forgot-password" element={<ForgotPassword />} />
                <Route path="reset-password" element={<ResetPassword />} />
                <Route path="set-password" element={<SetPassword />} />
                <Route path="account" element={<ProtectedRoute><Account /></ProtectedRoute>} />
                <Route path="contact" element={<Contact />} />
                <Route path="about" element={<About />} />
                <Route path="privacy" element={<Privacy />} />
                <Route path="terms" element={<Terms />} />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
