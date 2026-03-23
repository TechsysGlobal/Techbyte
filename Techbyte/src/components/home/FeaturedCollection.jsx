import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, SlidersHorizontal, Loader } from 'lucide-react';
import ProductCard from '../shared/ProductCard';
import { useFeaturedProducts } from '../../hooks/useFeaturedProducts';

const FeaturedCollection = () => {
    const { data, isLoading: loading } = useFeaturedProducts();
    const [startIndex, setStartIndex] = useState(0);
    const itemsPerPage = 4;

    // Filter valid products from the response
    const products = (data?.products || []).filter(p => parseFloat(p.variantPrice) > 0 && p.inStock > 0);

    const maxIndex = Math.max(0, products.length - itemsPerPage);
    const nextSlide = () => setStartIndex(prev => Math.min(prev + 1, maxIndex));
    const prevSlide = () => setStartIndex(prev => Math.max(prev - 1, 0));

    const featuredProducts = products.slice(startIndex, startIndex + itemsPerPage);

    if (loading) {
        return (
            <section className="pb-16">
                <div className="container mx-auto px-6">
                    <div className="flex items-center justify-center py-16">
                        <Loader size={28} className="animate-spin text-primary" />
                        <span className="ml-3 text-text-muted">Loading featured products...</span>
                    </div>
                </div>
            </section>
        );
    }

    if (products.length === 0) return null;

    return (
        <section className="pb-16">
            <div className="container mx-auto px-6">
                <div className="flex justify-between items-start mb-8">
                    <div className="flex gap-4 items-start">
                        <div className="mt-1 text-primary">
                            <SlidersHorizontal size={32} strokeWidth={1.5} />
                        </div>
                        <h2 className="text-3xl font-medium leading-tight">Featured<br />collection</h2>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={prevSlide}
                            disabled={startIndex === 0}
                            aria-label="Previous products"
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${startIndex === 0 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-primary text-white hover:bg-primary-dark'}`}
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <button
                            onClick={nextSlide}
                            disabled={startIndex >= maxIndex}
                            aria-label="Next products"
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${startIndex >= maxIndex ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-primary text-white hover:bg-primary-dark'}`}
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {featuredProducts.map(product => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default FeaturedCollection;
