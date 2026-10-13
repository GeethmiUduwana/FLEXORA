import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Layers3 } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';

export function UnauthorizedPage() {
  const { user } = useAuth();

  return (
    <div className="auth-wrapper">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <div className="auth-header">
          <Link to="/" className="logo-box" style={{ background: 'var(--error)' }}>
            <ShieldAlert size={26} color="white" />
          </Link>
          <h1 style={{ color: 'var(--text-main)', marginTop: '8px' }}>Access Restricted</h1>
          <p style={{ marginTop: '8px' }}>
            You do not have permission to access this resource or administrative area.
          </p>
        </div>

        <div
          style={{
            padding: '14px',
            background: 'var(--bg-color)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            fontSize: '13px',
            color: 'var(--text-secondary)',
            marginBottom: '24px',
          }}
        >
          {user ? (
            <>
              Your current signed-in role is <b>{user.role}</b>.
            </>
          ) : (
            'You are not currently authenticated.'
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <Link to="/dashboard" className="btn btn-primary" style={{ width: '100%' }}>
            Return to My Dashboard
          </Link>
          <Link to="/" className="btn btn-secondary" style={{ width: '100%' }}>
            <ArrowLeft size={16} />
            <span>Go to Flexora Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
