'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../lib/hooks/useAuth'
import { toaster } from '../../components/ui/toaster'
import styles from './configuracoes.module.css'

export default function ConfiguracoesPage() {
  useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    login: '',
    senhaHash: '' // Optional: for password change
  })

  useEffect(() => {
    const loadUser = () => {
      try {
        const user = JSON.parse(localStorage.getItem('usuarioLogado'))
        if (user) {
          setFormData({
            nome: user.nome || '',
            email: user.email || '',
            login: user.login || '',
            senhaHash: ''
          })
        }
      } catch (e) {
        console.error(e)
      }
    }
    loadUser()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const user = JSON.parse(localStorage.getItem('usuarioLogado'))
      const token = localStorage.getItem('token')
      
      const body = {
        nome: formData.nome,
        email: formData.email,
        login: formData.login
      }

      if (formData.senhaHash) {
        body.senhaHash = formData.senhaHash
      }

      const response = await fetch(`http://localhost:3333/usuarios/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      })

      if (!response.ok) throw new Error('Erro ao atualizar perfil')

      const data = await response.json()
      
      // Update local storage
      if (data.usuario) {
        localStorage.setItem('usuarioLogado', JSON.stringify(data.usuario))
      }
      
      if (data.token) {
        localStorage.setItem('token', data.token)
      }
      
      toaster.create({
        title: 'Sucesso',
        description: 'Perfil atualizado com sucesso',
        status: 'success'
      })
      
      // Clear password field
      setFormData(prev => ({ ...prev, senhaHash: '' }))
      
    } catch (error) {
      console.error(error)
      toaster.create({
        title: 'Erro',
        description: 'Não foi possível atualizar o perfil',
        status: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Configurações da Conta</h1>
        <p className={styles.subtitle}>Gerencie suas informações pessoais e preferências de acesso.</p>

        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="nome">Nome Completo</label>
            <input
              id="nome"
              name="nome"
              type="text"
              className={styles.input}
              value={formData.nome}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              className={styles.input}
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="login">Nome de Usuário (Login)</label>
            <input
              id="login"
              name="login"
              type="text"
              className={styles.input}
              value={formData.login}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="senhaHash">Nova Senha (Opcional)</label>
            <input
              id="senhaHash"
              name="senhaHash"
              type="password"
              className={styles.input}
              value={formData.senhaHash}
              onChange={handleChange}
              placeholder="Deixe em branco para manter a atual"
              minLength={6}
            />
          </div>

          <div className={styles.actions}>
            <button 
              type="button" 
              className={`${styles.button} ${styles.secondaryButton}`}
              onClick={() => router.back()}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className={`${styles.button} ${styles.primaryButton}`}
              disabled={loading}
            >
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
