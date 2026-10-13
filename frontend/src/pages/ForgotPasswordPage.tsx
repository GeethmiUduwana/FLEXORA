import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client.js';
import { Layers3, ArrowLeft, Loader2, MailCheck, KeyRound } from 'lucide-react';
import toast from 'react-hot-toast';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    try {
      setIsSubmitting(true);
      const response = await api.post('/auth/forgot-password', { email });
      setIsSubmitted(true);
      if (response.data?.devResetUrl) {
        setDevResetUrl(response.data.devResetUrl);
      }
      toast.success('Password reset instructions sent');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to request password reset');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-header">
          <Link to="/" className="logo-box">
            <Layers3 size={24} />
          </Link>
          <h1>Reset Password</h1>
          <p>Enter your email address to receive password reset instructions</p>
        </div>

        {isSubmitted ? (
          <div>
            <div
              style={{
                textAlign: 'center',
                padding: '24px 16px',
                background: 'var(--light-green)',
                borderRadius: 'var(--radius-lg)',
                marginBottom: '20px',
              }}
            >
              <MailCheck size={44} color="var(--primary)" style={{ margin: '0 auto 12px' }} />
              <h3 style={{ fontSize: '18px', color: 'var(--dark-green)', marginBottom: '8px' }}>
                Check Your Email
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                If an account exists for <b>{email}</b>, we have dispatched a password reset link.
              </p>
            </div>

            {devResetUrl && (
              <div
                style={{
                  background: '#FEF3C7',
                  border: '1px solid #F59E0B',
                  borderRadius: 'var(--radius-md)',
                  padding: '14px',
                  marginBottom: '20px',
                  fontSize: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: '#B45309', marginBottom: '6px' }}>
                  <KeyRound size={16} />
                  <span>Development Mode Reset Link</span>
                </div>
                <p style={{ color: '#92400E', marginBottom: '8px' }}>
                  Since email service is in local development mode, use this direct link to reset your password:
                </p>
                <a
                  href={devResetUrl}
                  style={{
                    display: 'block',
                    padding: '8px',
                    background: 'white',
                    borderRadius: '4px',
                    color: 'var(--primary)',
                    fontWeight: 600,
                    wordBreak: 'break-all',
                  }}
                >
                  {devResetUrl}
                </a>
              </div>
            )}

            <Link to="/login" className="btn btn-secondary" style={{ width: '100%' }}>
              <ArrowLeft size={16} />
              <span>Back to Sign In</span>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="email">
                Registered Email Address
              </label>
              <input
                id="email"
                type="email"
                className="form-input"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px' }}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Sending Instructions...</span>
                </>
              ) : (
                'Send Reset Instructions'
              )}
            </button>

            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <Link
                to="/login"
                style={{
                  fontSize: '13px',
                  color: 'var(--text-secondary)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <ArrowLeft size={14} />
                <span>Back to Sign In</span>
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
