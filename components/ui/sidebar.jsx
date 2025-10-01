"use client"

import React, { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'

export default function Sidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem('usuarioLogado')
      if (raw) setUser(JSON.parse(raw))
    } catch (e) { /* ignore */ }
  }, [])

  // hide sidebar on login and cadastro pages
  const showSidebar = typeof pathname === 'string' && !(pathname === '/' || pathname.startsWith('/cadastro'))
  if (!showSidebar) return null

  const handleLogout = () => {
    localStorage.removeItem('usuarioLogado')
    router.push('/')
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <i>◼</i>
        <span>TASKCARE</span>
      </div>

      <ul className="sidebar-menu">
        <li className="menu-item"><a onClick={() => router.push('/dashboard')}>Dashboard</a></li>
        <li className="menu-item"><a onClick={() => router.push('/projetos')}>Projetos</a></li>
      </ul>

      <div style={{ marginTop: 'auto', padding: 16 }}>
        {user ? (
          <div className="user-profile">
            <img src={user.avatar || '/favicon.ico'} alt="avatar" />
            <div className="user-info">
              <div id="user-name">{user.nome || user.login}</div>
              <a className="edit-profile-link" onClick={() => router.push('/usuario')}>Ver Perfil</a>
            </div>
          </div>
        ) : (
          <div style={{ color: 'var(--color-muted)', marginBottom: 8 }}>Não logado</div>
        )}
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button className="new-project-btn" onClick={() => router.push('/projetos/novo')}>Novo</button>
          <button className="delete-task-btn" onClick={handleLogout}>Sair</button>
        </div>
      </div>
    </aside>
  )
}
