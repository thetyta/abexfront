'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Box, Heading, SimpleGrid, Text, Button, Center } from '@chakra-ui/react'
import { toaster } from '../../components/ui/toaster'
import '../../app/globals.css'
import ConfirmModal from '../../components/ui/confirm-modal'
import CreateProjectModal from '../../components/ui/create-project-modal'

export default function ProjetosPage() {
  const router = useRouter()
  const [projetos, setProjetos] = useState(null)
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const [confirmingProject, setConfirmingProject] = useState(null)
  const [confirmLoading, setConfirmLoading] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    (async () => {
      try {
        // require login
        const stored = localStorage.getItem('usuarioLogado')
        if (!stored) return router.push('/')
        const res = await fetch('http://localhost:3333/projetos')
        const data = await res.json()
        // try to filter by logged user if present
        let usuario = null
        try {
          usuario = JSON.parse(localStorage.getItem('usuarioLogado'))
        } catch (e) { usuario = null }

        if (usuario && Array.isArray(data)) {
          const filtered = data.filter(p => {
            if (!p) return false
            // responsible
            if (p.responsavel && Number(p.responsavel.id) === Number(usuario.id)) return true
            // collaborators
            if (Array.isArray(p.colaboradores) && p.colaboradores.some(c => Number(c.id) === Number(usuario.id))) return true
            return false
          })
          setProjetos(filtered)
        } else {
          setProjetos(Array.isArray(data) ? data : [])
        }
      } catch (err) {
        setProjetos([])
      } finally {
        setLoading(false)
      }
    })()
  }, [router])

  if (loading) return (
    <div className="dashboard-container"><main className="main-content"><div style={{ padding: 40 }}>Carregando projetos...</div></main></div>
  )

  return (
    <div className="dashboard-container">
      <main className="main-content">
        <header className="top-bar" style={{ display: 'flex', alignItems: 'center' }}>
          {/* left side empty so content below can align buttons as needed */}
          <div />
        </header>

        <section className="projects-section">
          <div className="projects-header-container">
            <div className="new-project-section">
              <button className="new-project-btn-large" onClick={() => setShowCreateModal(true)}>
                <i className="fas fa-plus" /> 
                <span>Novo Projeto</span>
              </button>
            </div>
            <hr className="projects-main-separator" />
          </div>
          
          <div className="projects-content">
            <div className="projects-header-title">
              <h2>Seus Projetos</h2>
              <span className="projects-count">{projetos ? projetos.length : 0} projetos</span>
            </div>
            <div className="projects-grid">
            {(!projetos || projetos.length === 0) ? (
              <div className="empty-state">
                <div className="empty-icon">
                  <i className="fas fa-folder-open"></i>
                </div>
                <h3>Nenhum projeto encontrado</h3>
                <p>Crie seu primeiro projeto para começar</p>
              </div>
            ) : (
              projetos.map(p => (
                <div key={p.id} className={`project-card-taiga ${selectedId === p.id ? 'selected' : ''}`} onClick={() => setSelectedId(p.id)}>
                  <div className="project-card-header">
                    <div className="project-avatar">
                      <span>{p.nome.charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="project-info">
                      <h3 className="project-name">{p.nome}</h3>
                      <p className="project-description">{p.descricao}</p>
                    </div>
                  </div>
                  
                  <div className="project-meta">
                    <span className="project-type">{p.tipo}</span>
                  </div>
                  
                  <div className="project-actions">
                    <button 
                      className="btn-action primary" 
                      onClick={(e) => { e.stopPropagation(); router.push(`/projetos/${p.id}/kanban`) }}
                    >
                      <i className="fas fa-columns"></i>
                      Abrir Projeto
                    </button>
                    <button 
                      className="btn-action danger" 
                      onClick={(e) => { e.stopPropagation(); setConfirmingProject(p) }}
                    >
                      <i className="fas fa-trash"></i>
                      Excluir
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
            <ConfirmModal
              isOpen={!!confirmingProject}
              title={confirmingProject ? `Excluir projeto "${confirmingProject.nome}"` : 'Excluir projeto'}
              description={confirmingProject ? 'Esta ação é irreversível. Deseja continuar?' : ''}
              confirmLabel="Excluir"
              cancelLabel="Cancelar"
              loading={confirmLoading}
              onCancel={() => { if (!confirmLoading) setConfirmingProject(null) }}
              onConfirm={async () => {
                if (!confirmingProject) return
                try {
                  setConfirmLoading(true)
                  setDeletingId(confirmingProject.id)
                  const res = await fetch(`http://localhost:3333/projetos/${confirmingProject.id}`, { method: 'DELETE' })
                  if (!res.ok) throw new Error('Erro ao deletar projeto')
                  setProjetos(prev => prev.filter(pr => pr.id !== confirmingProject.id))
                  try {
                    toaster.create({ title: 'Projeto excluído', description: `Projeto "${confirmingProject.nome}" foi removido.`, status: 'success' })
                  } catch (e) {
                    if (typeof window !== 'undefined' && window.__TOASTER && window.__TOASTER.create) {
                      window.__TOASTER.create({ title: 'Projeto excluído', description: `Projeto "${confirmingProject.nome}" foi removido.`, status: 'success' })
                    } else {
                      alert(`Projeto "${confirmingProject.nome}" excluído`)
                    }
                  }
                  setConfirmingProject(null)
                } catch (err) {
                  console.error(err)
                  try {
                    toaster.create({ title: 'Erro', description: 'Não foi possível deletar o projeto', status: 'error' })
                  } catch (e) {
                    if (typeof window !== 'undefined' && window.__TOASTER && window.__TOASTER.create) {
                      window.__TOASTER.create({ title: 'Erro', description: 'Não foi possível deletar o projeto', status: 'error' })
                    } else {
                      alert('Não foi possível deletar o projeto')
                    }
                  }
                } finally {
                  setConfirmLoading(false)
                  setDeletingId(null)
                }
              }}
            />
            <CreateProjectModal
              isOpen={showCreateModal}
              onClose={() => setShowCreateModal(false)}
              onCreate={(created) => {
                // append to list and select
                setProjetos(prev => prev ? [created, ...prev] : [created])
                setShowCreateModal(false)
                setSelectedId(created.id)
              }}
            />
          </div>
        </section>
      </main>
    </div>
  )
}
