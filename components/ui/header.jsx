'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import styles from './header.module.css'
import Image from 'next/image'

export default function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem('usuarioLogado')
      if (raw) setUser(JSON.parse(raw))
    } catch (e) { /* ignore */ }

    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Hide header on login and cadastro pages
  const showHeader = typeof pathname === 'string' && !(pathname === '/' || pathname.startsWith('/cadastro'))
  if (!showHeader) return null

  const handleLogout = () => {
    localStorage.removeItem('usuarioLogado')
    localStorage.removeItem('token')
    router.push('/')
  }

  const getInitials = (name) => {
    if (!name) return 'U'
    return name.substring(0, 2).toUpperCase()
  }

  return (
    <header className={styles.header}>
      <div className={styles.logo} onClick={() => router.push('/projetos')}>
        <i className="fas fa-check-square"></i>
        <Image src="/logo.png" alt="TaskCare Logo" width={120} height={30} />
      </div>

      <nav className={styles.nav}>
        <a 
          className={`${styles.navLink} ${pathname === '/dashboard' ? styles.active : ''}`}
          onClick={() => router.push('/dashboard')}
        >
          Dashboard
        </a>
        <a 
          className={`${styles.navLink} ${pathname.startsWith('/projetos') ? styles.active : ''}`}
          onClick={() => router.push('/projetos')}
        >
          Projetos
        </a>
      </nav>

      <div className={styles.userSection} ref={dropdownRef}>
        {user ? (
          <>
            <div 
              className={styles.userInfo} 
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <div className={styles.avatar}>
                {user.avatar ? (
                  <img src={user.avatar} alt="avatar" />
                ) : (
                  getInitials(user.nome || user.login)
                )}
              </div>
              <span className={styles.userName}>{user.nome || user.login}</span>
              <i className={`fas fa-chevron-down ${dropdownOpen ? 'fa-rotate-180' : ''}`} style={{ fontSize: '12px', transition: 'transform 0.2s' }}></i>
            </div>

            <div className={`${styles.dropdown} ${dropdownOpen ? styles.open : ''}`}>
              <div className={styles.dropdownItem} onClick={() => { setDropdownOpen(false); router.push('/configuracoes'); }}>
                <i className="fas fa-cog"></i>
                Configurações
              </div>
              <div className={`${styles.dropdownItem} ${styles.danger}`} onClick={handleLogout}>
                <i className="fas fa-sign-out-alt"></i>
                Sair
              </div>
            </div>
          </>
        ) : (
          <a className={styles.navLink} onClick={() => router.push('/')}>Login</a>
        )}
      </div>
    </header>
  )
}
