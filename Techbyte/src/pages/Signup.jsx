import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Building2,
    Factory,
    FileText,
    Globe,
    Users,
    MapPin,
    ShoppingCart,
    User,
    ChevronRight,
    ChevronLeft,
    Check,
    Upload,
    Instagram,
    Facebook,
    Link as LinkIcon
} from 'lucide-react';
import './pages-enhanced.css';
import './Signup.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const Signup = () => {
    const navigate = useNavigate();
    const [currentSection, setCurrentSection] = useState(0);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        // Section 1: Company
        companyName: '',
        companyPhone: '',
        companyAddress: '',
        companyCountry: '',
        zipCode: '',
        taxId: '',
        tinNumber: '',
        vatNumber: '',
        registrationCertificate: null,

        // Section 2: Bank
        bankName: '',
        bankAddress: '',
        bankCountry: '',
        bankIban: '',

        // Section 3: CEO Details
        ceoName: '',
        ceoPhone: '',
        ceoEmail: '',

        // Section 4: Contact Person Sale Detail
        salesName: '',
        salesEmail: '',
        salesPhone: '',

        // Section 5: Person Purchase Details
        purchaseName: '',
        purchaseEmail: '',
        purchasePhone: '',

        // Section 6: Logistic Manager Detail
        logisticName: '',
        logisticPhone: '',

        // Section 7: Personal Information
        personalName: '',
        personalEmail: '',
        personalPhone: '',
        marketingOptIn: false,
    });

    const sections = [
        { icon: Building2, title: 'Company', subtitle: 'Business Information' },
        { icon: FileText, title: 'Bank', subtitle: 'Banking Details' },
        { icon: User, title: 'CEO', subtitle: 'CEO Details' },
        { icon: Users, title: 'Sales', subtitle: 'Contact Person Sale Detail' },
        { icon: ShoppingCart, title: 'Purchase', subtitle: 'Person Purchase Details' },
        { icon: Factory, title: 'Logistics', subtitle: 'Logistic Manager Detail' },
        { icon: User, title: 'Personal', subtitle: 'Personal Information' },
    ];

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setFormData(prev => ({ ...prev, businessLicense: file }));
    };

    const handleNext = () => {
        if (currentSection < sections.length - 1) {
            setCurrentSection(prev => prev + 1);
        }
    };

    const handlePrev = () => {
        if (currentSection > 0) {
            setCurrentSection(prev => prev - 1);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Map frontend state to backend requirements
            const payload = {
                ...formData,
                email: formData.personalEmail, // API expects 'email' from personal email
                companyAddr: formData.companyAddress, // Map to model field
                country: formData.companyCountry, // Map to model field
                tinNumber: formData.tinNumber,
                vatNumber: formData.vatNumber,
            };

            const res = await fetch(`${API_BASE}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();

            if (!res.ok) {
                if (data.fields) {
                    // Extract first Zod error message to show user
                    const fieldErrorKeys = Object.keys(data.fields).filter(k => k !== '_errors');
                    if (fieldErrorKeys.length > 0 && data.fields[fieldErrorKeys[0]]._errors) {
                        throw new Error(`Validation Error: ${data.fields[fieldErrorKeys[0]]._errors[0]}`);
                    }
                }
                throw new Error(data.error || 'Registration failed');
            }

            alert('Registration submitted successfully! You will receive an email once your account is approved.');
            navigate('/login');
        } catch (error) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    const renderSection = () => {
        switch (currentSection) {
            case 0:
                return (
                    <div className="form-section animate-fade-in-up">
                        <div className="section-header">
                            <Building2 size={28} className="section-icon" />
                            <div>
                                <h2>Company Details</h2>
                                <p>Provide your business information</p>
                            </div>
                        </div>
                        <div className="form-grid">
                            <div className="form-group full-width">
                                <label>Company Name *</label>
                                <input
                                    type="text"
                                    name="companyName"
                                    value={formData.companyName}
                                    onChange={handleInputChange}
                                    className="enhanced-input"
                                    placeholder="Enter company name"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Company Phone Number *</label>
                                <input
                                    type="tel"
                                    name="companyPhone"
                                    value={formData.companyPhone}
                                    onChange={handleInputChange}
                                    className="enhanced-input"
                                    placeholder="Enter phone number"
                                    required
                                />
                            </div>
                            <div className="form-group full-width">
                                <label>Company Address (Billing Address) *</label>
                                <input
                                    type="text"
                                    name="companyAddress"
                                    value={formData.companyAddress}
                                    onChange={handleInputChange}
                                    className="enhanced-input"
                                    placeholder="Enter billing address"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Company Country *</label>
                                <input
                                    type="text"
                                    name="companyCountry"
                                    value={formData.companyCountry}
                                    onChange={handleInputChange}
                                    className="enhanced-input"
                                    placeholder="Enter country"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Zip Code *</label>
                                <input
                                    type="text"
                                    name="zipCode"
                                    value={formData.zipCode}
                                    onChange={handleInputChange}
                                    className="enhanced-input"
                                    placeholder="Enter zip code"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Tax ID / Business ID</label>
                                <input
                                    type="text"
                                    name="taxId"
                                    value={formData.taxId}
                                    onChange={handleInputChange}
                                    className="enhanced-input"
                                    placeholder="Enter tax ID"
                                />
                            </div>
                            <div className="form-group">
                                <label>TIN Number *</label>
                                <input
                                    type="text"
                                    name="tinNumber"
                                    value={formData.tinNumber}
                                    onChange={handleInputChange}
                                    className="enhanced-input"
                                    placeholder="Enter TIN Number"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>VAT Number * (e.g. DE123456789)</label>
                                <input
                                    type="text"
                                    name="vatNumber"
                                    value={formData.vatNumber}
                                    onChange={handleInputChange}
                                    className="enhanced-input"
                                    placeholder="Enter VAT"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Registration Certificate *</label>
                                <div className="file-upload-wrapper">
                                    <input
                                        type="file"
                                        id="registrationCertificate"
                                        name="registrationCertificate"
                                        onChange={handleFileChange}
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        className="file-input"
                                        required
                                    />
                                    <label htmlFor="registrationCertificate" className="file-upload-btn">
                                        <Upload size={20} />
                                        <span>{formData.registrationCertificate ? formData.registrationCertificate.name : 'Choose file'}</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 1:
                return (
                    <div className="form-section animate-fade-in-up">
                        <div className="section-header">
                            <FileText size={28} className="section-icon" />
                            <div>
                                <h2>Bank Details</h2>
                                <p>Provide your banking information</p>
                            </div>
                        </div>
                        <div className="form-grid">
                            <div className="form-group full-width">
                                <label>Bank Name *</label>
                                <input
                                    type="text"
                                    name="bankName"
                                    value={formData.bankName}
                                    onChange={handleInputChange}
                                    className="enhanced-input"
                                    placeholder="Enter bank name"
                                    required
                                />
                            </div>
                            <div className="form-group full-width">
                                <label>Bank Address *</label>
                                <input
                                    type="text"
                                    name="bankAddress"
                                    value={formData.bankAddress}
                                    onChange={handleInputChange}
                                    className="enhanced-input"
                                    placeholder="Enter bank address"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Bank Country *</label>
                                <input
                                    type="text"
                                    name="bankCountry"
                                    value={formData.bankCountry}
                                    onChange={handleInputChange}
                                    className="enhanced-input"
                                    placeholder="Enter bank country"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>IBAN *</label>
                                <input
                                    type="text"
                                    name="bankIban"
                                    value={formData.bankIban}
                                    onChange={handleInputChange}
                                    className="enhanced-input"
                                    placeholder="Enter IBAN"
                                    required
                                />
                            </div>
                        </div>
                    </div>
                );

            case 2:
                return (
                    <div className="form-section animate-fade-in-up">
                        <div className="section-header">
                            <User size={28} className="section-icon" />
                            <div>
                                <h2>CEO Details</h2>
                                <p>Information about the CEO</p>
                            </div>
                        </div>
                        <div className="form-grid">
                            <div className="form-group full-width">
                                <label>CEO Name *</label>
                                <input
                                    type="text"
                                    name="ceoName"
                                    value={formData.ceoName}
                                    onChange={handleInputChange}
                                    className="enhanced-input"
                                    placeholder="Enter CEO name"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>CEO Phone Number *</label>
                                <input
                                    type="tel"
                                    name="ceoPhone"
                                    value={formData.ceoPhone}
                                    onChange={handleInputChange}
                                    className="enhanced-input"
                                    placeholder="Enter phone number"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>CEO Email *</label>
                                <input
                                    type="email"
                                    name="ceoEmail"
                                    value={formData.ceoEmail}
                                    onChange={handleInputChange}
                                    className="enhanced-input"
                                    placeholder="Enter email address"
                                    required
                                />
                            </div>
                        </div>
                    </div>
                );

            case 3:
                return (
                    <div className="form-section animate-fade-in-up">
                        <div className="section-header">
                            <Users size={28} className="section-icon" />
                            <div>
                                <h2>Contact Person Sale Detail</h2>
                                <p>Primary contact for sales</p>
                            </div>
                        </div>
                        <div className="form-grid">
                            <div className="form-group full-width">
                                <label>Name *</label>
                                <input
                                    type="text"
                                    name="salesName"
                                    value={formData.salesName}
                                    onChange={handleInputChange}
                                    className="enhanced-input"
                                    placeholder="Enter name"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Email *</label>
                                <input
                                    type="email"
                                    name="salesEmail"
                                    value={formData.salesEmail}
                                    onChange={handleInputChange}
                                    className="enhanced-input"
                                    placeholder="Enter email"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Phone number *</label>
                                <input
                                    type="tel"
                                    name="salesPhone"
                                    value={formData.salesPhone}
                                    onChange={handleInputChange}
                                    className="enhanced-input"
                                    placeholder="Enter phone number"
                                    required
                                />
                            </div>
                        </div>
                    </div>
                );

            case 4:
                return (
                    <div className="form-section animate-fade-in-up">
                        <div className="section-header">
                            <ShoppingCart size={28} className="section-icon" />
                            <div>
                                <h2>Person Purchase Details</h2>
                                <p>Contact for purchasing</p>
                            </div>
                        </div>
                        <div className="form-grid">
                            <div className="form-group full-width">
                                <label>Name *</label>
                                <input
                                    type="text"
                                    name="purchaseName"
                                    value={formData.purchaseName}
                                    onChange={handleInputChange}
                                    className="enhanced-input"
                                    placeholder="Enter name"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Email *</label>
                                <input
                                    type="email"
                                    name="purchaseEmail"
                                    value={formData.purchaseEmail}
                                    onChange={handleInputChange}
                                    className="enhanced-input"
                                    placeholder="Enter email"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Phone number *</label>
                                <input
                                    type="tel"
                                    name="purchasePhone"
                                    value={formData.purchasePhone}
                                    onChange={handleInputChange}
                                    className="enhanced-input"
                                    placeholder="Enter phone number"
                                    required
                                />
                            </div>
                        </div>
                    </div>
                );

            case 5:
                return (
                    <div className="form-section animate-fade-in-up">
                        <div className="section-header">
                            <Factory size={28} className="section-icon" />
                            <div>
                                <h2>Logistic Manager Detail</h2>
                                <p>Contact for logistics</p>
                            </div>
                        </div>
                        <div className="form-grid">
                            <div className="form-group full-width">
                                <label>Name *</label>
                                <input
                                    type="text"
                                    name="logisticName"
                                    value={formData.logisticName}
                                    onChange={handleInputChange}
                                    className="enhanced-input"
                                    placeholder="Enter name"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Phone number *</label>
                                <input
                                    type="tel"
                                    name="logisticPhone"
                                    value={formData.logisticPhone}
                                    onChange={handleInputChange}
                                    className="enhanced-input"
                                    placeholder="Enter phone number"
                                    required
                                />
                            </div>
                        </div>
                    </div>
                );

            case 6:
                return (
                    <div className="form-section animate-fade-in-up">
                        <div className="section-header">
                            <User size={28} className="section-icon" />
                            <div>
                                <h2>Personal Information</h2>
                                <p>Individual contact information</p>
                            </div>
                        </div>
                        <div className="form-grid">
                            <div className="form-group full-width">
                                <label>Name *</label>
                                <input
                                    type="text"
                                    name="personalName"
                                    value={formData.personalName}
                                    onChange={handleInputChange}
                                    className="enhanced-input"
                                    placeholder="Enter name"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Email *</label>
                                <input
                                    type="email"
                                    name="personalEmail"
                                    value={formData.personalEmail}
                                    onChange={handleInputChange}
                                    className="enhanced-input"
                                    placeholder="Enter email"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Phone number *</label>
                                <input
                                    type="tel"
                                    name="personalPhone"
                                    value={formData.personalPhone}
                                    onChange={handleInputChange}
                                    className="enhanced-input"
                                    placeholder="Enter phone number"
                                    required
                                />
                            </div>
                            <div className="form-group pb-4">
                                <label className="flex items-start gap-3 cursor-pointer mt-2">
                                    <input
                                        type="checkbox"
                                        name="marketingOptIn"
                                        checked={formData.marketingOptIn}
                                        onChange={(e) => setFormData(prev => ({ ...prev, marketingOptIn: e.target.checked }))}
                                        className="mt-1 w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary"
                                    />
                                    <span className="text-sm text-gray-600 leading-snug">
                                        I agree to receive promotional emails, ads, and exclusive wholesale offers. (You can unsubscribe at any time).
                                    </span>
                                </label>
                            </div>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="signup-page">
            <div className="container mx-auto px-6 py-8">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm text-text-muted mb-8">
                    <Link to="/" className="hover:text-primary transition-colors">Home</Link>
                    <span>/</span>
                    <span>Business Registration</span>
                </div>

                {/* Header */}
                <div className="signup-header">
                    <h1>Business Registration</h1>
                    <p>Join our wholesale program and unlock exclusive benefits</p>
                </div>

                {/* Progress Indicator */}
                <div className="progress-container">
                    <div className="progress-steps">
                        {sections.map((section, index) => {
                            const Icon = section.icon;
                            return (
                                <div
                                    key={index}
                                    className={`progress-step ${index === currentSection ? 'active' : ''} ${index < currentSection ? 'completed' : ''}`}
                                    onClick={() => setCurrentSection(index)}
                                >
                                    <div className="step-icon">
                                        {index < currentSection ? <Check size={16} /> : <Icon size={16} />}
                                    </div>
                                    <span className="step-label">{section.title}</span>
                                </div>
                            );
                        })}
                    </div>
                    <div className="progress-bar">
                        <div
                            className="progress-fill"
                            style={{ width: `${((currentSection + 1) / sections.length) * 100}%` }}
                        />
                    </div>
                </div>

                {/* Form Container */}
                <form onSubmit={handleSubmit} className="signup-form-container">
                    {renderSection()}

                    {/* Navigation Buttons */}
                    <div className="form-navigation">
                        <button
                            type="button"
                            onClick={handlePrev}
                            className={`nav-btn prev-btn ${currentSection === 0 ? 'disabled' : ''}`}
                            disabled={currentSection === 0}
                        >
                            <ChevronLeft size={20} />
                            Previous
                        </button>

                        {currentSection === sections.length - 1 ? (
                            <button type="submit" disabled={loading} className="nav-btn submit-btn disabled:opacity-50">
                                {loading ? 'Submitting...' : 'Submit Application'}
                                {!loading && <Check size={20} />}
                            </button>
                        ) : (
                            <button type="button" onClick={handleNext} className="nav-btn next-btn">
                                Next Step
                                <ChevronRight size={20} />
                            </button>
                        )}
                    </div>
                </form>

                {/* Already have an account */}
                <div className="auth-link">
                    <p>
                        Already have a business account?{' '}
                        <Link to="/login" className="text-primary font-semibold hover:underline">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Signup;
