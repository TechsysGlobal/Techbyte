import React from 'react';
import { X, Trash2 } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { Link } from 'react-router-dom';

const CartDrawer = () => {
    const {
        cart,
        isDrawerOpen,
        closeDrawer,
        updateQuantity,
        removeFromCart,
        cartSubtotal
    } = useCart();

    return (
        <>
            {/* Overlay */}
            <div
                className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${isDrawerOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
                    }`}
                onClick={closeDrawer}
            />

            {/* Drawer */}
            <div className={`fixed top-0 right-0 w-full max-w-[420px] h-full bg-white shadow-2xl z-50 transition-transform duration-300 ease-in-out transform ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'
                }`}>
                <div className="flex flex-col h-full">
                    <div className="flex justify-between items-center p-6 border-b border-border">
                        <h3 className="text-lg font-medium">Shopping cart</h3>
                        <button onClick={closeDrawer} className="p-1 hover:text-primary transition-colors">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6">
                        {cart.length === 0 ? (
                            <p className="text-center text-text-muted mt-10">Your cart is empty</p>
                        ) : (
                            <div className="space-y-4">
                                {cart.map(item => (
                                    <div key={item.id} className="flex gap-4 p-4 bg-bg-light rounded-xl">
                                        <div className="w-20 h-20 bg-white rounded-lg p-2 flex items-center justify-center flex-shrink-0">
                                            <img src={item.image ? `${item.image}?width=200&format=webp&quality=80` : ''} loading="lazy" alt={item.name} className="max-w-full max-h-full object-contain" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-medium mb-1 truncate">{item.name}</h4>
                                            <p className="text-sm font-semibold text-secondary mb-2">€{item.price.toFixed(2)}</p>
                                            <div className="flex items-center gap-3 border border-border rounded-lg w-fit px-1">
                                                <button
                                                    onClick={() => updateQuantity(item.id, -1)}
                                                    className="w-7 h-7 flex items-center justify-center text-text-muted hover:text-dark"
                                                >
                                                    -
                                                </button>
                                                <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                                                <button
                                                    onClick={() => updateQuantity(item.id, 1)}
                                                    className="w-7 h-7 flex items-center justify-center text-text-muted hover:text-dark"
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => removeFromCart(item.id)}
                                            className="text-danger hover:text-red-700 h-fit p-2"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {cart.length > 0 && (
                        <div className="p-6 border-t border-border bg-bg-light">
                            <div className="flex justify-between items-center mb-2">
                                <span className="font-semibold">Subtotal</span>
                                <span className="font-semibold text-lg">€{cartSubtotal.toFixed(2)}</span>
                            </div>
                            <p className="text-xs text-text-muted text-center mb-4">
                                Tax included and shipping calculated at checkout
                            </p>
                            <Link to="/checkout" onClick={closeDrawer} className="block w-full bg-primary hover:bg-primary-dark text-white py-3 rounded-full font-medium mb-3 transition-colors text-center">
                                Check out →
                            </Link>
                            <button
                                onClick={closeDrawer}
                                className="w-full bg-secondary hover:bg-[#152a45] text-white py-3 rounded-full font-medium transition-colors"
                            >
                                Continue shopping
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default CartDrawer;
