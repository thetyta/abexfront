'use client'

import React, { useState, useEffect } from 'react'

export default function NewColumnModal({ isOpen, onClose, onCreate, initialValue = '' }) {
  const [columnName, setColumnName] = useState(initialValue)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setColumnName(initialValue)
    }
  }, [isOpen, initialValue])

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!columnName.trim()) return

    setLoading(true)
    try {
      await onCreate(columnName)
      setColumnName('')
      onClose()
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '450px' }}>
        <div className="modal-header">
          <h2>Nova Coluna</h2>
          <button className="modal-close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="columnName">
              Nome da Coluna * 
              <span style={{color: '#64748b', fontSize: '12px', marginLeft: '8px'}}>
                ({columnName.length}/255)
              </span>
            </label>
            <input
              id="columnName"
              type="text"
              value={columnName}
              onChange={(e) => setColumnName(e.target.value)}
              placeholder="Digite o nome da coluna..."
              className="form-input"
              maxLength={255}
              required
              autoFocus
            />
          </div>

          <div className="modal-actions">
            <button
              type="button"
              onClick={onClose}
              className="btn-cancel"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-submit"
              disabled={loading || !columnName.trim()}
            >
              {loading ? (
                <>
                  <div className="btn-spinner"></div>
                  Criando...
                </>
              ) : (
                <>
                  <i className="fas fa-plus"></i>
                  Criar Coluna
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
