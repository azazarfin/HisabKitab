import { useState, useRef } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import {
  updateProfile,
  changePassword,
  linkGoogle,
  unlinkGoogle,
  deleteAccount,
} from '../api/api';

const AccountManager = ({ onClose, addToast }) => {
  const { user, updateUser, logout } = useAuth();

  // ─── Profile State ──────────────────────────────────────────
  const [name, setName] = useState(user?.name || '');
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || '');
  const [avatarFile, setAvatarFile] = useState(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const fileInputRef = useRef(null);

  // ─── Password State ─────────────────────────────────────────
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // ─── Google Linking State ───────────────────────────────────
  const [googleLinking, setGoogleLinking] = useState(false);

  // ─── Delete Account State ───────────────────────────────────
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  const isGoogleLinked = !!user?.googleId || user?.provider === 'google';
  const hasLocalPassword = user?.provider === 'local';

  // ─── Avatar Handling ────────────────────────────────────────
  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      addToast('Image must be under 2MB', 'error');
      return;
    }

    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ─── Profile Save ──────────────────────────────────────────
  const handleProfileSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      addToast('Name cannot be empty', 'error');
      return;
    }

    setProfileSaving(true);
    try {
      const data = { name: name.trim() };
      if (avatarFile) {
        data.avatar = avatarFile;
      } else if (!avatarPreview && user?.avatar) {
        data.removeAvatar = true;
      }

      const result = await updateProfile(data);
      updateUser(result.user);
      setAvatarFile(null);
      addToast('Profile updated successfully! ✨');
    } catch (err) {
      addToast(err.message || 'Failed to update profile', 'error');
    } finally {
      setProfileSaving(false);
    }
  };

  // ─── Password Change ───────────────────────────────────────
  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      addToast('New password must be at least 6 characters', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      addToast('Passwords do not match', 'error');
      return;
    }

    setPasswordSaving(true);
    try {
      const data = { newPassword };
      if (hasLocalPassword) {
        data.currentPassword = currentPassword;
      }

      const result = await changePassword(data);
      updateUser(result.user);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      addToast('Password changed successfully! 🔒');
    } catch (err) {
      addToast(err.message || 'Failed to change password', 'error');
    } finally {
      setPasswordSaving(false);
    }
  };

  // ─── Google Link Success ────────────────────────────────────
  const handleGoogleSuccess = async (credentialResponse) => {
    if (!credentialResponse?.credential) {
      addToast('Google authentication credential missing', 'error');
      return;
    }
    setGoogleLinking(true);
    try {
      const result = await linkGoogle(credentialResponse.credential);
      updateUser(result.user);
      addToast('Google account linked successfully! 🔗');
    } catch (err) {
      addToast(err.message || 'Failed to link Google account', 'error');
    } finally {
      setGoogleLinking(false);
    }
  };

  const handleGoogleUnlink = async () => {
    setGoogleLinking(true);
    try {
      const result = await unlinkGoogle();
      updateUser(result.user);
      addToast('Google account unlinked 🔓');
    } catch (err) {
      addToast(err.message || 'Failed to unlink Google account', 'error');
    } finally {
      setGoogleLinking(false);
    }
  };

  // ─── Delete Account ─────────────────────────────────────────
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'I am sure to delete my account') return;

    setDeleting(true);
    try {
      await deleteAccount(deleteConfirmText);
      addToast('Account deleted permanently. Goodbye! 👋');
      await logout();
    } catch (err) {
      addToast(err.message || 'Failed to delete account', 'error');
      setDeleting(false);
    }
  };

  // ─── Initials fallback ──────────────────────────────────────
  const getInitials = (n) => {
    if (!n) return '?';
    return n
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal--account-manager" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2 className="modal__title">Account Manager</h2>
          <button className="modal__close" onClick={onClose}>✕</button>
        </div>

        <div className="account-manager">
          {/* ─── Profile Section ──────────────────────────────── */}
          <form className="account-section" onSubmit={handleProfileSave}>
            <h3 className="account-section__title">👤 Profile Information</h3>

            <div className="account-avatar-area">
              <div className="account-avatar">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Avatar"
                    className="account-avatar__img"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="account-avatar__initials">
                    {getInitials(name)}
                  </span>
                )}
              </div>
              <div className="account-avatar-actions">
                <button
                  type="button"
                  className="btn btn--sm btn--secondary"
                  onClick={() => fileInputRef.current?.click()}
                >
                  📷 Upload Photo
                </button>
                {avatarPreview && (
                  <button
                    type="button"
                    className="btn btn--sm btn--ghost"
                    onClick={handleRemoveAvatar}
                  >
                    🗑️ Remove
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleAvatarChange}
                  style={{ display: 'none' }}
                />
              </div>
            </div>

            <div className="account-field">
              <label className="account-field__label">Display Name</label>
              <input
                type="text"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={100}
                placeholder="Enter your name"
                required
              />
            </div>

            <div className="account-field">
              <label className="account-field__label">Email Address</label>
              <input
                type="email"
                className="form-input"
                value={user?.email || ''}
                disabled
                style={{ opacity: 0.6, cursor: 'not-allowed' }}
              />
              <span className="account-field__hint">Primary email address associated with your account</span>
            </div>

            <button
              type="submit"
              className="btn btn--primary btn--full"
              disabled={profileSaving}
            >
              {profileSaving ? 'Saving...' : '💾 Save Profile'}
            </button>
          </form>

          {/* ─── Password Section ─────────────────────────────── */}
          <form className="account-section" onSubmit={handlePasswordChange}>
            <h3 className="account-section__title">
              🔒 {hasLocalPassword ? 'Change Password' : 'Set Account Password'}
            </h3>

            {hasLocalPassword && (
              <div className="account-field">
                <label className="account-field__label">Current Password</label>
                <div className="account-password-wrapper">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    className="form-input"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    required
                  />
                  <button
                    type="button"
                    className="account-password-toggle"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    aria-label="Toggle password visibility"
                  >
                    {showCurrentPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>
            )}

            <div className="account-field">
              <label className="account-field__label">New Password</label>
              <div className="account-password-wrapper">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  className="form-input"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  minLength={6}
                  required
                />
                <button
                  type="button"
                  className="account-password-toggle"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  aria-label="Toggle password visibility"
                >
                  {showNewPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <div className="account-field">
              <label className="account-field__label">Confirm New Password</label>
              <input
                type="password"
                className="form-input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                minLength={6}
                required
              />
              {confirmPassword && newPassword !== confirmPassword && (
                <span className="account-field__error">Passwords do not match</span>
              )}
            </div>

            <button
              type="submit"
              className="btn btn--primary btn--full"
              disabled={passwordSaving || (newPassword && newPassword !== confirmPassword)}
            >
              {passwordSaving ? 'Updating...' : '🔑 Update Password'}
            </button>
          </form>

          {/* ─── Google Account Binding Section ────────────────── */}
          <div className="account-section">
            <h3 className="account-section__title">🔗 Google Account Binding</h3>
            <p className="account-section__desc">
              Bind your account with Google to easily log in using single sign-on.
            </p>

            {isGoogleLinked ? (
              <div className="account-google-status">
                <div className="account-google-badge account-google-badge--linked">
                  <span className="account-google-badge__icon">✅</span>
                  <div>
                    <span className="account-google-badge__text">Google Account Bound</span>
                    <span className="account-google-badge__hint">
                      Your Google account is linked for quick login
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn--sm btn--ghost account-google-unlink"
                  onClick={handleGoogleUnlink}
                  disabled={googleLinking}
                >
                  {googleLinking ? 'Unlinking...' : '🔓 Unbind Google'}
                </button>
              </div>
            ) : (
              <div className="account-google-status">
                <div className="account-google-badge account-google-badge--unlinked">
                  <span className="account-google-badge__icon">⚡</span>
                  <div>
                    <span className="account-google-badge__text">No Google Account Bound</span>
                    <span className="account-google-badge__hint">
                      Connect your Google account to log in with 1-click
                    </span>
                  </div>
                </div>
                <div className="account-google-btn-wrapper">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => addToast('Google linking failed', 'error')}
                    theme="filled_black"
                    size="medium"
                    shape="pill"
                    text="continue_with"
                  />
                </div>
              </div>
            )}
          </div>

          {/* ─── Danger Zone ───────────────────────────────────── */}
          <div className="account-section account-section--danger">
            <h3 className="account-section__title account-section__title--danger">
              ⚠️ Danger Zone
            </h3>
            <p className="account-danger-text">
              Permanently delete your account and all associated data including chapters,
              transactions, categories, payment methods, and recurring expenses.
              <strong> This action is irreversible.</strong>
            </p>

            <div className="account-field">
              <label className="account-field__label">
                To confirm, type: <code>I am sure to delete my account</code>
              </label>
              <input
                type="text"
                className="form-input account-danger-input"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="I am sure to delete my account"
              />
            </div>

            <button
              type="button"
              className="btn btn--danger btn--full"
              disabled={deleteConfirmText !== 'I am sure to delete my account' || deleting}
              onClick={handleDeleteAccount}
            >
              {deleting ? 'Deleting Account...' : '🗑️ Permanently Delete Account'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountManager;
