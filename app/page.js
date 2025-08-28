'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

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
      const usuario = usuarios.find(u => 
        u.login === formData.login && u.senha === formData.senha
      );

      if (usuario) {
        // Salvar o usuário logado no localStorage
        localStorage.setItem('usuarioLogado', JSON.stringify(usuario));
        // Redirecionar para o dashboard
        router.push('/dashboard');
      } else {
        setError('Login ou senha incorretos');
      }
    } catch (err) {
      setError('Erro ao fazer login. Verifique se o servidor está rodando.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="form-container">
        <h2 style={{ textAlign: 'center', marginBottom: '30px', color: '#333' }}>
          Login
        </h2>
        
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
