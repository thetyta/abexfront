'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const [usuarios, setUsuarios] = useState([]);
  const [usuarioLogado, setUsuarioLogado] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    // Verificar se há usuário logado
    const userLogado = localStorage.getItem('usuarioLogado');
    if (!userLogado) {
      router.push('/');
      return;
    }
    
    setUsuarioLogado(JSON.parse(userLogado));
    carregarUsuarios();
  }, [router]);

  const carregarUsuarios = async () => {
    try {
      const response = await fetch('http://localhost:3333/usuarios');
      if (response.ok) {
        const data = await response.json();
        
        // Para cada usuário, buscar se é pessoa física ou jurídica
        const usuariosComDetalhes = await Promise.all(
          data.map(async (usuario) => {
            try {
              // Tentar buscar pessoa física
              const responsePF = await fetch(`http://localhost:3333/pessoas-fisicas`);
              const pessoasFisicas = await responsePF.json();
              const pessoaFisica = pessoasFisicas.find(pf => pf.usuario_id === usuario.id);
              
              if (pessoaFisica) {
                return {
                  ...usuario,
                  tipo: 'Pessoa Física',
                  documento: pessoaFisica.cpf
                };
              }
              
              // Se não for pessoa física, tentar pessoa jurídica
              const responsePJ = await fetch(`http://localhost:3333/pessoas-juridicas`);
              const pessoasJuridicas = await responsePJ.json();
              const pessoaJuridica = pessoasJuridicas.find(pj => pj.usuario_id === usuario.id);
              
              if (pessoaJuridica) {
                return {
                  ...usuario,
                  tipo: 'Pessoa Jurídica',
                  documento: pessoaJuridica.cnpj,
                  nomeFantasia: pessoaJuridica.nome_fantasia
                };
              }
              
              return {
                ...usuario,
                tipo: 'Não identificado',
                documento: 'N/A'
              };
            } catch (err) {
              return {
                ...usuario,
                tipo: 'Erro ao carregar',
                documento: 'N/A'
              };
            }
          })
        );
        
        setUsuarios(usuariosComDetalhes);
      } else {
        setError('Erro ao carregar usuários');
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('usuarioLogado');
    router.push('/');
  };

  const formatarData = (dataString) => {
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR') + ' ' + data.toLocaleTimeString('pt-BR');
  };

  const formatarCPF = (cpf) => {
    if (!cpf) return 'N/A';
    const numeros = cpf.replace(/\D/g, '');
    return numeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const formatarCNPJ = (cnpj) => {
    if (!cnpj) return 'N/A';
    const numeros = cnpj.replace(/\D/g, '');
    return numeros.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  };

  const formatarDocumento = (documento, tipo) => {
    if (!documento) return 'N/A';
    if (tipo === 'Pessoa Física') {
      return formatarCPF(documento);
    } else if (tipo === 'Pessoa Jurídica') {
      return formatarCNPJ(documento);
    }
    return documento;
  };

  if (loading) {
    return (
      <div className="container">
        <div style={{ textAlign: 'center', marginTop: '50px' }}>
          Carregando...
        </div>
      </div>
    );
  }

  return (
    <div>
      <nav className="navbar">
        <h1>Dashboard - Sistema de Usuários</h1>
        <div>
          <span style={{ marginRight: '20px' }}>
            Olá, {usuarioLogado?.nome}!
          </span>
          <button 
            className="btn btn-secondary" 
            onClick={handleLogout}
            style={{ width: 'auto', padding: '8px 16px' }}
          >
            Sair
          </button>
        </div>
      </nav>

      <div className="container">
        <h2 style={{ marginBottom: '20px', color: '#333' }}>
          Usuários Cadastrados ({usuarios.length})
        </h2>
        
        {error && <div className="error">{error}</div>}
        
        <button 
          className="btn" 
          onClick={carregarUsuarios}
          style={{ width: 'auto', marginBottom: '20px', padding: '10px 20px' }}
        >
          Atualizar Lista
        </button>
        
        {usuarios.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#666', marginTop: '50px' }}>
            Nenhum usuário encontrado
          </div>
        ) : (
          <div>
            {usuarios.map((usuario) => (
              <div key={usuario.id} className="user-card">
                <h3 style={{ marginBottom: '10px', color: '#333' }}>
                  {usuario.nome}
                  {usuario.id === usuarioLogado?.id && (
                    <span style={{ fontSize: '14px', color: '#007bff', marginLeft: '10px' }}>
                      (Você)
                    </span>
                  )}
                </h3>
                <p><strong>Login:</strong> {usuario.login}</p>
                <p><strong>Email:</strong> {usuario.email}</p>
                <p><strong>Tipo:</strong> {usuario.tipo}</p>
                <p><strong>{usuario.tipo === 'Pessoa Física' ? 'CPF' : 'CNPJ'}:</strong> {formatarDocumento(usuario.documento, usuario.tipo)}</p>
                {usuario.nomeFantasia && (
                  <p><strong>Nome Fantasia:</strong> {usuario.nomeFantasia}</p>
                )}
                <p><strong>Cadastrado em:</strong> {formatarData(usuario.created_at)}</p>
                {usuario.updated_at !== usuario.created_at && (
                  <p><strong>Atualizado em:</strong> {formatarData(usuario.updated_at)}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
