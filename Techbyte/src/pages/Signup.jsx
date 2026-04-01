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
import { register } from '../services/api';
import './pages-enhanced.css';
import './Signup.css';

const findFirstFieldError = (fields) => {
    if (!fields || typeof fields !== 'object') return null;
    if (Array.isArray(fields._errors) && fields._errors.length > 0) {
        return fields._errors[0];
    }

    for (const value of Object.values(fields)) {
        const nestedError = findFirstFieldError(value);
        if (nestedError) return nestedError;
    }

    return null;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[+0-9\s-]+$/;
const ZIP_PATTERN = /^[0-9a-zA-Z\s-]+$/;
const TIN_PATTERN = /^[A-Z0-9-]+$/;
const VAT_PATTERN = /^[A-Z]{2}[0-9A-Z]{2,15}$/;
const IBAN_PATTERN = /^[A-Z]{2}[0-9]{2}[A-Z0-9]{1,30}$/;

const FIELD_VALIDATION = {
    companyName: { label: 'Company name', required: true, minLength: 2, maxLength: 200, section: 0 },
    companyPhone: {
        label: 'Company phone number',
        required: true,
        minLength: 5,
        maxLength: 20,
        pattern: PHONE_PATTERN,
        message: 'Use only +, numbers, spaces, and hyphens.',
        inputMode: 'tel',
        section: 0,
    },
    companyAddress: { label: 'Company address', required: true, minLength: 5, maxLength: 500, section: 0 },
    companyCountry: { label: 'Company country', required: true, minLength: 2, maxLength: 100, section: 0 },
    zipCode: {
        label: 'Zip code',
        required: true,
        minLength: 2,
        maxLength: 20,
        pattern: ZIP_PATTERN,
        message: 'Use only letters, numbers, spaces, and hyphens.',
        section: 0,
    },
    taxId: { label: 'Tax ID / Business ID', maxLength: 50, section: 0 },
    tinNumber: {
        label: 'TIN number',
        minLength: 5,
        maxLength: 30,
        pattern: TIN_PATTERN,
        message: 'Use uppercase letters, numbers, and hyphens only.',
        autoCapitalize: 'characters',
        spellCheck: false,
        section: 0,
    },
    vatNumber: {
        label: 'VAT number',
        minLength: 5,
        maxLength: 20,
        pattern: VAT_PATTERN,
        message: 'Use a valid EU VAT number like DE123456789.',
        autoCapitalize: 'characters',
        spellCheck: false,
        section: 0,
    },
    bankName: { label: 'Bank name', required: true, minLength: 2, maxLength: 150, section: 1 },
    bankAddress: { label: 'Bank address', required: true, minLength: 2, maxLength: 300, section: 1 },
    bankCountry: { label: 'Bank country', required: true, minLength: 2, maxLength: 100, section: 1 },
    bankIban: {
        label: 'IBAN',
        required: true,
        minLength: 10,
        maxLength: 34,
        pattern: IBAN_PATTERN,
        message: 'Use a valid IBAN like DE89370400440532013000.',
        autoCapitalize: 'characters',
        spellCheck: false,
        section: 1,
    },
    ceoName: { label: 'CEO name', required: true, minLength: 2, maxLength: 100, section: 2 },
    ceoPhone: {
        label: 'CEO phone number',
        required: true,
        minLength: 5,
        maxLength: 20,
        pattern: PHONE_PATTERN,
        message: 'Use only +, numbers, spaces, and hyphens.',
        inputMode: 'tel',
        section: 2,
    },
    ceoEmail: {
        label: 'CEO email',
        required: true,
        maxLength: 255,
        validate: (value) => EMAIL_PATTERN.test(value),
        message: 'Enter a valid email address.',
        inputMode: 'email',
        autoCapitalize: 'none',
        spellCheck: false,
        section: 2,
    },
    salesName: { label: 'Sales contact name', required: true, minLength: 2, maxLength: 100, section: 3 },
    salesEmail: {
        label: 'Sales email',
        required: true,
        maxLength: 255,
        validate: (value) => EMAIL_PATTERN.test(value),
        message: 'Enter a valid email address.',
        inputMode: 'email',
        autoCapitalize: 'none',
        spellCheck: false,
        section: 3,
    },
    salesPhone: {
        label: 'Sales phone number',
        required: true,
        minLength: 5,
        maxLength: 20,
        pattern: PHONE_PATTERN,
        message: 'Use only +, numbers, spaces, and hyphens.',
        inputMode: 'tel',
        section: 3,
    },
    purchaseName: { label: 'Purchase contact name', required: true, minLength: 2, maxLength: 100, section: 4 },
    purchaseEmail: {
        label: 'Purchase email',
        required: true,
        maxLength: 255,
        validate: (value) => EMAIL_PATTERN.test(value),
        message: 'Enter a valid email address.',
        inputMode: 'email',
        autoCapitalize: 'none',
        spellCheck: false,
        section: 4,
    },
    purchasePhone: {
        label: 'Purchase phone number',
        required: true,
        minLength: 5,
        maxLength: 20,
        pattern: PHONE_PATTERN,
        message: 'Use only +, numbers, spaces, and hyphens.',
        inputMode: 'tel',
        section: 4,
    },
    logisticName: { label: 'Logistics contact name', required: true, minLength: 2, maxLength: 100, section: 5 },
    logisticPhone: {
        label: 'Logistics phone number',
        required: true,
        minLength: 5,
        maxLength: 20,
        pattern: PHONE_PATTERN,
        message: 'Use only +, numbers, spaces, and hyphens.',
        inputMode: 'tel',
        section: 5,
    },
    personalName: { label: 'Your name', required: true, minLength: 2, maxLength: 100, section: 6 },
    personalEmail: {
        label: 'Email',
        required: true,
        maxLength: 255,
        validate: (value) => EMAIL_PATTERN.test(value),
        message: 'Enter a valid email address.',
        inputMode: 'email',
        autoCapitalize: 'none',
        spellCheck: false,
        section: 6,
    },
    personalPhone: {
        label: 'Phone number',
        required: true,
        minLength: 5,
        maxLength: 20,
        pattern: PHONE_PATTERN,
        message: 'Use only +, numbers, spaces, and hyphens.',
        inputMode: 'tel',
        section: 6,
    },
};

const SECTION_FIELDS = [
    ['companyName', 'companyPhone', 'companyAddress', 'companyCountry', 'zipCode', 'taxId', 'tinNumber', 'vatNumber'],
    ['bankName', 'bankAddress', 'bankCountry', 'bankIban'],
    ['ceoName', 'ceoPhone', 'ceoEmail'],
    ['salesName', 'salesEmail', 'salesPhone'],
    ['purchaseName', 'purchaseEmail', 'purchasePhone'],
    ['logisticName', 'logisticPhone'],
    ['personalName', 'personalEmail', 'personalPhone'],
];

const normalizeFieldValue = (name, value) => {
    if (typeof value !== 'string') return value;

    if (name === 'tinNumber' || name === 'vatNumber' || name === 'bankIban') {
        return value.toUpperCase().replace(/\s+/g, '');
    }

    return value;
};

const getFieldError = (fieldName, value) => {
    const rule = FIELD_VALIDATION[fieldName];
    if (!rule) return null;

    const normalizedValue = typeof value === 'string' ? value.trim() : '';

    if (rule.required && normalizedValue.length === 0) {
        return `${rule.label} is required.`;
    }

    if (normalizedValue.length === 0) {
        return null;
    }

    if (rule.minLength && normalizedValue.length < rule.minLength) {
        return `${rule.label} must be at least ${rule.minLength} characters.`;
    }

    if (rule.maxLength && normalizedValue.length > rule.maxLength) {
        return `${rule.label} must be at most ${rule.maxLength} characters.`;
    }

    if (rule.pattern && !rule.pattern.test(normalizedValue)) {
        return rule.message || `${rule.label} is invalid.`;
    }

    if (rule.validate && !rule.validate(normalizedValue)) {
        return rule.message || `${rule.label} is invalid.`;
    }

    return null;
};

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
        setFormData(prev => ({ ...prev, [name]: normalizeFieldValue(name, value) }));
    };

    const getInputValidationProps = (fieldName) => {
        const rule = FIELD_VALIDATION[fieldName];
        if (!rule) return {};

        return {
            required: Boolean(rule.required),
            minLength: rule.minLength,
            maxLength: rule.maxLength,
            pattern: rule.pattern?.source,
            title: rule.message,
            inputMode: rule.inputMode,
            autoCapitalize: rule.autoCapitalize,
            spellCheck: rule.spellCheck,
        };
    };

    const findSectionError = (sectionIndex) => {
        const fields = SECTION_FIELDS[sectionIndex] || [];

        for (const fieldName of fields) {
            const message = getFieldError(fieldName, formData[fieldName]);
            if (message) {
                return { fieldName, message };
            }
        }

        return null;
    };

    const showFieldValidation = (sectionIndex, fieldName, message) => {
        setCurrentSection(sectionIndex);

        window.setTimeout(() => {
            const input = document.querySelector(`[name="${fieldName}"]`);

            if (!input) {
                alert(message);
                return;
            }

            input.focus();
            input.setCustomValidity(message);
            input.reportValidity();

            const clearMessage = () => input.setCustomValidity('');
            input.addEventListener('input', clearMessage, { once: true });
            input.addEventListener('change', clearMessage, { once: true });
        }, 0);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setFormData(prev => ({ ...prev, registrationCertificate: file }));
    };

    const handleNext = () => {
        const sectionError = findSectionError(currentSection);
        if (sectionError) {
            showFieldValidation(currentSection, sectionError.fieldName, sectionError.message);
            return;
        }

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

        for (let sectionIndex = 0; sectionIndex < SECTION_FIELDS.length; sectionIndex += 1) {
            const sectionError = findSectionError(sectionIndex);
            if (sectionError) {
                showFieldValidation(sectionIndex, sectionError.fieldName, sectionError.message);
                return;
            }
        }

        setLoading(true);
        try {
            const payload = {
                email: formData.personalEmail.trim().toLowerCase(),
                companyName: formData.companyName.trim(),
                companyPhone: formData.companyPhone.trim(),
                companyAddr: formData.companyAddress.trim(),
                country: formData.companyCountry.trim(),
                zipCode: formData.zipCode.trim(),
                taxId: formData.taxId.trim(),
                tinNumber: formData.tinNumber.trim() || undefined,
                vatNumber: formData.vatNumber.trim() || undefined,
                bankName: formData.bankName.trim(),
                bankAddress: formData.bankAddress.trim(),
                bankCountry: formData.bankCountry.trim(),
                bankIban: formData.bankIban.trim(),
                ceoName: formData.ceoName.trim(),
                ceoPhone: formData.ceoPhone.trim(),
                ceoEmail: formData.ceoEmail.trim().toLowerCase(),
                salesName: formData.salesName.trim(),
                salesEmail: formData.salesEmail.trim().toLowerCase(),
                salesPhone: formData.salesPhone.trim(),
                purchaseName: formData.purchaseName.trim(),
                purchaseEmail: formData.purchaseEmail.trim().toLowerCase(),
                purchasePhone: formData.purchasePhone.trim(),
                logisticName: formData.logisticName.trim(),
                logisticPhone: formData.logisticPhone.trim(),
                personalName: formData.personalName.trim(),
                personalPhone: formData.personalPhone.trim(),
                marketingOptIn: formData.marketingOptIn,
            };

            const data = await register(payload);
            navigate('/registration-pending', {
                state: {
                    companyName: payload.companyName,
                    email: payload.email,
                    message: data.message,
                },
            });
        } catch (error) {
            alert(findFirstFieldError(error.fields) || error.message);
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
                                    {...getInputValidationProps('companyName')}
                                    className="enhanced-input"
                                    placeholder="Enter company name"
                                />
                            </div>
                            <div className="form-group">
                                <label>Company Phone Number *</label>
                                <input
                                    type="tel"
                                    name="companyPhone"
                                    value={formData.companyPhone}
                                    onChange={handleInputChange}
                                    {...getInputValidationProps('companyPhone')}
                                    className="enhanced-input"
                                    placeholder="Enter phone number"
                                />
                            </div>
                            <div className="form-group full-width">
                                <label>Company Address (Billing Address) *</label>
                                <input
                                    type="text"
                                    name="companyAddress"
                                    value={formData.companyAddress}
                                    onChange={handleInputChange}
                                    {...getInputValidationProps('companyAddress')}
                                    className="enhanced-input"
                                    placeholder="Enter billing address"
                                />
                            </div>
                            <div className="form-group">
                                <label>Company Country *</label>
                                <input
                                    type="text"
                                    name="companyCountry"
                                    value={formData.companyCountry}
                                    onChange={handleInputChange}
                                    {...getInputValidationProps('companyCountry')}
                                    className="enhanced-input"
                                    placeholder="Enter country"
                                />
                            </div>
                            <div className="form-group">
                                <label>Zip Code *</label>
                                <input
                                    type="text"
                                    name="zipCode"
                                    value={formData.zipCode}
                                    onChange={handleInputChange}
                                    {...getInputValidationProps('zipCode')}
                                    className="enhanced-input"
                                    placeholder="Enter zip code"
                                />
                            </div>
                            <div className="form-group">
                                <label>Tax ID / Business ID</label>
                                <input
                                    type="text"
                                    name="taxId"
                                    value={formData.taxId}
                                    onChange={handleInputChange}
                                    {...getInputValidationProps('taxId')}
                                    className="enhanced-input"
                                    placeholder="Enter tax ID"
                                />
                            </div>
                            <div className="form-group">
                                <label>TIN Number</label>
                                <input
                                    type="text"
                                    name="tinNumber"
                                    value={formData.tinNumber}
                                    onChange={handleInputChange}
                                    {...getInputValidationProps('tinNumber')}
                                    className="enhanced-input"
                                    placeholder="Enter TIN Number"
                                />
                            </div>
                            <div className="form-group">
                                <label>VAT Number (e.g. DE123456789)</label>
                                <input
                                    type="text"
                                    name="vatNumber"
                                    value={formData.vatNumber}
                                    onChange={handleInputChange}
                                    {...getInputValidationProps('vatNumber')}
                                    className="enhanced-input"
                                    placeholder="Enter VAT"
                                />
                            </div>
                            <div className="form-group">
                                <label>Registration Certificate</label>
                                <div className="file-upload-wrapper">
                                    <input
                                        type="file"
                                        id="registrationCertificate"
                                        name="registrationCertificate"
                                        onChange={handleFileChange}
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        className="file-input"
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
                                    {...getInputValidationProps('bankName')}
                                    className="enhanced-input"
                                    placeholder="Enter bank name"
                                />
                            </div>
                            <div className="form-group full-width">
                                <label>Bank Address *</label>
                                <input
                                    type="text"
                                    name="bankAddress"
                                    value={formData.bankAddress}
                                    onChange={handleInputChange}
                                    {...getInputValidationProps('bankAddress')}
                                    className="enhanced-input"
                                    placeholder="Enter bank address"
                                />
                            </div>
                            <div className="form-group">
                                <label>Bank Country *</label>
                                <input
                                    type="text"
                                    name="bankCountry"
                                    value={formData.bankCountry}
                                    onChange={handleInputChange}
                                    {...getInputValidationProps('bankCountry')}
                                    className="enhanced-input"
                                    placeholder="Enter bank country"
                                />
                            </div>
                            <div className="form-group">
                                <label>IBAN *</label>
                                <input
                                    type="text"
                                    name="bankIban"
                                    value={formData.bankIban}
                                    onChange={handleInputChange}
                                    {...getInputValidationProps('bankIban')}
                                    className="enhanced-input"
                                    placeholder="Enter IBAN"
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
                                    {...getInputValidationProps('ceoName')}
                                    className="enhanced-input"
                                    placeholder="Enter CEO name"
                                />
                            </div>
                            <div className="form-group">
                                <label>CEO Phone Number *</label>
                                <input
                                    type="tel"
                                    name="ceoPhone"
                                    value={formData.ceoPhone}
                                    onChange={handleInputChange}
                                    {...getInputValidationProps('ceoPhone')}
                                    className="enhanced-input"
                                    placeholder="Enter phone number"
                                />
                            </div>
                            <div className="form-group">
                                <label>CEO Email *</label>
                                <input
                                    type="email"
                                    name="ceoEmail"
                                    value={formData.ceoEmail}
                                    onChange={handleInputChange}
                                    {...getInputValidationProps('ceoEmail')}
                                    className="enhanced-input"
                                    placeholder="Enter email address"
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
                                    {...getInputValidationProps('salesName')}
                                    className="enhanced-input"
                                    placeholder="Enter name"
                                />
                            </div>
                            <div className="form-group">
                                <label>Email *</label>
                                <input
                                    type="email"
                                    name="salesEmail"
                                    value={formData.salesEmail}
                                    onChange={handleInputChange}
                                    {...getInputValidationProps('salesEmail')}
                                    className="enhanced-input"
                                    placeholder="Enter email"
                                />
                            </div>
                            <div className="form-group">
                                <label>Phone number *</label>
                                <input
                                    type="tel"
                                    name="salesPhone"
                                    value={formData.salesPhone}
                                    onChange={handleInputChange}
                                    {...getInputValidationProps('salesPhone')}
                                    className="enhanced-input"
                                    placeholder="Enter phone number"
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
                                    {...getInputValidationProps('purchaseName')}
                                    className="enhanced-input"
                                    placeholder="Enter name"
                                />
                            </div>
                            <div className="form-group">
                                <label>Email *</label>
                                <input
                                    type="email"
                                    name="purchaseEmail"
                                    value={formData.purchaseEmail}
                                    onChange={handleInputChange}
                                    {...getInputValidationProps('purchaseEmail')}
                                    className="enhanced-input"
                                    placeholder="Enter email"
                                />
                            </div>
                            <div className="form-group">
                                <label>Phone number *</label>
                                <input
                                    type="tel"
                                    name="purchasePhone"
                                    value={formData.purchasePhone}
                                    onChange={handleInputChange}
                                    {...getInputValidationProps('purchasePhone')}
                                    className="enhanced-input"
                                    placeholder="Enter phone number"
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
                                    {...getInputValidationProps('logisticName')}
                                    className="enhanced-input"
                                    placeholder="Enter name"
                                />
                            </div>
                            <div className="form-group">
                                <label>Phone number *</label>
                                <input
                                    type="tel"
                                    name="logisticPhone"
                                    value={formData.logisticPhone}
                                    onChange={handleInputChange}
                                    {...getInputValidationProps('logisticPhone')}
                                    className="enhanced-input"
                                    placeholder="Enter phone number"
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
                                    {...getInputValidationProps('personalName')}
                                    className="enhanced-input"
                                    placeholder="Enter name"
                                />
                            </div>
                            <div className="form-group">
                                <label>Email *</label>
                                <input
                                    type="email"
                                    name="personalEmail"
                                    value={formData.personalEmail}
                                    onChange={handleInputChange}
                                    {...getInputValidationProps('personalEmail')}
                                    className="enhanced-input"
                                    placeholder="Enter email"
                                />
                            </div>
                            <div className="form-group">
                                <label>Phone number *</label>
                                <input
                                    type="tel"
                                    name="personalPhone"
                                    value={formData.personalPhone}
                                    onChange={handleInputChange}
                                    {...getInputValidationProps('personalPhone')}
                                    className="enhanced-input"
                                    placeholder="Enter phone number"
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
