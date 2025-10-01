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
      // Fazer requisição para o backend para verificar o login
      const response = await fetch('http://localhost:3333/usuarios');
      const usuarios = await response.json();
      
      // Verificar se existe um usuário com o login e senha fornecidos
      // Observação: o backend armazena o campo como `senhaHash` (sem criptografia neste projeto),
      // então comparamos com esse campo.
      const usuario = usuarios.find(u => 
        u.login === formData.login && (u.senhaHash === formData.senha || u.senha === formData.senha)
      );

      if (usuario) {
        // Salvar o usuário logado no localStorage
        localStorage.setItem('usuarioLogado', JSON.stringify(usuario));
        // Redirecionar para o dashboard
        try {
          toaster.create({ title: 'Login bem-sucedido', description: `Olá ${usuario.nome || usuario.login}`, status: 'success' })
        } catch (e) {
          if (typeof window !== 'undefined' && window.__TOASTER && window.__TOASTER.create) {
            window.__TOASTER.create({ title: 'Login bem-sucedido', description: `Olá ${usuario.nome || usuario.login}`, status: 'success' })
          }
        }
        router.push('/projetos');
      } else {
        setError('Login ou senha incorretos');
        try {
          toaster.create({ title: 'Erro de login', description: 'Login ou senha incorretos', status: 'error' })
        } catch (e) {
          if (typeof window !== 'undefined' && window.__TOASTER && window.__TOASTER.create) {
            window.__TOASTER.create({ title: 'Erro de login', description: 'Login ou senha incorretos', status: 'error' })
          }
        }
      }
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
