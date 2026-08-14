import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { resetPassword } from '../../api/api';

export default function ResetPasswordPage() {
  const { token } = useParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      await resetPassword(token, password);
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Failed to reset password.');
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
            <span className="auth-card__logo auth-card__logo--success">✅</span>
            <h1 className="auth-card__title">Password Reset!</h1>
            <p className="auth-card__subtitle">
              Your password has been updated successfully. You can now log in with your new password.
            </p>
          </div>
          <Link to="/login" className="auth-form__submit" style={{ textDecoration: 'none', textAlign: 'center', display: 'block' }}>
            Sign In
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
          <span className="auth-card__logo">🔒</span>
          <h1 className="auth-card__title">Reset Password</h1>
          <p className="auth-card__subtitle">Choose a new password for your account.</p>
        </div>

        {error && (
          <div className="auth-alert auth-alert--error">
            <span className="auth-alert__icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-form__group">
            <label className="auth-form__label" htmlFor="reset-password">New Password</label>
            <input
              id="reset-password"
              type="password"
              className="auth-form__input"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>

          <div className="auth-form__group">
            <label className="auth-form__label" htmlFor="reset-confirm">Confirm New Password</label>
            <input
              id="reset-confirm"
              type="password"
              className="auth-form__input"
              placeholder="Re-enter new password"
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
              'Reset Password'
            )}
          </button>
        </form>

        <p className="auth-card__footer">
          <Link to="/login" className="auth-link">Back to Login</Link>
        </p>
      </div>
    </div>
  );
}
