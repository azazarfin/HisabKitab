import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { forgotPassword, resendVerification } from '../../api/api';

export default function ForgotPasswordPage() {
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get('mode') === 'verify' ? 'verify' : 'reset';
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState(initialMode); // 'reset' | 'verify'

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'reset') {
        await forgotPassword(email);
      } else {
        await resendVerification(email);
      }
      setSent(true);
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="auth-page">
        <div className="auth-page__bg-orb auth-page__bg-orb--1" />
        <div className="auth-page__bg-orb auth-page__bg-orb--2" />
        <div className="auth-card">
          <div className="auth-card__header">
            <span className="auth-card__logo auth-card__logo--success">📬</span>
            <h1 className="auth-card__title">Check Your Email</h1>
            <p className="auth-card__subtitle">
              {mode === 'reset'
                ? `If an account exists for ${email}, we've sent a password reset link.`
                : `If ${email} is registered and unverified, we've sent a new verification link.`
              }
            </p>
          </div>
          <div className="auth-alert auth-alert--info">
            <span className="auth-alert__icon">⏱️</span>
            <span>
              {mode === 'reset'
                ? 'The link will expire in 1 hour.'
                : 'The link will expire in 24 hours.'
              }
            </span>
          </div>
          <Link to="/login" className="auth-form__submit" style={{ textDecoration: 'none', textAlign: 'center', display: 'block' }}>
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-page__bg-orb auth-page__bg-orb--1" />
      <div className="auth-page__bg-orb auth-page__bg-orb--2" />

      <div className="auth-card">
        <div className="auth-card__header">
          <span className="auth-card__logo">🔑</span>
          <h1 className="auth-card__title">
            {mode === 'reset' ? 'Forgot Password' : 'Resend Verification'}
          </h1>
          <p className="auth-card__subtitle">
            {mode === 'reset'
              ? 'Enter your email and we\'ll send you a reset link.'
              : 'Enter your email and we\'ll resend the verification link.'
            }
          </p>
        </div>

        <div className="auth-toggle">
          <button
            className={`auth-toggle__btn ${mode === 'reset' ? 'auth-toggle__btn--active' : ''}`}
            onClick={() => { setMode('reset'); setError(''); }}
          >
            Reset Password
          </button>
          <button
            className={`auth-toggle__btn ${mode === 'verify' ? 'auth-toggle__btn--active' : ''}`}
            onClick={() => { setMode('verify'); setError(''); }}
          >
            Resend Verification
          </button>
        </div>

        {error && (
          <div className="auth-alert auth-alert--error">
            <span className="auth-alert__icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-form__group">
            <label className="auth-form__label" htmlFor="forgot-email">Email Address</label>
            <input
              id="forgot-email"
              type="email"
              className="auth-form__input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <button
            type="submit"
            className="auth-form__submit"
            disabled={loading}
          >
            {loading ? (
              <span className="auth-spinner" />
            ) : (
              mode === 'reset' ? 'Send Reset Link' : 'Resend Verification'
            )}
          </button>
        </form>

        <p className="auth-card__footer">
          Remember your password?{' '}
          <Link to="/login" className="auth-link">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
