import React from 'react';

const FoldBanner = () => {
    return (
        <section className="pb-16">
            <div className="container mx-auto px-6">
                <div className="relative group overflow-hidden rounded-2xl">
                    <img
                        src="https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=1200&fm=webp&q=80"
                        alt="Fold Phones"
                        width={1200}
                        height={400}
                        loading="lazy"
                        className="w-full h-[400px] object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute top-1/2 left-4 md:left-16 -translate-y-1/2 max-w-sm">
                        <h3 className="text-3xl md:text-3xl font-medium leading-normal text-white drop-shadow-lg">
                            Experience Innovation and Convenience with Smart Fold Phones.
                        </h3>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default FoldBanner;
