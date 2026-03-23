import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { createOrder } from '../services/api';
import { Link, useNavigate } from 'react-router-dom';
import { Check, ChevronLeft, CreditCard, Truck, ShoppingBag, Loader, AlertCircle } from 'lucide-react';
import '../pages/pages-enhanced.css';

const Checkout = () => {
    const { cart, cartSummary, clearCart, validateCart } = useCart();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [validationErrors, setValidationErrors] = useState({});
    const [orderPlaced, setOrderPlaced] = useState(false);
    const [orderId, setOrderId] = useState(null);
    const [termsAccepted, setTermsAccepted] = useState(false);

    const [formData, setFormData] = useState({
        email: '',
        firstName: '',
        lastName: '',
        address: '',
        city: '',
        country: 'UAE',
        postalCode: '',
        phone: '',
        cardNumber: '',
        cardExpiry: '',
        cardCvc: '',
    });

    // Pre-fill user data
    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                email: user.email || '',
                firstName: user.personalName || user.name?.split(' ')[0] || '',
                lastName: user.name?.split(' ').slice(1).join(' ') || '',
                address: user.address || '',
                city: user.city || '',
                country: user.country || 'UAE',
                postalCode: user.postalCode || '',
                phone: user.phone || ''
            }));
        }
    }, [user]);

    // Validate cart on enter checkout to ensure pricing is fresh
    useEffect(() => {
        if (cart.length > 0) {
            validateCart();
        }
    }, []);

    if (cart.length === 0 && !orderPlaced) {
        return (
            <div className="page-gradient-bg">
                <div className="container mx-auto px-6 py-20">
                    <div className="empty-cart-state">
                        <div className="empty-cart-icon">
                            <ShoppingBag size={60} />
                        </div>
                        <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
                        <p className="text-text-muted mb-6">Add some products to checkout</p>
                        <Link to="/products" className="btn-gradient inline-flex">
                            Browse Products
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const validateStep = (stepNum) => {
        const errors = {};
        if (stepNum === 1) {
            if (!formData.email?.trim()) errors.email = 'Email is required';
            else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = 'Invalid email format';
            if (!formData.firstName?.trim()) errors.firstName = 'First name is required';
            if (!formData.lastName?.trim()) errors.lastName = 'Last name is required';
            if (!formData.address?.trim()) errors.address = 'Address is required';
            if (!formData.city?.trim()) errors.city = 'City is required';
            if (!formData.phone?.trim()) errors.phone = 'Phone is required';
        } else if (stepNum === 2) {
            if (!formData.cardNumber?.trim()) errors.cardNumber = 'Card number is required';
            else if (formData.cardNumber.replace(/\s/g, '').length < 13) errors.cardNumber = 'Card number must be at least 13 digits';
            if (!formData.cardExpiry?.trim()) errors.cardExpiry = 'Expiry is required';
            if (!formData.cardCvc?.trim()) errors.cardCvc = 'CVC is required';
        }
        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleNextStep = () => {
        if (validateStep(step) && step < 3) setStep(step + 1);
    };

    const handlePrevStep = () => {
        if (step > 1) setStep(step - 1);
    };

    const handlePlaceOrder = async () => {
        setLoading(true);
        setError(null);

        try {
            const orderPayload = {
                items: cart.map(item => ({ productId: item.id, quantity: item.quantity })),
                shippingAddress: {
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    email: formData.email,
                    address: formData.address,
                    city: formData.city,
                    country: formData.country,
                    postalCode: formData.postalCode,
                    phone: formData.phone
                },
                paymentMethod: 'Credit Card', // Mock payment method
                termsAccepted: termsAccepted
            };

            const response = await createOrder(orderPayload);

            setOrderId(response.order.id);
            setOrderPlaced(true);
            if (clearCart) clearCart();
        } catch (err) {
            console.error('Checkout failed:', err);
            setError(err.message || 'Failed to place order. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (orderPlaced) {
        return (
            <div className="page-gradient-bg">
                <div className="container mx-auto px-6 py-20">
                    <div className="max-w-lg mx-auto text-center animate-fade-in-up">
                        <div className="w-24 h-24 bg-gradient-to-br from-primary to-primary-dark rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg animate-pulse">
                            <Check size={48} className="text-white" />
                        </div>
                        <h2 className="text-4xl font-bold mb-4">Order Confirmed!</h2>
                        <p className="text-text-muted text-lg mb-8">Thank you for your order. You will receive a confirmation email shortly.</p>
                        {orderId && <p className="text-sm text-text-muted mb-6">Order ID: #{orderId}</p>}
                        <Link to="/products" className="btn-gradient inline-flex">
                            Continue Shopping
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const steps = [
        { icon: Truck, label: 'Shipping' },
        { icon: CreditCard, label: 'Payment' }
    ];

    return (
        <div className="page-gradient-bg">
            <div className="container mx-auto px-6 py-8">
                <Link to="/cart" className="inline-flex items-center gap-2 text-text-muted hover:text-primary mb-6 transition-colors font-medium">
                    <ChevronLeft size={20} />
                    Back to cart
                </Link>

                <h1 className="text-3xl font-bold mb-8">Checkout</h1>

                {/* Progress Steps */}
                <div className="flex items-center gap-2 mb-10">
                    {steps.map((stepItem, i) => (
                        <React.Fragment key={stepItem.label}>
                            <div className={`flex items-center gap-3 px-5 py-3 rounded-full transition-all duration-300 ${step > i + 1
                                ? 'bg-primary text-white'
                                : step === i + 1
                                    ? 'bg-secondary text-white shadow-lg'
                                    : 'bg-white text-text-muted border border-border'
                                }`}>
                                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white/20">
                                    {step > i + 1 ? <Check size={18} /> : <stepItem.icon size={18} />}
                                </div>
                                <span className="font-semibold text-sm">{stepItem.label}</span>
                            </div>
                            {i < steps.length - 1 && (
                                <div className={`flex-1 h-1 rounded-full transition-colors ${step > i + 1 ? 'bg-primary' : 'bg-border'}`} />
                            )}
                        </React.Fragment>
                    ))}
                </div>

                <div className="grid lg:grid-cols-3 gap-10">
                    {/* Form */}
                    <div className="lg:col-span-2 animate-fade-in-up">
                        {error && (
                            <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 flex items-center gap-3 border border-red-100">
                                <AlertCircle size={20} />
                                {error}
                            </div>
                        )}

                        {step === 1 && (
                            <div className="bg-white rounded-2xl p-8 shadow-sm border border-border/50">
                                <h3 className="font-bold text-xl mb-6 flex items-center gap-3">
                                    <Truck size={24} className="text-primary" />
                                    Shipping Information
                                </h3>
                                {/* Form fields same as before... */}
                                <div className="space-y-5">
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-text-dark mb-2">First Name</label>
                                            <input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} className="enhanced-input" placeholder="John" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-text-dark mb-2">Last Name</label>
                                            <input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} className="enhanced-input" placeholder="Doe" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-text-dark mb-2">Email</label>
                                        <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="enhanced-input" placeholder="john@example.com" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-text-dark mb-2">Address</label>
                                        <input type="text" name="address" value={formData.address} onChange={handleInputChange} className="enhanced-input" placeholder="123 Main Street" />
                                    </div>
                                    <div className="grid md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-text-dark mb-2">City</label>
                                            <input type="text" name="city" value={formData.city} onChange={handleInputChange} className="enhanced-input" placeholder="Dubai" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-text-dark mb-2">Postal Code</label>
                                            <input type="text" name="postalCode" value={formData.postalCode} onChange={handleInputChange} className="enhanced-input" placeholder="00000" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-text-dark mb-2">Country</label>
                                            <select name="country" value={formData.country} onChange={handleInputChange} className="enhanced-input cursor-pointer">
                                                <option value="UAE">United Arab Emirates</option>
                                                <option value="SA">Saudi Arabia</option>
                                                <option value="NL">Netherlands</option>
                                                <option value="DE">Germany</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-text-dark mb-2">Phone</label>
                                        <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className="enhanced-input" placeholder="+971 50 123 4567" />
                                    </div>
                                </div>
                                <button onClick={handleNextStep} className="btn-gradient w-full mt-8">
                                    Continue to Payment
                                </button>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="bg-white rounded-2xl p-8 shadow-sm border border-border/50">
                                <h3 className="font-bold text-xl mb-6 flex items-center gap-3">
                                    <CreditCard size={24} className="text-primary" />
                                    Payment Details
                                </h3>
                                <div className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-semibold text-text-dark mb-2">Card Number</label>
                                        <input type="text" name="cardNumber" placeholder="1234 5678 9012 3456" value={formData.cardNumber} onChange={handleInputChange} className="enhanced-input" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-text-dark mb-2">Expiry Date</label>
                                            <input type="text" name="cardExpiry" placeholder="MM/YY" value={formData.cardExpiry} onChange={handleInputChange} className="enhanced-input" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-text-dark mb-2">CVC</label>
                                            <input type="text" name="cardCvc" placeholder="123" value={formData.cardCvc} onChange={handleInputChange} className="enhanced-input" />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-4 mt-8">
                                    <button onClick={handlePrevStep} className="flex-1 border-2 border-border hover:border-primary hover:bg-primary/5 text-text-dark py-4 rounded-xl font-semibold transition-all">
                                        Back
                                    </button>
                                    <button
                                        onClick={handlePlaceOrder}
                                        disabled={loading || !termsAccepted}
                                        className="flex-1 bg-secondary hover:bg-secondary/90 text-white py-4 rounded-xl font-semibold transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader size={18} className="animate-spin" />
                                                Processing...
                                            </>
                                        ) : 'Place Order'}
                                    </button>
                                </div>
                                <div className="mt-4 flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100 italic text-sm text-text-muted">
                                    <label className="flex items-start gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={termsAccepted}
                                            onChange={(e) => setTermsAccepted(e.target.checked)}
                                            className="mt-1 w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                                        />
                                        <span>
                                            I agree to the <Link to="/terms" target="_blank" className="text-primary hover:underline font-semibold">B2B Terms of Sale</Link> and <Link to="/privacy" target="_blank" className="text-primary hover:underline font-semibold">Return Policy</Link>. I understand this is a B2B transaction and standard consumer cooling-off periods do not apply.
                                        </span>
                                    </label>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Summary */}
                    <div className="animate-fade-in-up animate-delay-200">
                        <div className="cart-summary sticky top-24">
                            <h3 className="font-bold text-lg mb-6">Order Summary</h3>
                            <div className="space-y-4 mb-6 pb-6 border-b border-border max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                                {cart.map(item => (
                                    <div key={item.id} className="flex gap-4 items-center">
                                        <div className="w-16 h-16 bg-bg-light rounded-xl p-2 flex items-center justify-center flex-shrink-0">
                                            <img src={item.image ? `${item.image}?width=100&format=webp&quality=80` : ''} loading="lazy" alt={item.name} className="max-w-full max-h-full object-contain" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold line-clamp-1">{item.name}</p>
                                            <p className="text-xs text-text-muted">Qty: {item.quantity}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-bold">€{(item.price * item.quantity).toFixed(2)}</p>
                                            {item.originalPrice > item.price && (
                                                <p className="text-xs text-text-muted line-through">€{(item.originalPrice * item.quantity).toFixed(2)}</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="space-y-3 mb-6 pb-6 border-b border-border">
                                <div className="flex justify-between text-sm">
                                    <span className="text-text-muted">Subtotal</span>
                                    <span className="font-semibold">€{cartSummary?.subtotal?.toFixed(2) || '0.00'}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-text-muted">Shipping</span>
                                    <span className={`font-medium text-xs ${!cartSummary?.shipping ? 'text-success' : 'text-text-dark'}`}>
                                        {!cartSummary?.shipping ? 'Free' : `€${cartSummary.shipping.toFixed(2)}`}
                                    </span>
                                </div>
                                {cartSummary?.tax > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-text-muted">VAT (5%)</span>
                                        <span className="font-semibold">€{cartSummary.tax.toFixed(2)}</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex justify-between text-xl font-bold">
                                <span>Total</span>
                                <span className="text-primary">€{cartSummary?.total?.toFixed(2) || '0.00'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Checkout;
