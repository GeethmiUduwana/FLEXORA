import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '../../components/DashboardLayout.js';
import { useAuth } from '../../context/AuthContext.js';
import api from '../../api/client.js';
import { IBusiness, BusinessStatus } from '../../types/index.js';
import {
  Building2,
  Users,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  Clock,
  User as UserIcon,
  PlusCircle,
  Edit,
  Mail,
  Phone,
  MapPin,
  Globe,
  Package,
  Layers,
  Calendar,
  DollarSign,
  Loader2,
  Percent,
} from 'lucide-react';

export function BusinessDashboardPage() {
  const { user } = useAuth();
  const [businesses, setBusinesses] = useState<IBusiness[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMyBusinesses = async () => {
      try {
        setIsLoading(true);
        const res = await api.get('/businesses/my');
        if (res.data?.data?.businesses) {
          setBusinesses(res.data.data.businesses);
        }
      } catch (err: any) {
        console.error('Failed to fetch businesses:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMyBusinesses();
  }, []);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Loader2 size={32} className="animate-spin" color="var(--primary)" style={{ margin: '0 auto 12px' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Loading business workspace...</p>
        </div>
      </DashboardLayout>
    );
  }

  const primaryBusiness = businesses[0];

  // Calculate profile completion percentage
  const calculateCompletion = (b: IBusiness) => {
    let score = 30; // base score for name, category, description
    if (b.email) score += 10;
    if (b.phone) score += 10;
    if (b.address) score += 10;
    if (b.website) score += 10;
    if (b.mainServices && b.mainServices.length > 0) score += 15;
    if (b.productsSold && b.productsSold.length > 0) score += 15;
    return Math.min(100, score);
  };

  return (
    <DashboardLayout>
      {/* Welcome Banner */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, #0B3D2E 0%, #16845B 100%)',
          color: 'white',
          marginBottom: '28px',
          padding: '32px 28px',
          border: 'none',
        }}
      >
        <span
          style={{
            fontSize: '12px',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            color: '#A7F3D0',
            fontWeight: 700,
          }}
        >
          Business Owner Portal
        </span>
        <h1 style={{ color: 'white', fontSize: '26px', margin: '8px 0 10px' }}>
          {primaryBusiness ? primaryBusiness.name : `Welcome back, ${user?.firstName}!`}
        </h1>
        <p style={{ color: '#D1FAE5', fontSize: '14px', maxWidth: '640px', lineHeight: 1.6 }}>
          {primaryBusiness
            ? `Your business workspace is active. Manage your business identity and prepare for module selection.`
            : `Set up your business workspace to configure your services, team operations, and custom website presence.`}
        </p>
      </div>

      {/* Case 1: No Business Created -> Helpful Empty State */}
      {!primaryBusiness ? (
        <div className="card" style={{ marginBottom: '28px' }}>
          <div className="placeholder-box" style={{ maxWidth: '680px' }}>
            <div className="placeholder-icon">
              <Building2 size={36} />
            </div>
            <h3>No Business Registered Yet</h3>
            <p>
              You haven't set up your business profile yet. Register your business now to select your category,
              define your services, and establish your multi-tenant workspace.
            </p>
            <Link
              to="/business/setup"
              className="btn btn-primary"
              style={{ padding: '12px 24px', fontSize: '15px' }}
            >
              <PlusCircle size={18} />
              <span>Register Your Business</span>
            </Link>
          </div>
        </div>
      ) : (
        /* Case 2: Business Created -> Rich Profile Overview & Step 3 Placeholder */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Active Business Profile Card */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <h2 style={{ fontSize: '22px', margin: 0 }}>{primaryBusiness.name}</h2>
                  <span className="badge badge-active">{primaryBusiness.status}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span className="badge badge-role">
                    {primaryBusiness.category?.name || 'Category'}
                  </span>
                  <span className="badge badge-inactive">
                    {primaryBusiness.customBusinessType
                      ? `${primaryBusiness.customBusinessType} (Custom)`
                      : primaryBusiness.businessType?.name || 'Standard Type'}
                  </span>
                </div>
              </div>

              <Link to="/business/settings" className="btn btn-secondary btn-sm">
                <Edit size={14} />
                <span>Edit Business Details</span>
              </Link>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.7, marginBottom: '24px' }}>
              {primaryBusiness.description}
            </p>

            {/* Profile Completion Bar */}
            <div style={{ padding: '16px 20px', background: '#F8FAF9', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600 }}>Profile Completeness</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--primary)' }}>
                  {calculateCompletion(primaryBusiness)}%
                </span>
              </div>
              <div style={{ width: '100%', height: '8px', background: '#E5E7EB', borderRadius: '4px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${calculateCompletion(primaryBusiness)}%`,
                    height: '100%',
                    background: 'var(--primary)',
                    borderRadius: '4px',
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
            </div>

            {/* Business Contact & Metadata Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
              {primaryBusiness.email && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
                  <Mail size={16} color="var(--primary)" />
                  <span>{primaryBusiness.email}</span>
                </div>
              )}
              {primaryBusiness.phone && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
                  <Phone size={16} color="var(--primary)" />
                  <span>{primaryBusiness.phone}</span>
                </div>
              )}
              {primaryBusiness.address && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
                  <MapPin size={16} color="var(--primary)" />
                  <span>{primaryBusiness.address}</span>
                </div>
              )}
              {primaryBusiness.website && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
                  <Globe size={16} color="var(--primary)" />
                  <a href={primaryBusiness.website} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>
                    {primaryBusiness.website}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Planned Step 3 Module Marketplace Placeholder */}
          <div
            className="card"
            style={{
              border: '1.5px dashed var(--border-color)',
              background: '#FBFCFB',
              padding: '32px 28px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--light-green)', color: 'var(--primary)', display: 'grid', placeItems: 'center' }}>
                <Package size={24} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={{ fontSize: '18px', margin: 0 }}>Modular Feature Selection</h3>
                  <span className="badge badge-inactive">Coming in Step 3</span>
                </div>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Next Phase: Feature recommendations tailored to {primaryBusiness.category?.name || 'your industry'}
                </span>
              </div>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6, maxWidth: '680px', marginBottom: '20px' }}>
              Your business profile is saved in MongoDB. In the upcoming phase, Flexora will evaluate your category (<b>{primaryBusiness.category?.name}</b>) and business type to recommend specialized modules (e.g., E-commerce catalog, Online Booking calendar, Inventory Management, and CRM).
            </p>

            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'var(--light-green)', color: 'var(--primary)', borderRadius: '9999px', fontSize: '13px', fontWeight: 600 }}>
              <Clock size={16} />
              <span>Step 2 Complete — Business profile ready for Step 3 Module Catalog</span>
            </div>
          </div>
        </div>
      )}

      {/* Auxiliary Cards (Team & Builder Placeholders) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginTop: '24px' }}>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{ padding: '10px', background: 'var(--light-green)', borderRadius: 'var(--radius-md)', color: 'var(--primary)' }}>
              <Users size={20} />
            </div>
            <div>
              <h4 style={{ fontSize: '16px' }}>Team Access</h4>
              <span className="badge badge-inactive" style={{ fontSize: '10px' }}>Step 5</span>
            </div>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '16px' }}>
            Invite Managers and Staff to assist in operations once modules are selected.
          </p>
          <button className="btn btn-secondary btn-sm" disabled style={{ width: '100%' }}>
            Invite Team (Pending Step 5)
          </button>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{ padding: '10px', background: 'var(--light-green)', borderRadius: 'var(--radius-md)', color: 'var(--primary)' }}>
              <Sparkles size={20} />
            </div>
            <div>
              <h4 style={{ fontSize: '16px' }}>Visual Website Builder</h4>
              <span className="badge badge-inactive" style={{ fontSize: '10px' }}>Step 4</span>
            </div>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '16px' }}>
            Build your public website and storefront visually with drag-and-drop sections.
          </p>
          <button className="btn btn-secondary btn-sm" disabled style={{ width: '100%' }}>
            Launch Builder (Pending Step 4)
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
