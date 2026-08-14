import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';

export default function RegisterPage() {
  const { register, googleLogin, resendVerification } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // Resend state
  const [countdown, setCountdown] = useState(60);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  // Handle countdown timer
  useEffect(() => {
    let timer;
    if (success && countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [success, countdown]);

  const handleResend = async () => {
    if (countdown > 0) return;
    setResendLoading(true);
    setResendMessage('');
    setError('');
    
    try {
      await resendVerification(email);
      setResendMessage('Verification email resent successfully!');
      setCountdown(60); // Restart countdown
    } catch (err) {
      setError(err.message || 'Failed to resend email.');
    } finally {
      setResendLoading(false);
    }
  };

  const getPasswordStrength = (pwd) => {
    if (!pwd) return { level: 0, label: '', color: '' };
    let score = 0;
    if (pwd.length >= 6) score++;
    if (pwd.length >= 10) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score <= 1) return { level: 1, label: 'Weak', color: 'var(--color-danger)' };
    if (score <= 2) return { level: 2, label: 'Fair', color: '#f59e0b' };
    if (score <= 3) return { level: 3, label: 'Good', color: '#3b82f6' };
    return { level: 4, label: 'Strong', color: 'var(--color-success)' };
  };

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      await register(name, email, password);
      setSuccess(true);
      setCountdown(60); // Start 1 min countdown when successful
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    setLoading(true);
    try {
      await googleLogin(credentialResponse.credential);
    } catch (err) {
      setError(err.message || 'Google sign-up failed.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-page__bg-orb auth-page__bg-orb--1" />
        <div className="auth-page__bg-orb auth-page__bg-orb--2" />
        <div className="auth-card">
          <div className="auth-card__header">
            <span className="auth-card__logo auth-card__logo--success">✉️</span>
            <h1 className="auth-card__title">Check Your Email</h1>
            <p className="auth-card__subtitle">
              We've sent a verification link to <strong>{email}</strong>.
              Click the link in the email to activate your account.
            </p>
          </div>
          <div className="auth-alert auth-alert--success" style={{ marginBottom: '16px' }}>
            <span className="auth-alert__icon">💡</span>
            <span>Check your spam folder if you don't see the email within a few minutes.</span>
          </div>

          {resendMessage && (
            <div className="auth-alert auth-alert--success" style={{ marginBottom: '16px' }}>
              <span className="auth-alert__icon">✅</span>
              <span>{resendMessage}</span>
            </div>
          )}
          {error && (
            <div className="auth-alert auth-alert--error" style={{ marginBottom: '16px' }}>
              <span className="auth-alert__icon">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '24px' }}>
            <button
              onClick={handleResend}
              disabled={countdown > 0 || resendLoading}
              className="auth-form__submit"
              style={{ 
                background: countdown > 0 ? 'rgba(255,255,255,0.1)' : 'var(--color-primary)',
                cursor: countdown > 0 ? 'not-allowed' : 'pointer',
                color: countdown > 0 ? 'rgba(255,255,255,0.5)' : '#fff'
              }}
            >
              {resendLoading ? (
                <span className="auth-spinner" />
              ) : countdown > 0 ? (
                `Resend Email in ${countdown}s`
              ) : (
                'Resend Email'
              )}
            </button>

            <Link to="/login" className="auth-form__submit" style={{ 
              textDecoration: 'none', 
              textAlign: 'center', 
              display: 'block', 
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.1)' 
            }}>
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-page__bg-orb auth-page__bg-orb--1" />
      <div className="auth-page__bg-orb auth-page__bg-orb--2" />
      <div className="auth-page__bg-orb auth-page__bg-orb--3" />

      <div className="auth-card">
        <div className="auth-card__header">
          <span className="auth-card__logo">📒</span>
          <h1 className="auth-card__title">Create Account</h1>
          <p className="auth-card__subtitle">Start tracking with HisabKitab</p>
        </div>

        {error && (
          <div className="auth-alert auth-alert--error">
            <span className="auth-alert__icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-form__group">
            <label className="auth-form__label" htmlFor="register-name">Full Name</label>
            <input
              id="register-name"
              type="text"
              className="auth-form__input"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
            />
          </div>

          <div className="auth-form__group">
            <label className="auth-form__label" htmlFor="register-email">Email</label>
            <input
              id="register-email"
              type="email"
              className="auth-form__input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="auth-form__group">
            <label className="auth-form__label" htmlFor="register-password">Password</label>
            <input
              id="register-password"
              type="password"
              className="auth-form__input"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
            />
            {password && (
              <div className="password-strength">
                <div className="password-strength__bar">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="password-strength__segment"
                      style={{
                        background: i <= strength.level ? strength.color : 'rgba(255,255,255,0.08)',
                      }}
                    />
                  ))}
                </div>
                <span className="password-strength__label" style={{ color: strength.color }}>
                  {strength.label}
                </span>
              </div>
            )}
          </div>

          <div className="auth-form__group">
            <label className="auth-form__label" htmlFor="register-confirm">Confirm Password</label>
            <input
              id="register-confirm"
              type="password"
              className="auth-form__input"
              placeholder="Re-enter password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
            />
            {confirmPassword && password !== confirmPassword && (
              <span className="auth-form__hint auth-form__hint--error">Passwords do not match</span>
            )}
          </div>

          <button
            type="submit"
            className="auth-form__submit"
            disabled={loading}
          >
            {loading ? (
              <span className="auth-spinner" />
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className="auth-divider">
          <span>or</span>
        </div>

        <div className="auth-google-wrapper">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setError('Google sign-up failed.')}
            theme="filled_black"
            size="large"
            width="100%"
            text="signup_with"
            shape="pill"
          />
        </div>

        <p className="auth-card__footer">
          Already have an account?{' '}
          <Link to="/login" className="auth-link">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
