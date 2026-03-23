import React, { useState } from 'react';
import { Search, ChevronDown, User, ShoppingCart, Menu, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const Header = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const { cartCount, openDrawer } = useCart();
    const navigate = useNavigate();

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchTerm.trim()) {
            navigate(`/products?search=${encodeURIComponent(searchTerm.trim())}`);
            setSearchTerm('');
        }
    };

    return (
        <header className="py-4 bg-white transition-all duration-300">
            <div className="container mx-auto px-6 flex justify-between items-center">
                {/* Logo */}
                <Link to="/" className="group flex items-center">
                    <img
                        src="/Techbyte Logo.png"
                        alt="TechByte Logo"
                        className="h-8 md:h-10 w-auto object-contain"
                    />
                </Link>

                {/* Actions */}
                <div className="flex items-center gap-4">
                    {/* Search Box */}
                    <form
                        onSubmit={handleSearch}
                        className={`hidden md:flex items-center rounded-full px-4 py-2.5 w-[300px] transition-all duration-300 ${isSearchFocused
                            ? 'bg-white border-2 border-primary shadow-lg shadow-primary/10'
                            : 'bg-bg-light border-2 border-transparent'
                            }`}
                    >
                        <Search size={18} strokeWidth={2} className={`transition-colors duration-300 ${isSearchFocused ? 'text-primary' : 'text-text-muted'}`} />
                        <input
                            type="text"
                            placeholder="Search products..."
                            className="border-none outline-none flex-1 text-sm text-text-dark bg-transparent ml-3 placeholder:text-text-muted"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onFocus={() => setIsSearchFocused(true)}
                            onBlur={() => setIsSearchFocused(false)}
                        />
                        {searchTerm && (
                            <button
                                type="button"
                                onClick={() => setSearchTerm('')}
                                className="text-text-muted hover:text-primary transition-colors"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </form>

                    {/* Account Btn */}
                    <Link
                        to="/account"
                        className="p-2.5 text-text-dark hover:text-primary transition-all duration-300 rounded-full hover:bg-primary/10"
                    >
                        <User size={22} strokeWidth={2} />
                    </Link>

                    {/* Cart Btn */}
                    <button
                        className="p-2.5 text-text-dark hover:text-primary transition-all duration-300 rounded-full hover:bg-primary/10 relative"
                        onClick={openDrawer}
                    >
                        <ShoppingCart size={22} strokeWidth={2} />
                        {cartCount > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 bg-primary text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-md animate-pulse">
                                {cartCount}
                            </span>
                        )}
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;
