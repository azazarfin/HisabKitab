import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { forgotPassword, resendVerification, resetPassword } from '../../api/api';
import { useAuth } from '../../context/AuthContext';

export default function ForgotPasswordPage() {
  const { verifyEmail } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get('mode') === 'verify' ? 'verify' : 'reset';
  
  const [mode, setMode] = useState(initialMode); // 'reset' | 'verify'
  const [step, setStep] = useState('request'); // 'request' | 'verify' | 'success'
  
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'reset') {
        await forgotPassword(email);
      } else {
        await resendVerification(email);
      }
      setStep('verify');
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (mode === 'reset' && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'reset') {
        await resetPassword(email, otp, password);
        setStep('success');
      } else {
        await verifyEmail(email, otp);
        // Automatically logged in via context, App.jsx handles redirect
        navigate('/');
      }
    } catch (err) {
      setError(err.message || 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = (pwd) => {
    if (!pwd) return { level: 0, label: '', color: '' };
    let score = 0;
    if (pwd.length >= 8) score += 1;
    if (pwd.match(/[A-Z]/)) score += 1;
    if (pwd.match(/[0-9]/)) score += 1;
    if (pwd.match(/[^A-Za-z0-9]/)) score += 1;
    
    if (score < 2) return { level: 1, label: 'Weak', color: '#ef4444' };
    if (score === 2 || score === 3) return { level: 2, label: 'Good', color: '#f59e0b' };
    return { level: 3, label: 'Strong', color: '#10b981' };
  };

  const pwdStrength = mode === 'reset' ? getPasswordStrength(password) : null;

  if (step === 'success') {
    return (
      <div className="auth-page">
        <div className="auth-page__bg-orb auth-page__bg-orb--1" />
        <div className="auth-page__bg-orb auth-page__bg-orb--2" />
        <div className="auth-card">
          <div className="auth-card__header">
            <span className="auth-card__logo auth-card__logo--success">✅</span>
            <h1 className="auth-card__title">Password Reset!</h1>
            <p className="auth-card__subtitle">
              Your password has been reset successfully.
            </p>
          </div>
          <Link to="/login" className="auth-form__submit" style={{ textDecoration: 'none', textAlign: 'center', display: 'block' }}>
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  if (step === 'verify') {
    return (
      <div className="auth-page">
        <div className="auth-page__bg-orb auth-page__bg-orb--1" />
        <div className="auth-page__bg-orb auth-page__bg-orb--2" />
        <div className="auth-card">
          <div className="auth-card__header">
            <span className="auth-card__logo auth-card__logo--success">✉️</span>
            <h1 className="auth-card__title">Enter Code</h1>
            <p className="auth-card__subtitle">
              We've sent a 6-digit verification code to <strong>{email}</strong>
            </p>
          </div>
          
          <div className="auth-alert auth-alert--info" style={{ marginBottom: '16px' }}>
            <span className="auth-alert__icon">⏱️</span>
            <span>The code will expire in 10 minutes.</span>
          </div>

          {error && (
            <div className="auth-alert auth-alert--error" style={{ marginBottom: '16px' }}>
              <span className="auth-alert__icon">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleVerifySubmit} className="auth-form">
            <div className="auth-form__group">
              <label className="auth-form__label">Verification Code</label>
              <input
                type="text"
                className="auth-form__input"
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
                required
                style={{ fontSize: '24px', letterSpacing: '4px', textAlign: 'center' }}
              />
            </div>

            {mode === 'reset' && (
              <>
                <div className="auth-form__group">
                  <label className="auth-form__label">New Password</label>
                  <input
                    type="password"
                    className="auth-form__input"
                    placeholder="Create a strong password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={6}
                    required
                  />
                  {password && (
                    <div className="auth-form__strength">
                      <div className="auth-form__strength-bars">
                        {[1, 2, 3].map(level => (
                          <div 
                            key={level}
                            className="auth-form__strength-bar"
                            style={{
                              backgroundColor: pwdStrength.level >= level ? pwdStrength.color : 'rgba(255,255,255,0.1)'
                            }}
                          />
                        ))}
                      </div>
                      <span style={{ color: pwdStrength.color, fontSize: '12px' }}>
                        {pwdStrength.label}
                      </span>
                    </div>
                  )}
                </div>

                <div className="auth-form__group">
                  <label className="auth-form__label">Confirm Password</label>
                  <input
                    type="password"
                    className="auth-form__input"
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    minLength={6}
                    required
                  />
                  {confirmPassword && password !== confirmPassword && (
                    <span className="auth-form__hint auth-form__hint--error">Passwords do not match</span>
                  )}
                </div>
              </>
            )}
            
            <button
              type="submit"
              className="auth-form__submit"
              disabled={loading || otp.length < 6 || (mode === 'reset' && password.length < 6)}
            >
              {loading ? (
                <span className="auth-spinner" />
              ) : (
                mode === 'reset' ? 'Reset Password' : 'Verify and Login'
              )}
            </button>
          </form>

          <button
            onClick={() => setStep('request')}
            className="auth-form__submit"
            style={{ 
              marginTop: '12px',
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.1)' 
            }}
          >
            Go Back
          </button>
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
              ? 'Enter your email and we\'ll send you a 6-digit code.'
              : 'Enter your email and we\'ll resend the verification code.'
            }
          </p>
        </div>

        <div className="auth-toggle">
          <button
            className={`auth-toggle__btn ${mode === 'reset' ? 'auth-toggle__btn--active' : ''}`}
            onClick={() => { setMode('reset'); setError(''); }}
            type="button"
          >
            Reset Password
          </button>
          <button
            className={`auth-toggle__btn ${mode === 'verify' ? 'auth-toggle__btn--active' : ''}`}
            onClick={() => { setMode('verify'); setError(''); }}
            type="button"
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

        <form onSubmit={handleRequestSubmit} className="auth-form">
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
              mode === 'reset' ? 'Send Code' : 'Resend Code'
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
