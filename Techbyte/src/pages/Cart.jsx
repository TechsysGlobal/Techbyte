import React from 'react';
import { useCart } from '../context/CartContext';
import { Link } from 'react-router-dom';
import { Trash2, ShoppingBag, Loader } from 'lucide-react';
import '../pages/pages-enhanced.css';

const Cart = () => {
    const { cart, updateQuantity, removeFromCart, cartSummary, isValidating } = useCart();

    if (cart.length === 0) {
        return (
            <div className="page-gradient-bg">
                <div className="container mx-auto px-6 py-20">
                    <div className="empty-cart-state">
                        <div className="empty-cart-icon">
                            <ShoppingBag size={60} />
                        </div>
                        <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2 >
                        <p className="text-text-muted mb-6">Looks like you haven't added anything to your cart yet</p>
                        <Link to="/products" className="btn-gradient inline-flex">
                            Start Shopping
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="page-gradient-bg">
            <div className="container mx-auto px-6 py-8">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold">Shopping Cart</h1>
                    <span className="text-text-muted">{cart.length} {cart.length === 1 ? 'item' : 'items'}</span>
                </div>

                <div className="grid lg:grid-cols-3 gap-10">
                    <div className="lg:col-span-2 space-y-4 animate-fade-in-up">
                        {cart.map((item, index) => (
                            <div key={item.id} className="cart-item-card" style={{ animationDelay: `${index * 0.1}s` }}>
                                <div className="flex gap-6">
                                    <div className="w-24 h-24 bg-bg-light rounded-lg p-3 flex items-center justify-center">
                                        <img src={item.image ? `${item.image}?width=200&format=webp&quality=80` : ''} loading="lazy" alt={item.name} className="max-w-full max-h-full object-contain" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <p className="text-xs text-text-muted mb-1 uppercase tracking-wide">{item.brand}</p>
                                                <h3 className="font-semibold">{item.name}</h3>
                                            </div>
                                            <p className="font-bold text-secondary text-lg">€{item.price.toFixed(2)}</p>
                                        </div>

                                        <div className="flex justify-between items-end mt-4">
                                            <div className="flex items-center gap-3 border-2 border-border rounded-lg overflow-hidden">
                                                <button
                                                    onClick={() => updateQuantity(item.id, -1)}
                                                    className="w-10 h-10 hover:bg-primary hover:text-white transition-colors flex items-center justify-center font-semibold"
                                                >
                                                    -
                                                </button>
                                                <span className="text-sm font-semibold w-8 text-center">{item.quantity}</span>
                                                <button
                                                    onClick={() => updateQuantity(item.id, 1)}
                                                    className="w-10 h-10 hover:bg-primary hover:text-white transition-colors flex items-center justify-center font-semibold"
                                                >
                                                    +
                                                </button>
                                            </div>

                                            <button
                                                onClick={() => removeFromCart(item.id)}
                                                className="text-text-muted hover:text-danger p-2 rounded-lg hover:bg-danger/10 transition-all"
                                            >
                                                <Trash2 size={20} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="animate-fade-in-up animate-delay-200">
                        <div className="cart-summary">
                            <h3 className="font-bold text-lg mb-6">Order Summary</h3>

                            <div className="space-y-3 mb-6 pb-6 border-b border-border">
                                <div className="flex justify-between text-sm">
                                    <span className="text-text-muted">Subtotal ({cart.length} items)</span>
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

                            <div className="flex justify-between text-xl font-bold mb-6 pb-6 border-b border-border">
                                <span>Total</span>
                                <span className="text-primary">€{cartSummary?.total?.toFixed(2) || '0.00'}</span>
                            </div>

                            {isValidating ? (
                                <button disabled className="btn-gradient w-full block text-center mb-3 opacity-70 cursor-not-allowed flex items-center justify-center gap-2">
                                    <Loader size={18} className="animate-spin" />
                                    <span>Validating...</span>
                                </button>
                            ) : (
                                <Link to="/checkout" className="btn-gradient w-full block text-center mb-3">
                                    Proceed to Checkout
                                </Link>
                            )}
                            <Link to="/products" className="block w-full text-center bg-white border-2 border-primary text-primary py-4 rounded-xl font-semibold hover:bg-primary/5 transition-colors">
                                Continue Shopping
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Cart;
