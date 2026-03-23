import React from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchOrders } from '../services/api';
import { useQuery } from '@tanstack/react-query';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { User, MapPin, LogOut, Package, ChevronRight, Loader, AlertCircle, ShoppingBag } from 'lucide-react';
import '../pages/pages-enhanced.css';

const Account = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const { data: orders, isLoading, isError } = useQuery({
        queryKey: ['orders', user?.id],
        queryFn: fetchOrders,
        enabled: !!user
    });

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <div className="page-gradient-bg">
            <div className="container mx-auto px-6 py-10">
                <div className="flex items-center gap-2 text-sm text-text-muted mb-8">
                    <Link to="/" className="hover:text-primary transition-colors">Home</Link>
                    <span>/</span>
                    <span>Account</span>
                </div>

                <h1 className="text-3xl font-bold mb-8">My Account</h1>

                <div className="grid lg:grid-cols-[320px_1fr] gap-10">
                    {/* Sidebar */}
                    <aside className="animate-fade-in-up">
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-border/50">
                            {/* User Info */}
                            <div className="flex items-center gap-4 pb-6 border-b border-border mb-6">
                                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white text-xl font-bold shadow-lg">
                                    {user.personalName?.charAt(0) || user.companyName?.charAt(0) || 'U'}
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg">{user.personalName || user.companyName}</h3>
                                    <p className="text-sm text-text-muted">{user.email}</p>
                                </div>
                            </div>

                            {/* Address */}
                            <div className="mb-6">
                                <div className="flex items-center gap-2 mb-3">
                                    <MapPin size={16} className="text-primary" />
                                    <span className="text-xs font-semibold text-primary uppercase tracking-wide">Default Address</span>
                                </div>
                                <p className="text-sm text-text-muted leading-relaxed whitespace-pre-line mb-3">
                                    {user.companyAddr || 'No address set'}
                                </p>
                                {/* <a href="#" className="inline-flex items-center gap-1 text-sm text-primary font-semibold hover:underline">
                                    View addresses (4)
                                    <ChevronRight size={16} />
                                </a> */}
                            </div>

                            {/* Logout Button */}
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-danger hover:bg-danger/10 py-3 rounded-xl transition-colors"
                            >
                                <LogOut size={18} />
                                Logout
                            </button>
                        </div>
                    </aside>

                    {/* Orders */}
                    <div className="animate-fade-in-up animate-delay-200">
                        <div className="flex items-center gap-3 mb-6">
                            <Package size={24} className="text-primary" />
                            <h2 className="text-xl font-bold">Order History</h2>
                        </div>

                        {isLoading ? (
                            <div className="flex justify-center py-20">
                                <Loader size={40} className="text-primary animate-spin" />
                            </div>
                        ) : isError ? (
                            <div className="bg-white rounded-2xl p-10 text-center border border-border/50">
                                <AlertCircle size={40} className="text-danger mx-auto mb-4" />
                                <h3 className="font-bold text-lg mb-2">Failed to load orders</h3>
                                <p className="text-text-muted">Please try again later</p>
                            </div>
                        ) : !orders || orders.length === 0 ? (
                            <div className="bg-white rounded-2xl p-10 text-center border border-border/50">
                                <ShoppingBag size={40} className="text-text-muted mx-auto mb-4 opacity-50" />
                                <h3 className="font-bold text-lg mb-2">No orders yet</h3>
                                <p className="text-text-muted mb-6">Start shopping to see your orders here</p>
                                <Link to="/products" className="btn-gradient inline-flex">
                                    Browse Products
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {orders.map((order, index) => (
                                    <div
                                        key={order.id}
                                        className="bg-white rounded-2xl p-6 shadow-sm border border-border/50 hover:shadow-md transition-shadow cursor-default"
                                        style={{ animationDelay: `${index * 0.1}s` }}
                                    >
                                        <div className="flex justify-between items-start border-b border-border pb-4 mb-4">
                                            <div>
                                                <h4 className="font-bold text-lg text-secondary">Order #{order.id}</h4>
                                                <p className="text-sm text-text-muted">
                                                    {new Date(order.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <span className={`inline-block px-4 py-1.5 rounded-full text-xs font-bold capitalize mb-2 ${order.currentStatus === 'completed' || order.currentStatus === 'paid'
                                                    ? 'bg-success/10 text-success'
                                                    : order.currentStatus === 'cancelled'
                                                        ? 'bg-danger/10 text-danger'
                                                        : 'bg-warning/10 text-warning'
                                                    }`}>
                                                    {order.currentStatus}
                                                </span>
                                                <p className="font-bold text-lg text-secondary">€{parseFloat(order.totalAmount).toFixed(2)}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="flex gap-3 overflow-x-auto pb-2">
                                                {order.items?.map((item, idx) => (
                                                    <div key={idx} className="w-16 h-16 bg-bg-light rounded-xl p-2 flex items-center justify-center flex-shrink-0">
                                                        <img
                                                            src={item.product?.imageSrc || 'placeholder.jpg'}
                                                            alt={item.product?.title || 'Product'}
                                                            className="max-w-full max-h-full object-contain"
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                            <span className="text-xs text-text-muted font-semibold">
                                                {order.items?.length || 0} items
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Account;
