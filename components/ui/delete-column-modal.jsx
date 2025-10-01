'use client'

import React, { useState } from 'react'

export default function DeleteColumnModal({
  isOpen,
  column,
  onConfirm,
  onCancel
}) {
  const [loading, setLoading] = useState(false)

  if (!isOpen || !column) return null

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
      <div className="confirm-modal" style={{ maxWidth: '500px' }}>
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
            Excluir coluna "{column.nome}"?
          </h3>
          <p className="confirm-modal-desc" style={{ marginBottom: '12px' }}>
            Esta ação é <strong>irreversível</strong>.
          </p>
          <div style={{ 
            background: '#fef2f2', 
            border: '1px solid #fecaca',
            borderRadius: '8px',
            padding: '12px',
            marginTop: '16px'
          }}>
            <p style={{ margin: 0, fontSize: '14px', color: '#dc2626', fontWeight: '500' }}>
              <i className="fas fa-trash" style={{ marginRight: '8px' }}></i>
              {column.tarefas?.length || 0} {(column.tarefas?.length || 0) === 1 ? 'tarefa será excluída' : 'tarefas serão excluídas'} junto com esta coluna.
            </p>
          </div>
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
            {loading ? 'Excluindo...' : 'Sim, excluir coluna'}
          </button>
        </div>
      </div>
    </div>
  )
}
