import React from 'react';
import { Link } from 'react-router-dom';

const AccessoriesBanner = () => {
    return (
        <section className="pb-16">
            <div className="container mx-auto px-6">
                <div className="relative rounded-2xl overflow-hidden group">
                    <img
                        src="https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=1200&fm=webp&q=80"
                        alt="Accessories"
                        width={1200}
                        height={300}
                        loading="lazy"
                        className="w-full h-[300px] object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute top-1/2 right-4 md:right-16 -translate-y-1/2 bg-white/95 backdrop-blur-md p-10 rounded-xl max-w-xs shadow-lg">
                        <h3 className="text-2xl font-semibold mb-3">Accessories</h3>
                        <p className="text-sm text-text-muted mb-5 leading-relaxed">
                            Elevate your experience with essentials that complement your favorite devices
                        </p>
                        <Link to="/products" className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-full text-sm font-medium transition-colors inline-flex items-center gap-2">
                            Shop Now
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default AccessoriesBanner;
