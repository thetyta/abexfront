'use client'

import React from 'react'

export default function ConfirmModal({
  isOpen,
  title,
  description,
  confirmLabel = 'Excluir',
  cancelLabel = 'Cancelar',
  onConfirm,
  onCancel,
  loading = false,
}) {
  if (!isOpen) return null

  return (
    <div className="modal-overlay">
      <div className="confirm-modal">
        <h3 className="confirm-modal-title">{title}</h3>
        {description ? <p className="confirm-modal-desc">{description}</p> : null}
        <div className="confirm-actions">
          <button className="btn-action danger" onClick={onConfirm} disabled={loading}>
            {loading ? 'Excluindo...' : confirmLabel}
          </button>
          <button className="btn-action secondary" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
