import { useState } from 'react';

const ConfirmDialog = ({ isOpen, title, message, confirmText = 'Delete', cancelText = 'Cancel', variant = 'danger', onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay confirm-dialog-overlay" onClick={onCancel}>
      <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-dialog__icon">
          {variant === 'danger' ? '⚠️' : 'ℹ️'}
        </div>
        <h3 className="confirm-dialog__title">{title}</h3>
        {message && <p className="confirm-dialog__message">{message}</p>}
        <div className="confirm-dialog__actions">
          <button
            type="button"
            className="btn btn--secondary confirm-dialog__btn"
            onClick={onCancel}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={`btn confirm-dialog__btn ${variant === 'danger' ? 'btn--danger-fill' : 'btn--primary'}`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
