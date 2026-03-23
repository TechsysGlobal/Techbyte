import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Truck, Building2, Package, Eye, Target } from 'lucide-react';
import './pages.css';

const About = () => {
    return (
        <div className="page-gradient-bg">
            <div className="container mx-auto px-6 py-8">
                {/* Breadcrumb */}
                <div className="text-sm text-text-muted mb-6 flex gap-2">
                    <Link to="/" className="hover:text-primary transition-colors">Home</Link>
                    <span>/</span>
                    <span>About</span>
                </div>

                {/* Header */}
                <div className="page-hero">
                    <h1>About Techbyte</h1>
                    <p className="text-lg uppercase tracking-wider font-bold mt-2">Established in Amsterdam</p>
                </div>

                {/* Intro Section */}
                <div className="enhanced-card max-w-4xl mx-auto mb-16 text-center">
                    <h3 className="text-2xl font-bold mb-4">Your Technology Partner in the Heart of Amsterdam</h3>
                    <p className="text-lg mb-6 text-gray-700">
                        At Techbyte, we're not just a company; we're your dedicated partner in the world of consumer electronics.
                        Based in the vibrant city of Amsterdam, we have become a leading force in the industry, serving customers
                        near and far with a commitment to excellence and innovation.
                    </p>
                    <div className="h-1 w-16 bg-primary mx-auto my-6 rounded-full opacity-20"></div>
                    <p className="font-semibold text-gray-800">
                        <strong>Together at Techbyte:</strong> Building strong partnerships through trust, collaboration, and shared success.
                    </p>
                </div>

                {/* Core Pillars Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
                    <div className="enhanced-card relative">
                        <div className="text-8xl absolute bottom-0 right-0 opacity-5 pointer-events-none">
                            <MapPin size={120} />
                        </div>
                        <div className="relative z-10">
                            <div className="icon-container mb-4">
                                <MapPin size={28} />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Our Amsterdam Hub</h3>
                            <p className="text-gray-600">
                                Nestled in the heart of Amsterdam, Techbyte operates from a bustling metropolis known for its
                                rich history and forward-thinking spirit. We have established ourselves as a dynamic destination
                                for cutting-edge technology.
                            </p>
                        </div>
                    </div>

                    <div className="enhanced-card relative">
                        <div className="text-8xl absolute bottom-0 right-0 opacity-5 pointer-events-none">
                            <Truck size={120} />
                        </div>
                        <div className="relative z-10">
                            <div className="icon-container mb-4">
                                <Truck size={28} />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Driving Excellence</h3>
                            <p className="text-gray-600">
                                We take pride in our commitment to customer satisfaction. Techbyte operates its own fleet of
                                trucks for deliveries, ensuring reliability and reflecting our dedication to a seamless experience.
                            </p>
                        </div>
                    </div>

                    <div className="enhanced-card relative">
                        <div className="text-8xl absolute bottom-0 right-0 opacity-5 pointer-events-none">
                            <Building2 size={120} />
                        </div>
                        <div className="relative z-10">
                            <div className="icon-container mb-4">
                                <Building2 size={28} />
                            </div>
                            <h3 className="text-xl font-bold mb-3">In-House Departments</h3>
                            <p className="text-gray-600">
                                We are a one-stop-shop. With essential departments like Finance, Customer Service, Warehouse,
                                and Sales all under one roof, we offer an approach that guarantees efficiency.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Hero Image - Fixed size */}
                <div className="mb-16 max-w-4xl mx-auto rounded-3xl overflow-hidden shadow-2xl">
                    <img
                        src="https://cdn.shopify.com/s/files/1/0703/7612/8663/files/Unity_Trading_Booth.png?v=1768552229"
                        alt="Techbyte Booth in Amsterdam"
                        className="w-full h-auto"
                        loading="lazy"
                    />
                </div>

                {/* Philosophy Section */}
                <h2 className="text-4xl font-bold text-center mb-12">Our Philosophy</h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
                    <div className="enhanced-card relative">
                        <div className="text-8xl absolute bottom-0 right-0 opacity-5 pointer-events-none">
                            <Package size={120} />
                        </div>
                        <div className="relative z-10">
                            <div className="icon-container mb-4">
                                <Package size={28} />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Expansive Product Range</h3>
                            <p className="text-gray-600">
                                Techbyte curates an extensive catalog of the latest consumer electronics, from smartphones to
                                home automation. Our team stays ahead of trends to ensure access to sought-after products.
                            </p>
                        </div>
                    </div>

                    <div className="enhanced-card relative">
                        <div className="text-8xl absolute bottom-0 right-0 opacity-5 pointer-events-none">
                            <Eye size={120} />
                        </div>
                        <div className="relative z-10">
                            <div className="icon-container mb-4">
                                <Eye size={28} />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Our Vision</h3>
                            <p className="text-gray-600">
                                To be the premier destination for consumer electronics, connecting individuals and businesses
                                with the latest innovations, all while fostering growth, trust, and lasting partnerships.
                            </p>
                        </div>
                    </div>

                    <div className="enhanced-card relative">
                        <div className="text-8xl absolute bottom-0 right-0 opacity-5 pointer-events-none">
                            <Target size={120} />
                        </div>
                        <div className="relative z-10">
                            <div className="icon-container mb-4">
                                <Target size={28} />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Our Mission</h3>
                            <p className="text-gray-600">
                                To empower our customers with a diverse inventory and exceptional service. We aim to grow hand
                                in hand with our customers, enabling you to stay at the forefront of technology.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="enhanced-card max-w-3xl mx-auto text-center">
                    <h3 className="text-2xl font-bold mb-4">Join the Techbyte Community</h3>
                    <p className="text-lg text-gray-700">
                        Whether you're a business seeking dependable partners or an individual looking for the latest gadgets,
                        Techbyte welcomes you to join our ever-growing community.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default About;
