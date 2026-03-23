import React from 'react';
import { Link } from 'react-router-dom';

const ProductCard = ({ product }) => {
    return (
        <Link to={`/products/${product.handle}`} className="block">
            <div className="product-card-enhanced bg-white border border-border rounded-xl overflow-hidden group relative">
                {/* Stock Badge */}
                {product.inStock > 0 && product.inStock < 5 && (
                    <div className="absolute top-3 right-3 z-10 bg-warning/90 text-white text-xs font-semibold px-3 py-1 rounded-full backdrop-blur-sm">
                        Only {product.inStock} left
                    </div>
                )}

                <div className="relative p-5 bg-bg-light aspect-square flex items-center justify-center overflow-hidden">
                    <img
                        src={product.image ? `${product.image}?width=400&format=webp&quality=80` : ''}
                        alt={product.name}
                        loading="lazy"
                        className="w-full h-full object-contain transition-all duration-500 group-hover:scale-110 mix-blend-multiply relative z-10"
                    />
                </div>

                <div className="p-4 relative z-10">
                    <p className="text-xs text-text-muted mb-1 uppercase tracking-wide">{product.brand}</p>
                    <h3 className="text-sm font-medium mb-3 line-clamp-2 h-10 group-hover:text-primary transition-colors duration-300">{product.name}</h3>

                    <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                            <p className="text-lg font-bold text-secondary">€{product.price.toFixed(2)}</p>
                            {product.originalPrice > product.price && (
                                <span className="text-xs text-text-muted line-through">
                                    €{product.originalPrice.toFixed(2)}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
};

export default ProductCard;
