import React from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '../../components/DashboardLayout.js';
import { useAuth } from '../../context/AuthContext.js';
import {
  Building2,
  Users,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  Clock,
  User as UserIcon,
} from 'lucide-react';

export function BusinessDashboardPage() {
  const { user } = useAuth();

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
          Welcome back, {user?.firstName}!
        </h1>
        <p style={{ color: '#D1FAE5', fontSize: '14px', maxWidth: '640px', lineHeight: 1.6 }}>
          Manage your business credentials and upcoming workspace resources. Flexora gives you full control over your business modules and team access.
        </p>
      </div>

      {/* Main Empty State: Business Registration Placeholder */}
      <div className="card" style={{ marginBottom: '28px' }}>
        <div className="placeholder-box">
          <div className="placeholder-icon">
            <Building2 size={32} />
          </div>
          <h3>Business Workspace</h3>
          <p>
            You currently have an active Business Owner account. The full business registration workflow,
            tax entity configuration, and custom workspace creation will be available in <b>Step 2</b>.
          </p>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              background: 'var(--light-green)',
              color: 'var(--primary)',
              borderRadius: '9999px',
              fontSize: '13px',
              fontWeight: 600,
            }}
          >
            <Clock size={16} />
            <span>Step 2 Feature: Business Setup Workflow</span>
          </div>
        </div>
      </div>

      {/* Planned Capabilities Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{ padding: '10px', background: 'var(--light-green)', borderRadius: 'var(--radius-md)', color: 'var(--primary)' }}>
              <Users size={20} />
            </div>
            <div>
              <h4 style={{ fontSize: '16px' }}>Team Management</h4>
              <span className="badge badge-inactive" style={{ fontSize: '10px' }}>Planned</span>
            </div>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '16px' }}>
            Invite Managers and Staff to assist in day-to-day operations with granular role permissions.
          </p>
          <button className="btn btn-secondary btn-sm" disabled style={{ width: '100%' }}>
            Invite Team Members (Coming Soon)
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
            Design and customize your public storefront and customer landing pages visually.
          </p>
          <button className="btn btn-secondary btn-sm" disabled style={{ width: '100%' }}>
            Launch Builder (Coming Soon)
          </button>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{ padding: '10px', background: 'var(--light-green)', borderRadius: 'var(--radius-md)', color: 'var(--primary)' }}>
              <UserIcon size={20} />
            </div>
            <div>
              <h4 style={{ fontSize: '16px' }}>Account Settings</h4>
              <span className="badge badge-active" style={{ fontSize: '10px' }}>Active</span>
            </div>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '16px' }}>
            Update your profile name, change your password, and inspect your security sessions.
          </p>
          <Link to="/profile" className="btn btn-primary btn-sm" style={{ width: '100%' }}>
            Manage Profile & Security
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
