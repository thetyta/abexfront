'use client'

import React, { useEffect, useState } from 'react'
import { toaster } from './toaster'

export default function CreateProjectModal({ isOpen, onClose, onCreate, defaultValues = {} }) {
  const [form, setForm] = useState({
    nome: defaultValues.nome || '',
    descricao: defaultValues.descricao || '',
    // backend expects enum values: 'PESSOAL' or 'TRABALHO'
    tipo: defaultValues.tipo || 'PESSOAL',
    responsavel_id: defaultValues.responsavel_id || null,
    responsavel_nome: ''
  })

  useEffect(() => {
    // try to autofill responsavel_id and name from localStorage.usuarioLogado
    try {
      const stored = localStorage.getItem('usuarioLogado')
      if (stored) {
        const user = JSON.parse(stored)
        if (user && user.id) setForm(prev => ({ ...prev, responsavel_id: Number(user.id), responsavel_nome: user.nome || '' }))
      }
    } catch (e) {
      // ignore
    }
  }, [])
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.nome || form.nome.trim() === '') {
      try { toaster.create({ title: 'Erro', description: 'Nome do projeto é obrigatório', status: 'error' }) } catch (e) { alert('Nome do projeto é obrigatório') }
      return
    }
    try {
      setLoading(true)
      const res = await fetch('http://localhost:3333/projetos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      if (!res.ok) throw new Error('Erro ao criar projeto')
      const created = await res.json()
      try { toaster.create({ title: 'Projeto criado', description: `Projeto "${created.nome}" criado com sucesso.`, status: 'success' }) } catch (e) { if (typeof window !== 'undefined' && window.__TOASTER && window.__TOASTER.create) { window.__TOASTER.create({ title: 'Projeto criado', description: `Projeto "${created.nome}" criado com sucesso.`, status: 'success' }) } }
      if (onCreate) onCreate(created)
      onClose()
    } catch (err) {
      console.error(err)
      try { toaster.create({ title: 'Erro', description: 'Não foi possível criar o projeto', status: 'error' }) } catch (e) { alert('Não foi possível criar o projeto') }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Novo projeto</h2>
          <button className="modal-close" onClick={() => !loading && onClose()} aria-label="Fechar">×</button>
        </div>
        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nome <span style={{color: '#64748b', fontSize: '12px'}}>({form.nome.length}/255)</span></label>
            <input name="nome" value={form.nome} onChange={handleChange} className="form-input" placeholder="Nome do projeto" maxLength={255} />
          </div>
          <div className="form-group">
            <label>Descrição <span style={{color: '#64748b', fontSize: '12px'}}>({form.descricao.length}/1000)</span></label>
            <textarea name="descricao" value={form.descricao} onChange={handleChange} className="form-textarea" placeholder="Descrição curta (opcional)" maxLength={1000} />
          </div>
          <div className="form-group">
            <label>Tipo</label>
            <select name="tipo" value={form.tipo} onChange={handleChange} className="form-select">
              <option value="PESSOAL">Pessoal</option>
              <option value="TRABALHO">Trabalho</option>
            </select>
          </div>
          <div className="form-group">
            <label>Responsável</label>
            <input value={form.responsavel_nome || ''} readOnly className="form-input" />
            <input type="hidden" name="responsavel_id" value={form.responsavel_id || ''} />
            <small style={{ color: '#64748b' }}>Responsável será o usuário logado por padrão</small>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={() => !loading && onClose()} disabled={loading}>Cancelar</button>
            <button type="submit" className="btn-submit" disabled={loading}>{loading ? 'Criando...' : 'Criar Projeto'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
