'use client';

import { useState } from 'react';
import { toaster } from '../components/ui/toaster'
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function LoginPage() {
  const [formData, setFormData] = useState({
    login: '',
    senha: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Chamar endpoint de login do backend
      const response = await fetch('http://localhost:3333/usuarios/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          login: formData.login,
          senha: formData.senha
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || 'Login ou senha incorretos');
        try {
          toaster.create({ title: 'Erro de login', description: errorData.error || 'Login ou senha incorretos', status: 'error' })
        } catch (e) {
          if (typeof window !== 'undefined' && window.__TOASTER && window.__TOASTER.create) {
            window.__TOASTER.create({ title: 'Erro de login', description: errorData.error || 'Login ou senha incorretos', status: 'error' })
          }
        }
        return;
      }

      const data = await response.json();
      const usuario = data.usuario;
      const token = data.token;

      // Salvar o usuário logado E o token no localStorage
      localStorage.setItem('usuarioLogado', JSON.stringify(usuario));
      localStorage.setItem('token', token);
      
      // Exibir mensagem de sucesso
      try {
        toaster.create({ title: 'Login bem-sucedido', description: `Olá ${usuario.nome || usuario.login}`, status: 'success' })
      } catch (e) {
        if (typeof window !== 'undefined' && window.__TOASTER && window.__TOASTER.create) {
          window.__TOASTER.create({ title: 'Login bem-sucedido', description: `Olá ${usuario.nome || usuario.login}`, status: 'success' })
        }
      }
      
      // Redirecionar para o dashboard
      router.push('/projetos');
    } catch (err) {
      setError('Erro ao fazer login. Verifique se o servidor está rodando.');
      try {
        toaster.create({ title: 'Erro', description: 'Erro ao conectar com o servidor', status: 'error' })
      } catch (e) {
        if (typeof window !== 'undefined' && window.__TOASTER && window.__TOASTER.create) {
          window.__TOASTER.create({ title: 'Erro', description: 'Erro ao conectar com o servidor', status: 'error' })
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="form-container">
  <Image src='/logo.png' width={400} height={400} alt='Logo' style={{ display: 'block', margin: '-100px auto' }}/>
        
        {error && <div className="error">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="login">Login:</label>
            <input
              type="text"
              id="login"
              name="login"
              value={formData.login}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="senha">Senha:</label>
            <input
              type="password"
              id="senha"
              name="senha"
              value={formData.senha}
              onChange={handleChange}
              required
            />
          </div>
          
          <button type="submit" className="btn" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
        
        <span 
          className="link" 
          onClick={() => router.push('/cadastro')}
        >
          Não tem conta? Cadastre-se aqui
        </span>
      </div>
    </div>
  );
}
