"use client"

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Header() {
  const router = useRouter()
  const [user, setUser] = useState(null)

  useEffect(() => {
    try {
      const s = localStorage.getItem('usuarioLogado')
      if (s) setUser(JSON.parse(s))
    } catch (e) { setUser(null) }
  }, [])

  const handleLogout = () => {
    try { localStorage.removeItem('usuarioLogado') } catch (e) {}
    // redirect to login
    router.push('/')
  }

  return (
    <header className="app-header">
      <div className="app-header-inner">
        <a href="/projetos" className="app-logo">Abex III</a>
        <nav className="app-nav" style={{ display: 'flex', alignItems: 'center' }}>
          <a href="/projetos" style={{ marginRight: 12 }}>Projetos</a>
          <a href="/dashboard" style={{ marginRight: 12 }}>Dashboard</a>
          {user ? (
            <button onClick={handleLogout} style={{ marginLeft: 12 }} className="btn btn-secondary">Logout</button>
          ) : (
            <a href="/" style={{ marginLeft: 12 }}>Entrar</a>
          )}
        </nav>
      </div>
    </header>
  )
}
