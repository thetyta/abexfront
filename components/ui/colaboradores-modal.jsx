'use client'

import { useState, useEffect } from 'react'
import { toaster } from './toaster'

export default function ColaboradoresModal({ isOpen, onClose, projetoId, colaboradoresAtuais = [], onUpdate }) {
  const [usuarios, setUsuarios] = useState([])
  const [selectedUsuarios, setSelectedUsuarios] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingUsers, setLoadingUsers] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchUsuarios()
    }
  }, [isOpen])

  const fetchUsuarios = async () => {
    setLoadingUsers(true)
    try {
      const res = await fetch('http://localhost:3333/usuarios')
      const data = await res.json()
      setUsuarios(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Erro ao carregar usuários:', err)
      try {
        toaster.create({ title: 'Erro', description: 'Não foi possível carregar usuários', status: 'error' })
      } catch (e) {
        alert('Não foi possível carregar usuários')
      }
    } finally {
      setLoadingUsers(false)
    }
  }

  const handleToggleUsuario = (usuarioId) => {
    setSelectedUsuarios(prev => {
      if (prev.includes(usuarioId)) {
        return prev.filter(id => id !== usuarioId)
      } else {
        return [...prev, usuarioId]
      }
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (selectedUsuarios.length === 0) {
      try {
        toaster.create({ title: 'Aviso', description: 'Selecione pelo menos um colaborador', status: 'warning' })
      } catch (e) {
        alert('Selecione pelo menos um colaborador')
      }
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`http://localhost:3333/projetos/${projetoId}/colaboradores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ colaboradores: selectedUsuarios })
      })

      if (!res.ok) throw new Error('Erro ao adicionar colaboradores')

      const data = await res.json()
      
      try {
        toaster.create({ 
          title: 'Sucesso', 
          description: `${selectedUsuarios.length} colaborador(es) adicionado(s) ao projeto`, 
          status: 'success' 
        })
      } catch (e) {
        alert(`${selectedUsuarios.length} colaborador(es) adicionado(s)`)
      }

      if (onUpdate) onUpdate(data.projeto)
      setSelectedUsuarios([])
      onClose()
    } catch (err) {
      console.error(err)
      try {
        toaster.create({ title: 'Erro', description: 'Não foi possível adicionar colaboradores', status: 'error' })
      } catch (e) {
        alert('Não foi possível adicionar colaboradores')
      }
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  // IDs dos colaboradores atuais para marcar como já adicionados
  const colaboradoresIds = colaboradoresAtuais.map(c => c.id)

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '600px' }}>
        <div className="modal-header">
          <h2>Adicionar Colaboradores</h2>
          <button className="modal-close" onClick={() => !loading && onClose()} aria-label="Fechar">×</button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Selecione os usuários para adicionar ao projeto</label>
            
            {loadingUsers ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>
                Carregando usuários...
              </div>
            ) : (
              <div style={{ 
                maxHeight: '400px', 
                overflowY: 'auto', 
                border: '1px solid #e2e8f0', 
                borderRadius: '8px',
                padding: '8px'
              }}>
                {usuarios.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>
                    Nenhum usuário disponível
                  </div>
                ) : (
                  usuarios.map(usuario => {
                    const jaEhColaborador = colaboradoresIds.includes(usuario.id)
                    const isSelected = selectedUsuarios.includes(usuario.id)
                    
                    return (
                      <div 
                        key={usuario.id}
                        style={{
                          padding: '12px',
                          margin: '4px 0',
                          borderRadius: '6px',
                          border: isSelected ? '2px solid var(--color-primary)' : '1px solid #e2e8f0',
                          background: jaEhColaborador ? '#f1f5f9' : (isSelected ? '#f0f9ff' : 'white'),
                          cursor: jaEhColaborador ? 'not-allowed' : 'pointer',
                          opacity: jaEhColaborador ? 0.6 : 1,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          transition: 'all 0.15s ease'
                        }}
                        onClick={() => !jaEhColaborador && handleToggleUsuario(usuario.id)}
                      >
                        <input 
                          type="checkbox" 
                          checked={isSelected}
                          disabled={jaEhColaborador}
                          onChange={() => {}}
                          style={{ cursor: jaEhColaborador ? 'not-allowed' : 'pointer' }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>
                            {usuario.nome}
                          </div>
                          <div style={{ fontSize: '13px', color: '#64748b' }}>
                            {usuario.email}
                          </div>
                        </div>
                        {jaEhColaborador && (
                          <span style={{ 
                            fontSize: '12px', 
                            color: '#64748b',
                            background: '#e2e8f0',
                            padding: '2px 8px',
                            borderRadius: '4px'
                          }}>
                            Já é colaborador
                          </span>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            )}
          </div>

          {selectedUsuarios.length > 0 && (
            <div style={{ 
              padding: '12px', 
              background: '#f0f9ff', 
              borderRadius: '8px',
              marginTop: '12px',
              border: '1px solid #bfdbfe'
            }}>
              <strong style={{ color: 'var(--color-primary)' }}>
                {selectedUsuarios.length} usuário(s) selecionado(s)
              </strong>
            </div>
          )}

          <div className="modal-actions">
            <button 
              type="button" 
              className="btn-cancel" 
              onClick={onClose} 
              disabled={loading}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="btn-submit" 
              disabled={loading || selectedUsuarios.length === 0}
            >
              {loading ? 'Adicionando...' : `Adicionar ${selectedUsuarios.length > 0 ? `(${selectedUsuarios.length})` : ''}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
