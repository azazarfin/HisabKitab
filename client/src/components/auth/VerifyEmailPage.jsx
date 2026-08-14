import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { verifyEmail } from '../../api/api';

export default function VerifyEmailPage() {
  const { token } = useParams();
  const [status, setStatus] = useState('verifying'); // 'verifying' | 'success' | 'error'
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verify = async () => {
      try {
        const data = await verifyEmail(token);
        setStatus('success');
        setMessage(data.message || 'Email verified successfully!');
      } catch (err) {
        setStatus('error');
        setMessage(err.message || 'Verification failed.');
      }
    };

    if (token) {
      verify();
    } else {
      setStatus('error');
      setMessage('No verification token provided.');
    }
  }, [token]);

  return (
    <div className="auth-page">
      <div className="auth-page__bg-orb auth-page__bg-orb--1" />
      <div className="auth-page__bg-orb auth-page__bg-orb--2" />

      <div className="auth-card">
        {status === 'verifying' && (
          <div className="auth-card__header">
            <div className="auth-card__logo">
              <span className="auth-spinner auth-spinner--large" />
            </div>
            <h1 className="auth-card__title">Verifying Email...</h1>
            <p className="auth-card__subtitle">Please wait while we verify your email address.</p>
          </div>
        )}

        {status === 'success' && (
          <>
            <div className="auth-card__header">
              <span className="auth-card__logo auth-card__logo--success">🎉</span>
              <h1 className="auth-card__title">Email Verified!</h1>
              <p className="auth-card__subtitle">{message}</p>
            </div>
            <Link to="/login" className="auth-form__submit" style={{ textDecoration: 'none', textAlign: 'center', display: 'block' }}>
              Sign In Now
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="auth-card__header">
              <span className="auth-card__logo auth-card__logo--error">❌</span>
              <h1 className="auth-card__title">Verification Failed</h1>
              <p className="auth-card__subtitle">{message}</p>
            </div>
            <div className="auth-alert auth-alert--info">
              <span className="auth-alert__icon">💡</span>
              <span>
                The link may have expired. You can{' '}
                <Link to="/forgot-password" className="auth-link--inline">
                  request a new verification email
                </Link>.
              </span>
            </div>
            <Link to="/login" className="auth-form__submit" style={{ textDecoration: 'none', textAlign: 'center', display: 'block' }}>
              Back to Login
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
