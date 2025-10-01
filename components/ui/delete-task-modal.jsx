'use client'

import React, { useState } from 'react'

export default function DeleteTaskModal({
  isOpen,
  task,
  onConfirm,
  onCancel
}) {
  const [loading, setLoading] = useState(false)

  if (!isOpen || !task) return null

  const handleConfirm = async () => {
    setLoading(true)
    try {
      await onConfirm()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay">
      <div className="confirm-modal" style={{ maxWidth: '480px' }}>
        <div style={{ marginBottom: '16px', textAlign: 'center' }}>
          <div style={{ 
            width: '64px', 
            height: '64px', 
            background: '#fee2e2', 
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px'
          }}>
            <i className="fas fa-exclamation-triangle" style={{ fontSize: '28px', color: '#dc2626' }}></i>
          </div>
          <h3 className="confirm-modal-title" style={{ marginBottom: '8px' }}>
            Excluir tarefa "{task.nome}"?
          </h3>
          <p className="confirm-modal-desc">
            Esta ação é <strong>irreversível</strong> e a tarefa será permanentemente removida.
          </p>
        </div>
        <div className="confirm-actions">
          <button 
            className="btn-action secondary" 
            onClick={onCancel} 
            disabled={loading}
          >
            Cancelar
          </button>
          <button 
            className="btn-action danger" 
            onClick={handleConfirm} 
            disabled={loading}
          >
            {loading ? 'Excluindo...' : 'Sim, excluir tarefa'}
          </button>
        </div>
      </div>
    </div>
  )
}
