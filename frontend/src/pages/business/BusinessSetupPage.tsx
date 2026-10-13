import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { DashboardLayout } from '../../components/DashboardLayout.js';
import api from '../../api/client.js';
import { IBusinessCategory, IBusinessType } from '../../types/index.js';
import {
  Building2,
  Check,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Sparkles,
  Layers,
  Briefcase,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  ArrowRight,
  Store,
  DollarSign,
  Calendar,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface BusinessFormData {
  name: string;
  categoryId: string;
  businessTypeId: string;
  customBusinessType: string;
  description: string;
  email: string;
  phone: string;
  address: string;
  website: string;
  logo: string;
  employeeCount: number;
  customerCount: number;
  mainServices: string;
  productsSold: string;
  onlineBookingRequired: boolean;
  onlinePaymentsRequired: boolean;
}

const STORAGE_KEY = 'flexora_business_setup_draft';

export function BusinessSetupPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [step, setStep] = useState<number>(() => {
    return location.pathname.endsWith('/review') ? 3 : 1;
  });

  useEffect(() => {
    if (location.pathname.endsWith('/review')) {
      setStep(3);
    }
  }, [location.pathname]);
  const [categories, setCategories] = useState<IBusinessCategory[]>([]);
  const [types, setTypes] = useState<IBusinessType[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isLoadingTypes, setIsLoadingTypes] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<BusinessFormData>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // Ignore
    }
    return {
      name: '',
      categoryId: '',
      businessTypeId: '',
      customBusinessType: '',
      description: '',
      email: '',
      phone: '',
      address: '',
      website: '',
      logo: '',
      employeeCount: 1,
      customerCount: 10,
      mainServices: '',
      productsSold: '',
      onlineBookingRequired: false,
      onlinePaymentsRequired: false,
    };
  });

  // Save draft to localStorage on changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
    } catch {
      // Ignore
    }
  }, [formData]);

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoadingCategories(true);
        const res = await api.get('/business-categories');
        if (res.data?.data?.categories) {
          setCategories(res.data.data.categories);
        }
      } catch (err: any) {
        toast.error('Failed to load business categories');
      } finally {
        setIsLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  // Fetch business types when category changes
  useEffect(() => {
    if (!formData.categoryId) {
      setTypes([]);
      return;
    }

    const fetchTypes = async () => {
      try {
        setIsLoadingTypes(true);
        const res = await api.get(`/business-categories/${formData.categoryId}/types`);
        if (res.data?.data?.types) {
          setTypes(res.data.data.types);
        }
      } catch (err: any) {
        toast.error('Failed to load business types');
      } finally {
        setIsLoadingTypes(false);
      }
    };

    fetchTypes();
  }, [formData.categoryId]);

  const selectedCategory = categories.find((c) => c.id === formData.categoryId);
  const selectedType = types.find((t) => t.id === formData.businessTypeId);

  const isCustomTypeRequired =
    selectedType?.isCustom ||
    selectedCategory?.name.toLowerCase().includes('other') ||
    selectedCategory?.name.toLowerCase().includes('custom') ||
    formData.businessTypeId === 'custom';

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      newErrors.name = 'Business name must be at least 2 characters long';
    }
    if (!formData.categoryId) {
      newErrors.categoryId = 'Please select a business category';
    }
    if (!formData.businessTypeId) {
      newErrors.businessTypeId = 'Please select a business type';
    }
    if (isCustomTypeRequired && !formData.customBusinessType.trim()) {
      newErrors.customBusinessType = 'Please specify your custom business type';
    }
    if (!formData.description.trim() || formData.description.trim().length < 10) {
      newErrors.description = 'Please provide a description with at least 10 characters';
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (formData.website && !/^https?:\/\//i.test(formData.website)) {
      newErrors.website = 'Website must start with http:// or https://';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};
    if (formData.employeeCount < 0) {
      newErrors.employeeCount = 'Employee count cannot be negative';
    }
    if (formData.customerCount < 0) {
      newErrors.customerCount = 'Customer count cannot be negative';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 1) {
      if (validateStep1()) setStep(2);
    } else if (step === 2) {
      if (validateStep2()) {
        setStep(3);
        navigate('/business/setup/review');
      }
    }
  };

  const handleBack = () => {
    if (step === 3) {
      setStep(2);
      navigate('/business/setup');
    } else if (step > 1) {
      setStep(step - 1);
    }
  };

  const goToStep = (targetStep: number) => {
    if (targetStep === 1) {
      setStep(1);
      if (location.pathname.endsWith('/review')) {
        navigate('/business/setup');
      }
    } else if (targetStep === 2) {
      if (validateStep1()) {
        setStep(2);
        if (location.pathname.endsWith('/review')) {
          navigate('/business/setup');
        }
      }
    } else if (targetStep === 3) {
      if (validateStep1() && validateStep2()) {
        setStep(3);
        navigate('/business/setup/review');
      }
    }
  };

  const handleSubmit = async () => {
    if (!validateStep1() || !validateStep2()) {
      toast.error('Please check for validation errors before submitting');
      return;
    }

    try {
      setIsSubmitting(true);

      const payload = {
        name: formData.name.trim(),
        categoryId: formData.categoryId,
        businessTypeId: formData.businessTypeId !== 'custom' ? formData.businessTypeId : null,
        customBusinessType: isCustomTypeRequired ? formData.customBusinessType.trim() : null,
        description: formData.description.trim(),
        email: formData.email.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        address: formData.address.trim() || undefined,
        website: formData.website.trim() || undefined,
        logo: formData.logo.trim() || undefined,
        employeeCount: Number(formData.employeeCount) || 0,
        customerCount: Number(formData.customerCount) || 0,
        mainServices: formData.mainServices
          ? formData.mainServices.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
        productsSold: formData.productsSold
          ? formData.productsSold.split(',').map((p) => p.trim()).filter(Boolean)
          : [],
        onlineBookingRequired: formData.onlineBookingRequired,
        onlinePaymentsRequired: formData.onlinePaymentsRequired,
      };

      const response = await api.post('/businesses', payload);
      toast.success('Business registered successfully!');
      localStorage.removeItem(STORAGE_KEY);

      navigate('/business/dashboard', { replace: true });
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to register business';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div style={{ maxWidth: '840px', margin: '0 auto', paddingBottom: '40px' }}>
        {/* Header */}
        <div style={{ marginBottom: '28px' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary)', letterSpacing: '1px', textTransform: 'uppercase' }}>
            Multi-Tenant Onboarding
          </span>
          <h1 style={{ fontSize: '28px', marginTop: '4px', marginBottom: '8px' }}>
            Register Your Business
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Provide your business identity and operational preferences so Flexora can customize your workspace.
          </p>
        </div>

        {/* Multi-Step Wizard Indicator */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'white',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            padding: '16px 24px',
            marginBottom: '28px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          {/* Step 1 */}
          <div
            onClick={() => goToStep(1)}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: step >= 1 ? 'var(--primary)' : '#E5E7EB',
                color: step >= 1 ? 'white' : '#6B7280',
                display: 'grid',
                placeItems: 'center',
                fontWeight: 700,
                fontSize: '13px',
              }}
            >
              {step > 1 ? <Check size={16} /> : '1'}
            </div>
            <div>
              <small style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', fontWeight: 700 }}>
                Step 1
              </small>
              <span style={{ fontSize: '13px', fontWeight: step === 1 ? 700 : 500, color: step === 1 ? 'var(--dark-green)' : 'inherit' }}>
                Business Details
              </span>
            </div>
          </div>

          <div style={{ flex: 1, height: '2px', background: step > 1 ? 'var(--primary)' : 'var(--border-color)', margin: '0 16px' }} />

          {/* Step 2 */}
          <div
            onClick={() => goToStep(2)}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: step >= 2 ? 'var(--primary)' : '#E5E7EB',
                color: step >= 2 ? 'white' : '#6B7280',
                display: 'grid',
                placeItems: 'center',
                fontWeight: 700,
                fontSize: '13px',
              }}
            >
              {step > 2 ? <Check size={16} /> : '2'}
            </div>
            <div>
              <small style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', fontWeight: 700 }}>
                Step 2
              </small>
              <span style={{ fontSize: '13px', fontWeight: step === 2 ? 700 : 500, color: step === 2 ? 'var(--dark-green)' : 'inherit' }}>
                Operations
              </span>
            </div>
          </div>

          <div style={{ flex: 1, height: '2px', background: step > 2 ? 'var(--primary)' : 'var(--border-color)', margin: '0 16px' }} />

          {/* Step 3 */}
          <div
            onClick={() => goToStep(3)}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: step === 3 ? 'var(--primary)' : '#E5E7EB',
                color: step === 3 ? 'white' : '#6B7280',
                display: 'grid',
                placeItems: 'center',
                fontWeight: 700,
                fontSize: '13px',
              }}
            >
              3
            </div>
            <div>
              <small style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', fontWeight: 700 }}>
                Step 3
              </small>
              <span style={{ fontSize: '13px', fontWeight: step === 3 ? 700 : 500, color: step === 3 ? 'var(--dark-green)' : 'inherit' }}>
                Review & Confirm
              </span>
            </div>
          </div>
        </div>

        {/* STEP 1: BUSINESS DETAILS */}
        {step === 1 && (
          <div className="card">
            <h3 style={{ fontSize: '18px', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Building2 size={20} color="var(--primary)" />
              <span>Core Business Identity</span>
            </h3>

            <div className="form-group">
              <label className="form-label" htmlFor="businessName">
                Business Name <span style={{ color: 'var(--error)' }}>*</span>
              </label>
              <input
                id="businessName"
                type="text"
                className={`form-input ${errors.name ? 'form-input-error' : ''}`}
                placeholder="e.g., Apex Financial Advisory"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
              {errors.name && <div className="form-error">{errors.name}</div>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {/* Category Selection */}
              <div className="form-group">
                <label className="form-label" htmlFor="categoryId">
                  Business Category <span style={{ color: 'var(--error)' }}>*</span>
                </label>
                {isLoadingCategories ? (
                  <div style={{ padding: '10px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    Loading categories...
                  </div>
                ) : (
                  <select
                    id="categoryId"
                    className={`form-input ${errors.categoryId ? 'form-input-error' : ''}`}
                    value={formData.categoryId}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        categoryId: e.target.value,
                        businessTypeId: '', // Reset type when category changes
                      });
                    }}
                  >
                    <option value="">-- Choose Category --</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                )}
                {errors.categoryId && <div className="form-error">{errors.categoryId}</div>}
              </div>

              {/* Business Type Selection */}
              <div className="form-group">
                <label className="form-label" htmlFor="businessTypeId">
                  Business Type <span style={{ color: 'var(--error)' }}>*</span>
                </label>
                {!formData.categoryId ? (
                  <select className="form-input" disabled>
                    <option>Select a category first</option>
                  </select>
                ) : isLoadingTypes ? (
                  <div style={{ padding: '10px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    Loading types...
                  </div>
                ) : (
                  <select
                    id="businessTypeId"
                    className={`form-input ${errors.businessTypeId ? 'form-input-error' : ''}`}
                    value={formData.businessTypeId}
                    onChange={(e) => setFormData({ ...formData, businessTypeId: e.target.value })}
                  >
                    <option value="">-- Choose Business Type --</option>
                    {types.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                    <option value="custom">Other / Custom Business Type</option>
                  </select>
                )}
                {errors.businessTypeId && <div className="form-error">{errors.businessTypeId}</div>}
              </div>
            </div>

            {/* Conditional Custom Business Type */}
            {isCustomTypeRequired && (
              <div
                className="form-group"
                style={{
                  background: 'var(--light-green)',
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                }}
              >
                <label className="form-label" htmlFor="customBusinessType" style={{ color: 'var(--dark-green)' }}>
                  Custom Business Type <span style={{ color: 'var(--error)' }}>*</span>
                </label>
                <input
                  id="customBusinessType"
                  type="text"
                  className={`form-input ${errors.customBusinessType ? 'form-input-error' : ''}`}
                  placeholder="e.g., Drone Photography & Mapping Studio"
                  value={formData.customBusinessType}
                  onChange={(e) => setFormData({ ...formData, customBusinessType: e.target.value })}
                />
                <small style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', display: 'block' }}>
                  Provide your specific niche so Flexora can customize your taxonomy.
                </small>
                {errors.customBusinessType && <div className="form-error">{errors.customBusinessType}</div>}
              </div>
            )}

            {/* Description */}
            <div className="form-group">
              <label className="form-label" htmlFor="description">
                Business Description <span style={{ color: 'var(--error)' }}>*</span>
              </label>
              <textarea
                id="description"
                className={`form-input ${errors.description ? 'form-input-error' : ''}`}
                rows={4}
                placeholder="Describe your business, main target market, and value proposition..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
              {errors.description && <div className="form-error">{errors.description}</div>}
            </div>

            {/* Contact Details (Optional) */}
            <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--border-color)' }}>
              <h4 style={{ fontSize: '15px', marginBottom: '14px', color: 'var(--dark-green)' }}>
                Contact & Online Presence (Optional)
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="email">Business Email</label>
                  <input
                    id="email"
                    type="email"
                    className={`form-input ${errors.email ? 'form-input-error' : ''}`}
                    placeholder="contact@business.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                  {errors.email && <div className="form-error">{errors.email}</div>}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="phone">Phone Number</label>
                  <input
                    id="phone"
                    type="tel"
                    className="form-input"
                    placeholder="+1 (555) 000-0000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="address">Physical Address</label>
                  <input
                    id="address"
                    type="text"
                    className="form-input"
                    placeholder="123 Commerce St, Suite 400"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="website">Existing Website URL</label>
                  <input
                    id="website"
                    type="url"
                    className={`form-input ${errors.website ? 'form-input-error' : ''}`}
                    placeholder="https://mybusiness.com"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  />
                  {errors.website && <div className="form-error">{errors.website}</div>}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button type="button" onClick={handleNext} className="btn btn-primary">
                <span>Continue to Operations</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: BUSINESS INFORMATION */}
        {step === 2 && (
          <div className="card">
            <h3 style={{ fontSize: '18px', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Briefcase size={20} color="var(--primary)" />
              <span>Operations & Scope (Optional)</span>
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="employeeCount">Approximate Number of Employees</label>
                <input
                  id="employeeCount"
                  type="number"
                  min="0"
                  className={`form-input ${errors.employeeCount ? 'form-input-error' : ''}`}
                  value={formData.employeeCount}
                  onChange={(e) => setFormData({ ...formData, employeeCount: Math.max(0, parseInt(e.target.value) || 0) })}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="customerCount">Estimated Monthly Customers</label>
                <input
                  id="customerCount"
                  type="number"
                  min="0"
                  className={`form-input ${errors.customerCount ? 'form-input-error' : ''}`}
                  value={formData.customerCount}
                  onChange={(e) => setFormData({ ...formData, customerCount: Math.max(0, parseInt(e.target.value) || 0) })}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="mainServices">
                Main Services Offered (Comma-separated)
              </label>
              <input
                id="mainServices"
                type="text"
                className="form-input"
                placeholder="e.g., Financial Auditing, Tax Strategy, Payroll"
                value={formData.mainServices}
                onChange={(e) => setFormData({ ...formData, mainServices: e.target.value })}
              />
              <small style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', display: 'block' }}>
                Separate each service with a comma.
              </small>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="productsSold">
                Products Sold (Comma-separated)
              </label>
              <input
                id="productsSold"
                type="text"
                className="form-input"
                placeholder="e.g., Consultation Packages, Digital Guides, Subscriptions"
                value={formData.productsSold}
                onChange={(e) => setFormData({ ...formData, productsSold: e.target.value })}
              />
            </div>

            {/* Toggles */}
            <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px', background: '#FAFCFA', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Calendar size={20} color="var(--primary)" />
                  <div>
                    <b style={{ fontSize: '14px', display: 'block' }}>Online Booking / Scheduling Required?</b>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      Enables customer appointments and calendar reservation capabilities.
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={formData.onlineBookingRequired}
                  onChange={(e) => setFormData({ ...formData, onlineBookingRequired: e.target.checked })}
                  style={{ width: '20px', height: '20px', accentColor: 'var(--primary)', cursor: 'pointer' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px', background: '#FAFCFA', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <DollarSign size={20} color="var(--primary)" />
                  <div>
                    <b style={{ fontSize: '14px', display: 'block' }}>Online Payments Required?</b>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      Enables accepting card payments, invoices, and online checkout.
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={formData.onlinePaymentsRequired}
                  onChange={(e) => setFormData({ ...formData, onlinePaymentsRequired: e.target.checked })}
                  style={{ width: '20px', height: '20px', accentColor: 'var(--primary)', cursor: 'pointer' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '28px' }}>
              <button type="button" onClick={handleBack} className="btn btn-secondary">
                <ChevronLeft size={16} />
                <span>Back to Details</span>
              </button>
              <button type="button" onClick={handleNext} className="btn btn-primary">
                <span>Review Information</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: REVIEW AND CONFIRM */}
        {step === 3 && (
          <div className="card">
            <h3 style={{ fontSize: '18px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={20} color="var(--primary)" />
              <span>Review & Confirm Registration</span>
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '22px' }}>
              Verify your business details before creating your workspace. You can edit these details later.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Summary Block 1 */}
              <div style={{ padding: '18px', background: '#FBFDFB', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <b style={{ fontSize: '15px', color: 'var(--dark-green)' }}>Business Details</b>
                  <button type="button" onClick={() => goToStep(1)} className="btn btn-secondary btn-sm" style={{ padding: '4px 10px' }}>
                    Edit
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', fontSize: '13px' }}>
                  <div>
                    <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Name:</span>
                    <b>{formData.name}</b>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Category:</span>
                    <b>{selectedCategory?.name || 'N/A'}</b>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Type:</span>
                    <b>{isCustomTypeRequired ? `${formData.customBusinessType} (Custom)` : selectedType?.name || 'N/A'}</b>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Email:</span>
                    <span>{formData.email || 'Not provided'}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Phone:</span>
                    <span>{formData.phone || 'Not provided'}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Website:</span>
                    <span>{formData.website || 'Not provided'}</span>
                  </div>
                </div>
                <div style={{ marginTop: '12px', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Description:</span>
                  <p style={{ marginTop: '4px', lineHeight: 1.6 }}>{formData.description}</p>
                </div>
              </div>

              {/* Summary Block 2 */}
              <div style={{ padding: '18px', background: '#FBFDFB', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <b style={{ fontSize: '15px', color: 'var(--dark-green)' }}>Operations & Preferences</b>
                  <button type="button" onClick={() => goToStep(2)} className="btn btn-secondary btn-sm" style={{ padding: '4px 10px' }}>
                    Edit
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', fontSize: '13px' }}>
                  <div>
                    <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Employees:</span>
                    <b>{formData.employeeCount}</b>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Monthly Customers:</span>
                    <b>{formData.customerCount}</b>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Online Booking:</span>
                    <span className={`badge ${formData.onlineBookingRequired ? 'badge-active' : 'badge-inactive'}`}>
                      {formData.onlineBookingRequired ? 'Required' : 'Not required'}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Online Payments:</span>
                    <span className={`badge ${formData.onlinePaymentsRequired ? 'badge-active' : 'badge-inactive'}`}>
                      {formData.onlinePaymentsRequired ? 'Required' : 'Not required'}
                    </span>
                  </div>
                </div>
                {formData.mainServices && (
                  <div style={{ marginTop: '10px', fontSize: '13px' }}>
                    <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Main Services:</span>
                    <span>{formData.mainServices}</span>
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '28px' }}>
              <button type="button" onClick={handleBack} className="btn btn-secondary" disabled={isSubmitting}>
                <ChevronLeft size={16} />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="btn btn-primary"
                disabled={isSubmitting}
                style={{ padding: '12px 28px', fontSize: '15px' }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Creating Business Workspace...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    <span>Create Business</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
