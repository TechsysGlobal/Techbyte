import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Send, Check, MessageSquare, Clock, ChevronDown } from 'lucide-react';
import { sendContactMessage } from '../services/api';
import './Contact.css';


// Country codes list with common countries
const countryCodes = [
    { code: '+31', country: 'Netherlands', flag: '🇳🇱' },
    { code: '+1', country: 'USA/Canada', flag: '🇺🇸' },
    { code: '+44', country: 'United Kingdom', flag: '🇬🇧' },
    { code: '+49', country: 'Germany', flag: '🇩🇪' },
    { code: '+33', country: 'France', flag: '🇫🇷' },
    { code: '+32', country: 'Belgium', flag: '🇧🇪' },
    { code: '+39', country: 'Italy', flag: '🇮🇹' },
    { code: '+34', country: 'Spain', flag: '🇪🇸' },
    { code: '+351', country: 'Portugal', flag: '🇵🇹' },
    { code: '+41', country: 'Switzerland', flag: '🇨🇭' },
    { code: '+43', country: 'Austria', flag: '🇦🇹' },
    { code: '+46', country: 'Sweden', flag: '🇸🇪' },
    { code: '+47', country: 'Norway', flag: '🇳🇴' },
    { code: '+45', country: 'Denmark', flag: '🇩🇰' },
    { code: '+358', country: 'Finland', flag: '🇫🇮' },
    { code: '+48', country: 'Poland', flag: '🇵🇱' },
    { code: '+91', country: 'India', flag: '🇮🇳' },
    { code: '+86', country: 'China', flag: '🇨🇳' },
    { code: '+81', country: 'Japan', flag: '🇯🇵' },
    { code: '+82', country: 'South Korea', flag: '🇰🇷' },
    { code: '+61', country: 'Australia', flag: '🇦🇺' },
    { code: '+64', country: 'New Zealand', flag: '🇳🇿' },
    { code: '+971', country: 'UAE', flag: '🇦🇪' },
    { code: '+966', country: 'Saudi Arabia', flag: '🇸🇦' },
    { code: '+27', country: 'South Africa', flag: '🇿🇦' },
    { code: '+55', country: 'Brazil', flag: '🇧🇷' },
    { code: '+52', country: 'Mexico', flag: '🇲🇽' },
];

