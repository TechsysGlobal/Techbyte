import React, { createContext, useContext, useState, useEffect } from 'react';
import { validateCart as apiValidateCart } from '../services/api';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState(() => {
        try {
            const stored = localStorage.getItem('techbyte_cart');
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    });
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isValidating, setIsValidating] = useState(false);
    const [cartSummary, setCartSummary] = useState({
        subtotal: 0,
        tax: 0,
        shipping: 0,
        total: 0
    });

    // Persist cart
    useEffect(() => {
        localStorage.setItem('techbyte_cart', JSON.stringify(cart));
    }, [cart]);

    // Validate cart on mount (sync prices/stock)
    useEffect(() => {
        if (cart.length > 0) {
            validateCart();
        }
    }, []);

    const validateCart = async () => {
        if (cart.length === 0) {
            setCartSummary({ subtotal: 0, tax: 0, shipping: 0, total: 0 });
            return;
        }
        setIsValidating(true);
        try {
            const payload = cart.map(item => ({ productId: item.id, quantity: item.quantity }));
            const result = await apiValidateCart(payload);

            if (result.summary) setCartSummary(result.summary);

            setCart(prev => {
                const newCart = [...prev];
                // Update items with latest server data
                if (result.items) {
                    result.items.forEach(validItem => {
                        const idx = newCart.findIndex(i => i.id === validItem.productId);
                        if (idx > -1) {
                            newCart[idx] = {
                                ...newCart[idx],
                                price: validItem.finalPrice, // Apply discounts/updates
                                inStock: validItem.maxQuantity
                            };
                            // Cap quantity at max stock
                            if (newCart[idx].quantity > validItem.maxQuantity) {
                                newCart[idx].quantity = validItem.maxQuantity;
                            }
                        }
                    });
                }
                return newCart;
            });
            console.log('Cart validated:', result);
        } catch (err) {
            console.error('Cart validation error:', err);
        } finally {
            setIsValidating(false);
        }
    };

    const addToCart = (product, quantity = 1) => {
        setCart(prevCart => {
            const existing = prevCart.find(item => item.id === product.id);
            if (existing) {
                const newQty = Math.min(existing.quantity + quantity, product.inStock);
                return prevCart.map(item =>
                    item.id === product.id
                        ? { ...item, quantity: newQty }
                        : item
                );
            }
            return [...prevCart, { ...product, quantity: Math.min(quantity, product.inStock) }];
        });
        setIsDrawerOpen(true);
    };

    const removeFromCart = (productId) => {
        setCart(prevCart => prevCart.filter(item => item.id !== productId));
    };

    const updateQuantity = (productId, change) => {
        setCart(prevCart => prevCart.map(item => {
            if (item.id === productId) {
                const newQty = Math.max(1, item.quantity + change);
                // Cap at stock if known
                if (item.inStock && newQty > item.inStock) return item;
                return { ...item, quantity: newQty };
            }
            return item;
        }));
    };

    const clearCart = () => setCart([]);

    const openDrawer = () => {
        setIsDrawerOpen(true);
        // Sync prices with server every time the drawer opens
        if (cart.length > 0) validateCart();
    };
    const closeDrawer = () => setIsDrawerOpen(false);

    const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartSubtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    return (
        <CartContext.Provider value={{
            cart,
            addToCart,
            removeFromCart,
            updateQuantity,
            clearCart,
            validateCart,
            isDrawerOpen,
            openDrawer,
            closeDrawer,
            cartCount,
            cartSubtotal,
            cartSummary,
            isValidating
        }}>
            {children}
        </CartContext.Provider>
    );
};
