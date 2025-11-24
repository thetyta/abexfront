'use client'

import React, { useState, useEffect } from 'react'

export default function EditColumnModal({ isOpen, onClose, onUpdate, column }) {
  const [columnName, setColumnName] = useState('')
  const [columnType, setColumnType] = useState('PADRAO')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen && column) {
      setColumnName(column.nome)
      setColumnType(column.tipo || 'PADRAO')
    }
  }, [isOpen, column])

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!columnName.trim()) return

    setLoading(true)
    try {
      await onUpdate(column.id, { nome: columnName, tipo: columnType })
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
          <h2>Editar Coluna</h2>
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

          <div className="form-group">
            <label htmlFor="columnType">Tipo da Coluna</label>
            <select
              id="columnType"
              value={columnType}
              onChange={(e) => setColumnType(e.target.value)}
              className="form-select"
            >
              <option value="PADRAO">Padrão (Sem alteração de status)</option>
              <option value="PENDENTE">Pendente</option>
              <option value="EM_ANDAMENTO">Em Andamento</option>
              <option value="CONCLUSAO">Conclusão (Concluída)</option>
              <option value="CANCELADA">Cancelada</option>
            </select>
            <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
              Tarefas movidas para esta coluna terão seu status atualizado automaticamente.
            </p>
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
                  Salvando...
                </>
              ) : (
                <>
                  <i className="fas fa-save"></i>
                  Salvar Alterações
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
