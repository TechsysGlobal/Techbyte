import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { fetchProduct } from '../services/api';
import { useCart } from '../context/CartContext';
import { Minus, Plus, ShoppingCart, Zap, Package, Shield, Check, Loader, Box } from 'lucide-react';
import SkeletonDetail from '../components/shared/SkeletonDetail';
import '../pages/pages-enhanced.css';

const ProductDetail = () => {
    const { handle } = useParams();
    const { addToCart } = useCart();
    const navigate = useNavigate();
    const imageRef = useRef(null);
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [addedToCart, setAddedToCart] = useState(false);

    useEffect(() => {
        const loadProduct = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await fetchProduct(handle);
                setProduct(data);
            } catch (err) {
                console.error('Failed to load product:', err);
                setError('Failed to load product details.');
            } finally {
                setLoading(false);
            }
        };
        loadProduct();
    }, [handle]);

    if (loading) {
        return (
            <div className="page-gradient-bg">
                <SkeletonDetail />
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="page-gradient-bg">
                <div className="container mx-auto px-6 py-20 text-center">
                    <h2 className="text-2xl font-bold mb-4">{error || 'Product not found'}</h2>
                    <Link to="/products" className="btn-gradient inline-flex">Back to products</Link>
                </div>
            </div>
        );
    }

    const handleAddToCart = () => {
        addToCart(product, quantity);
        setAddedToCart(true);
        setTimeout(() => setAddedToCart(false), 2000);
    };

    const handleBuyNow = () => {
        addToCart(product, quantity);
        navigate('/checkout');
    };

    const handleMouseMove = (e) => {
        if (!imageRef.current) return;
        const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - left) / width) * 100;
        const y = ((e.clientY - top) / height) * 100;
        imageRef.current.style.transformOrigin = `${x}% ${y}%`;
    };

    const handleMouseLeave = () => {
        if (!imageRef.current) return;
        // Reset translation and origin when leaving
        imageRef.current.style.transformOrigin = 'center center';
    };

    // Build specs dynamically from all available fields
    const specs = [];
    if (product.storage) specs.push({ label: 'Storage', value: product.storage });
    // product.color, product.model, product.vendor removed as per request
    if (product.region) specs.push({ label: 'Region', value: product.region });
    if (product.sim) specs.push({ label: 'Sim', value: product.sim });
    if (product.warranty) specs.push({ label: 'Warranty', value: product.warranty, icon: Shield });
    if (product.inBox) specs.push({ label: 'In Box', value: product.inBox, wrap: true });
    if (product.variantSku) specs.push({ label: 'SKU', value: product.variantSku });

    // Filter out rows with "-" or empty values
    const filteredSpecs = specs.filter(spec => spec.value && spec.value !== '-' && spec.value !== '—');

    const getStockColor = (qty) => {
        if (qty > 50) return 'text-success bg-success/10 px-3 py-1 rounded-full';
        if (qty >= 10) return 'text-warning bg-warning/10 px-3 py-1 rounded-full';
        return 'text-red-500 bg-red-50 px-3 py-1 rounded-full';
    };

    const getStockDot = (qty) => {
        if (qty > 50) return 'bg-success';
        if (qty >= 10) return 'bg-warning';
        return 'bg-red-500';
    };

    return (
        <div className="page-gradient-bg">
            <div className="container mx-auto px-6 py-8">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm text-text-muted mb-8">
                    <Link to="/" className="hover:text-primary transition-colors">Home</Link>
                    <span>/</span>
                    <Link to="/products" className="hover:text-primary transition-colors">Products</Link>
                    <span>/</span>
                    <span className="text-text-dark truncate max-w-[200px]">{product.name}</span>
                </div>

                <div className="grid md:grid-cols-2 gap-10 lg:gap-16">
                    {/* Gallery */}
                    <div
                        className="product-image-container flex self-start animate-fade-in-up group overflow-hidden"
                        onMouseMove={handleMouseMove}
                        onMouseLeave={handleMouseLeave}
                    >
                        <img
                            ref={imageRef}
                            src={product.image ? `${product.image}?width=800&format=webp&quality=90` : ''}
                            alt={product.name}
                            loading="lazy"
                            className="w-full max-h-[500px] object-contain mix-blend-multiply mx-auto transition-transform duration-200 group-hover:scale-[1.8] cursor-zoom-in"
                        />
                    </div>

                    {/* Info */}
                    <div className="animate-fade-in-up animate-delay-200">
                        <p className="text-sm text-primary font-semibold uppercase tracking-wider mb-2">{product.brand}</p>
                        <h1 className="text-3xl lg:text-4xl font-bold mb-4 leading-tight">{product.name}</h1>

                        <div className="flex items-center gap-2 mb-6">
                            <div className={`flex items-center gap-2 text-sm font-bold ${getStockColor(product.inStock)}`}>
                                <Box size={16} />
                                {product.inStock > 0 ? `${product.inStock} in stock` : 'Out of stock'}
                            </div>
                        </div>

                        <div className="mb-8">
                            <p className="text-4xl font-bold text-secondary">
                                €{product.price.toFixed(2)}
                                {product.originalPrice > product.price && (
                                    <span className="ml-3 text-lg text-text-muted line-through">
                                        €{product.originalPrice.toFixed(2)}
                                    </span>
                                )}
                            </p>
                            {product.originalPrice > product.price && (
                                <p className="text-sm text-success font-semibold mt-1">
                                    You save €{(product.originalPrice - product.price).toFixed(2)} (
                                    {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
                                    )
                                </p>
                            )}
                        </div>

                        {/* Quantity Selector */}
                        <div className="flex items-center gap-4 mb-8">
                            <span className="text-sm font-semibold text-text-muted">Quantity:</span>
                            <div className="quantity-selector">
                                <button
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    className="quantity-btn"
                                >
                                    <Minus size={18} />
                                </button>
                                <span className="quantity-display">{quantity}</span>
                                <button
                                    onClick={() => setQuantity(quantity + 1)}
                                    className="quantity-btn"
                                >
                                    <Plus size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-3 mb-10">
                            <button
                                onClick={handleAddToCart}
                                disabled={product.inStock <= 0}
                                className={`w-full py-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-3 ${addedToCart
                                    ? 'bg-success text-white'
                                    : product.inStock <= 0
                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        : 'bg-primary text-white hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5'
                                    }`}
                            >
                                {addedToCart ? (
                                    <>
                                        <Check size={20} />
                                        Added to Cart!
                                    </>
                                ) : (
                                    <>
                                        <ShoppingCart size={20} />
                                        Add to Cart
                                    </>
                                )}
                            </button>
                            <button
                                onClick={handleBuyNow}
                                disabled={product.inStock <= 0}
                                className="w-full bg-secondary hover:bg-[#152a45] text-white py-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-3 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Zap size={20} />
                                Buy it now
                            </button>
                        </div>

                        {/* Specifications — dynamically built from ALL database fields */}
                        {filteredSpecs.length > 0 && (
                            <div className="product-specs">
                                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                    <Package size={20} className="text-primary" />
                                    Specifications
                                </h3>
                                <div className="space-y-0">
                                    {filteredSpecs.map((spec, i) => (
                                        <div key={i} className="spec-row">
                                            <span className="text-text-muted flex items-center gap-2">
                                                {spec.icon && <spec.icon size={16} className="text-primary" />}
                                                {spec.label}
                                            </span>
                                            <span className={`font-semibold ${spec.wrap ? 'whitespace-pre-wrap text-right max-w-[60%]' : ''}`}>
                                                {spec.value}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetail;
