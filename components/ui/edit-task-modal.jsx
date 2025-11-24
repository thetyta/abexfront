'use client'

import { useState, useEffect } from 'react'
import { toaster } from './toaster'

export default function EditTaskModal({ isOpen, onClose, tarefa, colunas, onTaskUpdated }) {
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    coluna_id: '',
    prioridade: 'MEDIA',
    data_prazo: ''
  })

  useEffect(() => {
    if (isOpen && tarefa) {
      setFormData({
        nome: tarefa.nome || '',
        descricao: tarefa.descricao || '',
        coluna_id: tarefa.coluna_id || (colunas && colunas.length > 0 ? colunas[0].id : ''),
        prioridade: tarefa.prioridade || 'MEDIA',
        data_prazo: tarefa.data_prazo || ''
      })
    }
  }, [isOpen, tarefa, colunas])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.nome.trim()) {
      toaster.create({ 
        title: 'Erro', 
        description: 'O nome da tarefa é obrigatório', 
        status: 'error' 
      })
      return
    }

    setSaving(true)
    try {
      const response = await fetch(`http://localhost:3333/tarefas/${tarefa.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nome: formData.nome,
          descricao: formData.descricao,
          coluna_id: formData.coluna_id,
          prioridade: formData.prioridade,
          data_prazo: formData.data_prazo || null
        })
      })

      if (!response.ok) throw new Error('Erro ao atualizar tarefa')

      toaster.create({ 
        title: 'Sucesso', 
        description: 'Tarefa atualizada com sucesso!', 
        status: 'success' 
      })
      
      if (onTaskUpdated) onTaskUpdated()
      onClose()
    } catch (err) {
      console.error(err)
      toaster.create({ 
        title: 'Erro', 
        description: 'Não foi possível atualizar a tarefa', 
        status: 'error' 
      })
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (!isOpen || !tarefa) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Editar Tarefa</h2>
          <button className="modal-close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="nome">Nome da Tarefa * <span style={{color: '#64748b', fontSize: '12px'}}>({formData.nome.length}/255)</span></label>
            <input
              id="nome"
              type="text"
              value={formData.nome}
              onChange={(e) => handleChange('nome', e.target.value)}
              placeholder="Digite o nome da tarefa..."
              className="form-input"
              maxLength={255}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="descricao">Descrição <span style={{color: '#64748b', fontSize: '12px'}}>({formData.descricao.length}/2000)</span></label>
            <textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => handleChange('descricao', e.target.value)}
              placeholder="Descreva a tarefa em detalhes..."
              className="form-textarea"
              rows="3"
              maxLength={2000}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="coluna">Coluna</label>
              <select
                id="coluna"
                value={formData.coluna_id}
                onChange={(e) => handleChange('coluna_id', e.target.value)}
                className="form-select"
              >
                {colunas && colunas.map(coluna => (
                  <option key={coluna.id} value={coluna.id}>
                    {coluna.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="prioridade">Prioridade</label>
              <select
                id="prioridade"
                value={formData.prioridade}
                onChange={(e) => handleChange('prioridade', e.target.value)}
                className="form-select"
              >
                <option value="BAIXA">Baixa</option>
                <option value="MEDIA">Média</option>
                <option value="ALTA">Alta</option>
                <option value="CRITICA">Crítica</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="data_prazo">Data de Vencimento</label>
            <input
              id="data_prazo"
              type="date"
              value={formData.data_prazo}
              onChange={(e) => handleChange('data_prazo', e.target.value)}
              className="form-input"
            />
          </div>

          <div className="modal-actions">
            <button
              type="button"
              onClick={onClose}
              className="btn-cancel"
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-submit"
              disabled={saving}
            >
              {saving ? (
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
