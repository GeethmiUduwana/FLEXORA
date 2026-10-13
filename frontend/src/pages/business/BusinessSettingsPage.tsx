import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { DashboardLayout } from '../../components/DashboardLayout.js';
import api from '../../api/client.js';
import { IBusiness } from '../../types/index.js';
import {
  Building2,
  Save,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  Briefcase,
  Calendar,
  DollarSign,
} from 'lucide-react';
import toast from 'react-hot-toast';

export function BusinessSettingsPage() {
  const navigate = useNavigate();

  const [business, setBusiness] = useState<IBusiness | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [website, setWebsite] = useState('');
  const [employeeCount, setEmployeeCount] = useState(0);
  const [customerCount, setCustomerCount] = useState(0);
  const [mainServices, setMainServices] = useState('');
  const [productsSold, setProductsSold] = useState('');
  const [onlineBookingRequired, setOnlineBookingRequired] = useState(false);
  const [onlinePaymentsRequired, setOnlinePaymentsRequired] = useState(false);

  useEffect(() => {
    const fetchBusiness = async () => {
      try {
        setIsLoading(true);
        const res = await api.get('/businesses/my');
        if (res.data?.data?.businesses?.length > 0) {
          const b: IBusiness = res.data.data.businesses[0];
          setBusiness(b);
          setName(b.name);
          setDescription(b.description);
          setEmail(b.email || '');
          setPhone(b.phone || '');
          setAddress(b.address || '');
          setWebsite(b.website || '');
          setEmployeeCount(b.employeeCount || 0);
          setCustomerCount(b.customerCount || 0);
          setMainServices((b.mainServices || []).join(', '));
          setProductsSold((b.productsSold || []).join(', '));
          setOnlineBookingRequired(b.onlineBookingRequired || false);
          setOnlinePaymentsRequired(b.onlinePaymentsRequired || false);
        } else {
          // No business registered yet, redirect to setup
          navigate('/business/setup', { replace: true });
        }
      } catch (err: any) {
        toast.error('Failed to load business profile');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBusiness();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business) return;

    if (!name.trim() || name.trim().length < 2) {
      toast.error('Business name must be at least 2 characters');
      return;
    }

    if (!description.trim() || description.trim().length < 10) {
      toast.error('Description must be at least 10 characters');
      return;
    }

    try {
      setIsSaving(true);
      const payload = {
        name: name.trim(),
        description: description.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
        address: address.trim() || null,
        website: website.trim() || null,
        employeeCount: Number(employeeCount) || 0,
        customerCount: Number(customerCount) || 0,
        mainServices: mainServices.split(',').map((s) => s.trim()).filter(Boolean),
        productsSold: productsSold.split(',').map((p) => p.trim()).filter(Boolean),
        onlineBookingRequired,
        onlinePaymentsRequired,
      };

      const res = await api.patch(`/businesses/${business.id}`, payload);
      setBusiness(res.data.data.business);
      toast.success('Business profile updated successfully');
      navigate('/business/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update business profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Loader2 size={32} className="animate-spin" color="var(--primary)" style={{ margin: '0 auto 12px' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Loading business details...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div style={{ maxWidth: '840px', margin: '0 auto', paddingBottom: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <Link to="/business/dashboard" className="btn btn-secondary btn-sm">
            <ArrowLeft size={16} />
            <span>Back to Dashboard</span>
          </Link>
          <div>
            <h1 style={{ fontSize: '24px' }}>Edit Business Profile</h1>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Update your core business information and operational parameters.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="card">
          <h3 style={{ fontSize: '17px', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Building2 size={18} color="var(--primary)" />
            <span>Profile Details</span>
          </h3>

          <div className="form-group">
            <label className="form-label" htmlFor="name">Business Name</label>
            <input
              id="name"
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="description">Business Description</label>
            <textarea
              id="description"
              className="form-input"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="email">Business Email</label>
              <input
                id="email"
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="phone">Phone Number</label>
              <input
                id="phone"
                type="tel"
                className="form-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
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
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="website">Website URL</label>
              <input
                id="website"
                type="url"
                className="form-input"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </div>
          </div>

          <h3 style={{ fontSize: '17px', margin: '24px 0 16px', display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
            <Briefcase size={18} color="var(--primary)" />
            <span>Operations & Scope</span>
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="employeeCount">Number of Employees</label>
              <input
                id="employeeCount"
                type="number"
                min="0"
                className="form-input"
                value={employeeCount}
                onChange={(e) => setEmployeeCount(Math.max(0, parseInt(e.target.value) || 0))}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="customerCount">Monthly Customers</label>
              <input
                id="customerCount"
                type="number"
                min="0"
                className="form-input"
                value={customerCount}
                onChange={(e) => setCustomerCount(Math.max(0, parseInt(e.target.value) || 0))}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="mainServices">Main Services (Comma-separated)</label>
            <input
              id="mainServices"
              type="text"
              className="form-input"
              value={mainServices}
              onChange={(e) => setMainServices(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="productsSold">Products Sold (Comma-separated)</label>
            <input
              id="productsSold"
              type="text"
              className="form-input"
              value={productsSold}
              onChange={(e) => setProductsSold(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: '#FAFCFA', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '13px', fontWeight: 600 }}>Online Booking / Scheduling Required</span>
              <input
                type="checkbox"
                checked={onlineBookingRequired}
                onChange={(e) => setOnlineBookingRequired(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: 'var(--primary)', cursor: 'pointer' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: '#FAFCFA', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '13px', fontWeight: 600 }}>Online Payments Required</span>
              <input
                type="checkbox"
                checked={onlinePaymentsRequired}
                onChange={(e) => setOnlinePaymentsRequired(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: 'var(--primary)', cursor: 'pointer' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '28px', paddingTop: '18px', borderTop: '1px solid var(--border-color)' }}>
            <Link to="/business/dashboard" className="btn btn-secondary">
              Cancel
            </Link>
            <button type="submit" className="btn btn-primary" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
