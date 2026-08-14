import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';

export default function LoginPage() {
  const { login, googleLogin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showVerifyHint, setShowVerifyHint] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setShowVerifyHint(false);
    setLoading(true);

    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
      if (err.code === 'EMAIL_NOT_VERIFIED') {
        setShowVerifyHint(true);
      }
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
      setError(err.message || 'Google login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-page__bg-orb auth-page__bg-orb--1" />
      <div className="auth-page__bg-orb auth-page__bg-orb--2" />
      <div className="auth-page__bg-orb auth-page__bg-orb--3" />

      <div className="auth-card">
        <div className="auth-card__header">
          <span className="auth-card__logo">📒</span>
          <h1 className="auth-card__title">Welcome Back</h1>
          <p className="auth-card__subtitle">Sign in to HisabKitab</p>
        </div>

        {error && (
          <div className="auth-alert auth-alert--error">
            <span className="auth-alert__icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {showVerifyHint && (
          <div className="auth-alert auth-alert--info">
            <span className="auth-alert__icon">📧</span>
            <span>
              Check your inbox for the verification email.{' '}
              <Link to="/forgot-password" className="auth-link--inline">
                Resend verification
              </Link>
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-form__group">
            <label className="auth-form__label" htmlFor="login-email">Email</label>
            <input
              id="login-email"
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
            <div className="auth-form__label-row">
              <label className="auth-form__label" htmlFor="login-password">Password</label>
              <Link to="/forgot-password" className="auth-form__forgot-link">
                Forgot password?
              </Link>
            </div>
            <input
              id="login-password"
              type="password"
              className="auth-form__input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="current-password"
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
              'Sign In'
            )}
          </button>
        </form>

        <div className="auth-divider">
          <span>or</span>
        </div>

        <div className="auth-google-wrapper">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setError('Google login failed.')}
            theme="filled_black"
            size="large"
            width="100%"
            text="signin_with"
            shape="pill"
          />
        </div>

        <p className="auth-card__footer">
          Don't have an account?{' '}
          <Link to="/register" className="auth-link">Create one</Link>
        </p>
      </div>
    </div>
  );
}
