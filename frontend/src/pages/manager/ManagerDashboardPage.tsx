import React from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '../../components/DashboardLayout.js';
import { useAuth } from '../../context/AuthContext.js';
import { Building2, Briefcase, User as UserIcon, Clock, ShieldCheck } from 'lucide-react';

export function ManagerDashboardPage() {
  const { user } = useAuth();

  return (
    <DashboardLayout>
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
          Operations Management Portal
        </span>
        <h1 style={{ color: 'white', fontSize: '26px', margin: '8px 0 10px' }}>
          Welcome, {user?.firstName}!
        </h1>
        <p style={{ color: '#D1FAE5', fontSize: '14px', maxWidth: '640px', lineHeight: 1.6 }}>
          You are signed in as a Manager. You can manage assigned business operations and collaborate with staff once workspaces are assigned.
        </p>
      </div>

      <div className="card" style={{ marginBottom: '28px' }}>
        <div className="placeholder-box">
          <div className="placeholder-icon">
            <Building2 size={32} />
          </div>
          <h3>Assigned Workspace</h3>
          <p>
            Your account is ready for operation. When a Business Owner links your profile to an active business workspace, your assigned departmental dashboards will appear here.
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
            <span>Workspace membership placeholder active</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{ padding: '10px', background: 'var(--light-green)', borderRadius: 'var(--radius-md)', color: 'var(--primary)' }}>
              <Briefcase size={20} />
            </div>
            <div>
              <h4 style={{ fontSize: '16px' }}>Operations & Modules</h4>
              <span className="badge badge-inactive" style={{ fontSize: '10px' }}>Future Step</span>
            </div>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '16px' }}>
            Manage inventory, view customer activity, and oversee business modules assigned by the owner.
          </p>
          <button className="btn btn-secondary btn-sm" disabled style={{ width: '100%' }}>
            Access Operations (Pending Assignment)
          </button>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{ padding: '10px', background: 'var(--light-green)', borderRadius: 'var(--radius-md)', color: 'var(--primary)' }}>
              <UserIcon size={20} />
            </div>
            <div>
              <h4 style={{ fontSize: '16px' }}>Your Profile</h4>
              <span className="badge badge-active" style={{ fontSize: '10px' }}>Active</span>
            </div>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '16px' }}>
            Manage your personal profile details and update your login password.
          </p>
          <Link to="/profile" className="btn btn-primary btn-sm" style={{ width: '100%' }}>
            View Account Profile
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
