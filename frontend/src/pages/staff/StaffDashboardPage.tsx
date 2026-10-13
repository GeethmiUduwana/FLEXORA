import React from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '../../components/DashboardLayout.js';
import { useAuth } from '../../context/AuthContext.js';
import { Building2, User as UserIcon, Clock } from 'lucide-react';

export function StaffDashboardPage() {
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
          Staff Workspace Portal
        </span>
        <h1 style={{ color: 'white', fontSize: '26px', margin: '8px 0 10px' }}>
          Welcome, {user?.firstName}!
        </h1>
        <p style={{ color: '#D1FAE5', fontSize: '14px', maxWidth: '640px', lineHeight: 1.6 }}>
          You are signed in as a Staff member. You will be able to access daily tasks and view assigned customer requests once your business administrator provisions workspace access.
        </p>
      </div>

      <div className="card" style={{ marginBottom: '28px' }}>
        <div className="placeholder-box">
          <div className="placeholder-icon">
            <Building2 size={32} />
          </div>
          <h3>Assigned Workspace Placeholder</h3>
          <p>
            Your staff account has been securely authenticated. Assigned team features and active workspaces will appear here once linked by your business manager.
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

      <div style={{ maxWidth: '480px' }}>
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
            Check your account status and update your login credentials.
          </p>
          <Link to="/profile" className="btn btn-primary btn-sm" style={{ width: '100%' }}>
            View Account Profile
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
