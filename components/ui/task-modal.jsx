'use client'

import { useState, useEffect } from 'react'
import { toaster } from './toaster'

export default function TaskModal({ isOpen, onClose, colunas, projetoId, colunaId = null }) {
  const [saving, setSaving] = useState(false)
  const [colaboradores, setColaboradores] = useState([])
  const [formData, setFormData] = useState(() => ({
    nome: '',
    descricao: '',
    coluna_id: colunaId || (colunas && colunas.length > 0 ? colunas[0].id : ''),
    prioridade: 'MEDIA',
    data_vencimento: '',
    responsavel_id: ''
  }))

  // Fetch collaborators when modal opens
  useEffect(() => {
    if (isOpen && projetoId) {
      fetch(`http://localhost:3333/projetos/${projetoId}`)
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
          
          // Set default responsible to current user if they are in the list, otherwise the project responsible
          const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado'))
          if (usuarioLogado && !formData.responsavel_id) {
             setFormData(prev => ({ ...prev, responsavel_id: usuarioLogado.id }))
          }
        })
        .catch(err => console.error('Erro ao buscar colaboradores:', err))
    }
  }, [isOpen, projetoId])

  // Reset form when modal opens or when colunaId/colunas change so the header button opens a fresh form
  useEffect(() => {
    if (!isOpen) return
    const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado'))
    setFormData({
      nome: '',
      descricao: '',
      coluna_id: colunaId || (colunas && colunas.length > 0 ? colunas[0].id : ''),
      prioridade: 'MEDIA',
      data_vencimento: '',
      responsavel_id: usuarioLogado ? usuarioLogado.id : ''
    })
  }, [isOpen, colunaId, colunas])

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
      const usuario = JSON.parse(localStorage.getItem('usuarioLogado'))
      const response = await fetch('http://localhost:3333/tarefas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nome: formData.nome,
          descricao: formData.descricao,
          coluna_id: formData.coluna_id,
          prioridade: formData.prioridade,
          data_vencimento: formData.data_vencimento || null,
          responsavel_id: formData.responsavel_id,
          posicao: 0,
          projeto_id: parseInt(projetoId)
        })
      })

      if (!response.ok) throw new Error('Erro ao criar tarefa')

      toaster.create({ 
        title: 'Sucesso', 
        description: 'Tarefa criada com sucesso!', 
        status: 'success' 
      })
      
      // Reset form and close modal
      setFormData({
        nome: '',
        descricao: '',
        coluna_id: colunaId || (colunas.length > 0 ? colunas[0].id : ''),
        prioridade: 'MEDIA',
        data_vencimento: '',
        responsavel_id: ''
      })
      onClose()
      
      // Reload the page to show new task
      window.location.reload()
    } catch (err) {
      console.error(err)
      toaster.create({ 
        title: 'Erro', 
        description: 'Não foi possível criar a tarefa', 
        status: 'error' 
      })
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Nova Tarefa</h2>
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
                {colunas.map(coluna => (
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

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="responsavel">Responsável</label>
              <select
                id="responsavel"
                value={formData.responsavel_id}
                onChange={(e) => handleChange('responsavel_id', e.target.value)}
                className="form-select"
              >
                <option value="">Selecione um responsável</option>
                {colaboradores.map(colab => (
                  <option key={colab.id} value={colab.id}>
                    {colab.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="data_vencimento">Data de Vencimento</label>
              <input
                id="data_vencimento"
                type="date"
                value={formData.data_vencimento}
                onChange={(e) => handleChange('data_vencimento', e.target.value)}
                className="form-input"
              />
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
                  Criando...
                </>
              ) : (
                <>
                  <i className="fas fa-plus"></i>
                  Criar Tarefa
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}