const Contact = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        countryCode: '+31', // Netherlands as default
        phone: '',
        subject: '',
        message: ''
    });
    const [submitted, setSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        try {
            await sendContactMessage(formData);

            setSubmitted(true);
            setTimeout(() => {
                setSubmitted(false);
                setFormData({
                    name: '',
                    email: '',
                    countryCode: '+31',
                    phone: '',
                    subject: '',
                    message: ''
                });
            }, 3000);
        } catch (err) {
            console.error('API send error:', err);
            setError('Failed to send message. Please try again or contact us directly at info@techbyte.nl');
        } finally {
            setIsSubmitting(false);
        }
    };
    return (
        <div className="contact-page">
            <div className="container mx-auto px-6 py-8">
                <div className="text-sm text-text-muted mb-6 flex gap-2">
                    <Link to="/" className="hover:text-primary transition-colors">Home</Link>
                    <span>/</span>
                    <span>Contact</span>
                </div>

                {/* Hero Section with Gradient */}
                <div className="contact-hero">
                    <h1 className="contact-title">Get In Touch</h1>
                    <p className="contact-subtitle">Have a question or want to work with us? We'd love to hear from you.</p>
                </div>

                {/* Contact Info Cards */}
                <div className="contact-info-grid">
                    <div className="info-card">
                        <div className="info-icon">
                            <MapPin size={24} />
                        </div>
                        <h3>Visit Us</h3>
                        <p>Abberdaan 210<br />1046AB Amsterdam<br />Netherlands</p>
                    </div>

                    <div className="info-card">
                        <div className="info-icon">
                            <Mail size={24} />
                        </div>
                        <h3>Email Us</h3>
                        <a href="mailto:info@techbyte.nl">info@techbyte.nl</a>
                    </div>

                    <div className="info-card">
                        <div className="info-icon">
                            <Phone size={24} />
                        </div>
                        <h3>Call Us</h3>
                        <a href="tel:+31850161360">+3185 – 016 13 60</a>
                    </div>

                    <div className="info-card">
                        <div className="info-icon">
                            <Clock size={24} />
                        </div>
                        <h3>Business Hours</h3>
                        <p>Mon - Fri: 9:00 - 18:00<br />Sat - Sun: Closed</p>
                    </div>
                </div>

                {/* Map and Form Section */}
                <div className="contact-main-section">
                    {/* Map Section */}
                    <div className="contact-map-card">
                        <div className="map-wrapper">
                            <iframe
                                title="TechByte Location"
                                width="100%"
                                height="100%"
                                frameBorder="0"
                                scrolling="no"
                                marginHeight="0"
                                marginWidth="0"
                                src="https://maps.google.com/maps?width=100%25&amp;height=400&amp;hl=en&amp;q=TechByte,%20Abberdaan%20210,%201046%20AB%20Amsterdam+(Techbyte)&amp;t=&amp;z=15&amp;ie=UTF8&amp;iwloc=B&amp;output=embed"
                            ></iframe>
                        </div>
                    </div>

                    {/* Contact Form */}
                    <div className="contact-form-card">
                        <div className="form-header">
                            <MessageSquare size={32} />
                            <h2>Send us a Message</h2>
                            <p>Fill out the form below and we'll get back to you within 24 hours</p>
                        </div>

                        {submitted ? (
                            <div className="success-message">
                                <div className="success-icon">
                                    <Check size={40} />
                                </div>
                                <h3>Message Sent Successfully!</h3>
                                <p>Thank you for reaching out. We'll get back to you as soon as possible.</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="contact-form">
                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="name">Full Name *</label>
                                        <input
                                            type="text"
                                            id="name"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            required
                                            placeholder="John Doe"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="email">Email Address *</label>
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            required
                                            placeholder="john@example.com"
                                        />
                                    </div>
                                </div>

                                {/* Phone Number with Country Code */}
                                <div className="form-group">
                                    <label htmlFor="phone">Phone Number</label>
                                    <div className="phone-input-wrapper">
                                        <div className="country-code-select">
                                            <select
                                                name="countryCode"
                                                value={formData.countryCode}
                                                onChange={handleChange}
                                                className="country-code-dropdown"
                                            >
                                                {countryCodes.map((country) => (
                                                    <option key={country.code} value={country.code}>
                                                        {country.flag} {country.code} ({country.country})
                                                    </option>
                                                ))}
                                            </select>
                                            <ChevronDown size={16} className="dropdown-icon" />
                                        </div>
                                        <input
                                            type="tel"
                                            id="phone"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            placeholder="612345678"
                                            className="phone-input"
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="subject">Subject *</label>
                                    <input
                                        type="text"
                                        id="subject"
                                        name="subject"
                                        value={formData.subject}
                                        onChange={handleChange}
                                        required
                                        placeholder="How can we help you?"
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="message">Message *</label>
                                    <textarea
                                        id="message"
                                        name="message"
                                        value={formData.message}
                                        onChange={handleChange}
                                        required
                                        rows={6}
                                        placeholder="Tell us more about your inquiry..."
                                    />
                                </div>

                                {error && (
                                    <div className="error-message">
                                        {error}
                                    </div>
                                )}

                                <button type="submit" className="submit-button" disabled={isSubmitting}>
                                    {isSubmitting ? (
                                        <>
                                            <span className="spinner"></span>
                                            <span>Sending...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Send size={20} />
                                            <span>Send Message</span>
                                        </>
                                    )}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Contact;
