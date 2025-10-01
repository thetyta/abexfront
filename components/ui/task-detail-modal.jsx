'use client'

import { useState } from 'react'

export default function TaskDetailModal({ isOpen, onClose, tarefa, onEdit, onDelete, onConfirmDelete }) {
  const [loading, setLoading] = useState(false)

  if (!isOpen || !tarefa) return null

  const getPriorityColor = (prioridade) => {
    switch(prioridade?.toLowerCase()) {
      case 'baixa': return '#0369a1'
      case 'media': return '#a16207'
      case 'alta': return '#dc2626'
      case 'critica': return '#7c2d12'
      default: return '#a16207'
    }
  }

  const handleDeleteClick = () => {
    // Apenas dispara o evento para abrir o modal de confirmação
    if (onConfirmDelete) {
      onConfirmDelete(tarefa)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content task-detail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{tarefa.nome}</h2>
          <button className="modal-close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="task-detail-body">
          <div className="task-detail-section">
            <h3>Descrição</h3>
            <p className="task-description">
              {tarefa.descricao || 'Nenhuma descrição fornecida'}
            </p>
          </div>

          <div className="task-detail-meta">
            <div className="task-meta-item">
              <span className="meta-label">Prioridade:</span>
              <span 
                className="priority-badge" 
                style={{ 
                  backgroundColor: getPriorityColor(tarefa.prioridade),
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: '500'
                }}
              >
                {tarefa.prioridade || 'MÉDIA'}
              </span>
            </div>

            <div className="task-meta-item">
              <span className="meta-label">Status:</span>
              <span className="status-badge">{tarefa.status || 'PENDENTE'}</span>
            </div>

            {tarefa.data_vencimento && (
              <div className="task-meta-item">
                <span className="meta-label">Vencimento:</span>
                <span className="date-badge">
                  <i className="fas fa-calendar"></i>
                  {new Date(tarefa.data_vencimento).toLocaleDateString('pt-BR')}
                </span>
              </div>
            )}

            {tarefa.data_inicio && (
              <div className="task-meta-item">
                <span className="meta-label">Data de Início:</span>
                <span className="date-badge">
                  {new Date(tarefa.data_inicio).toLocaleDateString('pt-BR')}
                </span>
              </div>
            )}

            {tarefa.data_fim && (
              <div className="task-meta-item">
                <span className="meta-label">Data de Fim:</span>
                <span className="date-badge">
                  {new Date(tarefa.data_fim).toLocaleDateString('pt-BR')}
                </span>
              </div>
            )}
          </div>

          <div className="task-detail-actions">
            <button 
              className="btn-action secondary"
              onClick={() => onEdit && onEdit(tarefa)}
              disabled={loading}
            >
              <i className="fas fa-edit"></i>
              Editar
            </button>
            <button 
              className="btn-action danger"
              onClick={handleDeleteClick}
              disabled={loading}
            >
              <i className="fas fa-trash"></i>
              Excluir
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}