import React from 'react';
import { Link } from 'react-router-dom';
import { useBrands } from '../../hooks/useBrands';

const BrandsSection = () => {
    const { data: brands = [], isLoading: loading, isError: error } = useBrands();

    if (loading) {
        return (
            <section className="py-16">
                <div className="container mx-auto px-6">
                    <h2 className="text-center text-2xl font-medium mb-10">Shop by Brands</h2>
                    <div className="flex justify-center items-center h-32">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                    </div>
                </div>
            </section>
        );
    }

    if (error || brands.length === 0) {
        return null;
    }

    return (
        <section className="py-16">
            <div className="container mx-auto px-6">
                <h2 className="text-center text-2xl font-medium mb-10">Shop by Brands</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                    {brands.map(brand => (
                        <Link
                            key={brand.id || brand.slug}
                            to={`/products?brand=${brand.slug}`}
                            className="brand-card group cursor-pointer bg-bg-light border border-border rounded-xl p-10 flex flex-col items-center gap-4 transition-all hover:-translate-y-1 hover:shadow-lg"
                        >
                            <div className="h-[60px] flex items-center justify-center">
                                {brand.logoUrl ? (
                                    <img src={brand.logoUrl ? `${brand.logoUrl}?width=200&format=webp&quality=80` : ''} alt={brand.name} loading="lazy" className="max-h-full max-w-[120px] object-contain" />
                                ) : (
                                    <span className="text-2xl font-bold tracking-tight">{brand.name}</span>
                                )}
                            </div>
                            <span className="text-sm text-text-muted">{brand.name}</span>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default BrandsSection;
