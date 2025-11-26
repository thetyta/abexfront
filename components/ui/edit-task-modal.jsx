'use client'

import { useState, useEffect } from 'react'
import { toaster } from './toaster'

export default function EditTaskModal({ isOpen, onClose, tarefa, colunas, onTaskUpdated }) {
  const [saving, setSaving] = useState(false)
  const [colaboradores, setColaboradores] = useState([])
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    coluna_id: '',
    prioridade: 'MEDIA',
    data_prazo: '',
    responsaveis_ids: []
  })

  useEffect(() => {
    if (isOpen && tarefa) {
      setFormData({
        nome: tarefa.nome || '',
        descricao: tarefa.descricao || '',
        coluna_id: tarefa.coluna_id || (colunas && colunas.length > 0 ? colunas[0].id : ''),
        prioridade: tarefa.prioridade || 'MEDIA',
        data_prazo: tarefa.data_prazo || '',
        responsaveis_ids: tarefa.responsaveis && Array.isArray(tarefa.responsaveis) ? tarefa.responsaveis.map(r => r.id) : []
      })
    }
  }, [isOpen, tarefa, colunas])

  useEffect(() => {
    if (isOpen && tarefa) {
      // Buscar colaboradores do projeto da tarefa
      if (tarefa.projeto_id) {
        fetch(`http://localhost:3333/projetos/${tarefa.projeto_id}`)
          .then(res => res.json())
          .then(data => {
            const lista = []
            if (data.responsavel) lista.push(data.responsavel)
            if (data.colaboradores) {
              data.colaboradores.forEach(c => {
                if (!lista.find(l => l.id === c.id)) {
                  lista.push(c)
                }
              })
            }
            setColaboradores(lista)
          })
          .catch(err => console.error('Erro ao buscar colaboradores:', err))
      }
    }
  }, [isOpen, tarefa])

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
          data_prazo: formData.data_prazo || null,
          responsaveis_ids: formData.responsaveis_ids
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

          <div className="form-group">
            <label>Responsáveis</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#f9fafb', minHeight: '40px' }}>
              {colaboradores.length > 0 ? (
                colaboradores.map(colab => (
                  <label key={colab.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 8px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>
                    <input
                      type="checkbox"
                      checked={formData.responsaveis_ids.includes(colab.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData(prev => ({ ...prev, responsaveis_ids: [...prev.responsaveis_ids, colab.id] }))
                        } else {
                          setFormData(prev => ({ ...prev, responsaveis_ids: prev.responsaveis_ids.filter(id => id !== colab.id) }))
                        }
                      }}
                      style={{ cursor: 'pointer' }}
                    />
                    {colab.nome}
                  </label>
                ))
              ) : (
                <span style={{ color: '#94a3b8', fontSize: '14px' }}>Carregando responsáveis...</span>
              )}
            </div>
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
