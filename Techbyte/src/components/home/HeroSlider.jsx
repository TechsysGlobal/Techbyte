import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const slides = [
    {
        id: 1,
        title: "Superior Quality",
        label: "Boost business performance",
        description: "Our wide range of devices and accessories are built for businesses that demand reliability and innovation in every tool they use.",
        image: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800&fm=webp&q=80",
        alt: "Samsung Phones"
    },
    {
        id: 2,
        title: "Powerful Devices",
        label: "Boost business performance",
        description: "From smartphones to accessories, we provide cutting-edge solutions to streamline your operations and boost productivity.",
        image: "https://images.unsplash.com/photo-1696446701796-da61225697cc?w=800&fm=webp&q=80",
        alt: "iPhone 16"
    }
];

const HeroSlider = () => {
    const [currentSlide, setCurrentSlide] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
    const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

    return (
        <section className="py-6">
            <div className="container mx-auto px-6">
                <div className="relative bg-[#e8f4f8] rounded-2xl overflow-hidden min-h-[400px]" aria-live="polite" aria-atomic="true">
                    {slides.map((slide, index) => (
                        <div
                            key={slide.id}
                            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
                                }`}
                        >
                            {/* Text Content - Overlay */}
                            <div className="absolute inset-0 z-20 flex items-center p-10 md:p-14 bg-white/15">
                                <div className="max-w-md">
                                    <span className="text-[13px] text-text-muted uppercase tracking-widest mb-3 block font-medium">
                                        {slide.label}
                                    </span>
                                    <h2 className="text-4xl md:text-[42px] font-bold mb-4 leading-tight text-text-dark">
                                        {slide.title}
                                    </h2>
                                    <p className="text-text-muted text-[15px] leading-relaxed">
                                        {slide.description}
                                    </p>
                                </div>
                            </div>

                            {/* Image Background */}
                            <div className="absolute inset-0 z-0">
                                <img
                                    src={slide.image}
                                    alt={slide.alt}
                                    width={800}
                                    height={450}
                                    className="w-full h-full object-cover object-center"
                                    loading={index === 0 ? 'eager' : 'lazy'}
                                    fetchPriority={index === 0 ? 'high' : 'auto'}
                                />
                            </div>
                        </div>
                    ))}

                    {/* Controls */}
                    <div className="absolute bottom-6 left-6 right-6 flex justify-between items-center z-20">
                        <div className="flex gap-2">
                            {slides.map((_, index) => (
                                <div
                                    key={index}
                                    role="button"
                                    tabIndex={0}
                                    aria-label={`Go to slide ${index + 1}`}
                                    onClick={() => setCurrentSlide(index)}
                                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setCurrentSlide(index); }}
                                    className={`w-8 h-1 rounded-full cursor-pointer transition-colors ${index === currentSlide ? 'bg-primary' : 'bg-black/20'
                                        }`}
                                />
                            ))}
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={prevSlide}
                                aria-label="Previous slide"
                                className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary-dark transition-colors"
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <button
                                onClick={nextSlide}
                                aria-label="Next slide"
                                className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary-dark transition-colors"
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HeroSlider;
