'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CadastroPage() {
  const [formData, setFormData] = useState({
    nome: '',
    login: '',
    email: '',
    senha: '',
    tipoPessoa: 'fisica', // 'fisica' ou 'juridica'
    cpfCnpj: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Função para aplicar máscara de CPF
  const aplicarMascaraCPF = (value) => {
    const cpf = value.replace(/\D/g, '');
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  // Função para aplicar máscara de CNPJ
  const aplicarMascaraCNPJ = (value) => {
    const cnpj = value.replace(/\D/g, '');
    return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'cpfCnpj') {
      // Aplicar máscara baseada no tipo de pessoa
      let valorFormatado = value;
      if (formData.tipoPessoa === 'fisica') {
        valorFormatado = aplicarMascaraCPF(value);
      } else {
        valorFormatado = aplicarMascaraCNPJ(value);
      }
      
      setFormData({
        ...formData,
        [name]: valorFormatado
      });
    } else if (name === 'tipoPessoa') {
      // Limpar o campo CPF/CNPJ quando mudar o tipo
      setFormData({
        ...formData,
        [name]: value,
        cpfCnpj: ''
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Primeiro, criar o usuário
      // backend espera o campo `senhaHash` no modelo Usuario, então enviamos a senha no campo senhaHash
      const dadosUsuario = {
        nome: formData.nome,
        login: formData.login,
        email: formData.email,
        senhaHash: formData.senha
      };

      const responseUsuario = await fetch('http://localhost:3333/usuarios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dadosUsuario),
      });

      if (responseUsuario.ok) {
        const usuarioCriado = await responseUsuario.json();
        
        // Depois, criar a pessoa física ou jurídica
        const cpfCnpjLimpo = formData.cpfCnpj.replace(/\D/g, '');
        
        if (formData.tipoPessoa === 'fisica') {
          const dadosPessoaFisica = {
            cpf: cpfCnpjLimpo,
            usuario_id: usuarioCriado.id
          };
          
          const responsePF = await fetch('http://localhost:3333/pessoas-fisicas', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(dadosPessoaFisica),
          });
          
          if (!responsePF.ok) {
            const errorPF = await responsePF.json();
            throw new Error(errorPF.error || 'Erro ao cadastrar pessoa física');
          }
        } else {
          const dadosPessoaJuridica = {
            cnpj: cpfCnpjLimpo,
            nome_fantasia: formData.nome, // Usando o mesmo nome como nome fantasia
            usuario_id: usuarioCriado.id
          };
          
          const responsePJ = await fetch('http://localhost:3333/pessoas-juridicas', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(dadosPessoaJuridica),
          });
          
          if (!responsePJ.ok) {
            const errorPJ = await responsePJ.json();
            throw new Error(errorPJ.error || 'Erro ao cadastrar pessoa jurídica');
          }
        }
        
        setSuccess('Usuário cadastrado com sucesso!');
        setFormData({
          nome: '',
          login: '',
          email: '',
          senha: '',
          tipoPessoa: 'fisica',
          cpfCnpj: ''
        });
        
        // Redirecionar para o login após 2 segundos
        setTimeout(() => {
          router.push('/');
        }, 2000);
      } else {
        const errorData = await responseUsuario.json();
        setError(errorData.error || 'Erro ao cadastrar usuário');
      }
    } catch (err) {
      setError(err.message || 'Erro ao cadastrar usuário. Verifique se o servidor está rodando.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="form-container">
        <h2 style={{ textAlign: 'center', marginBottom: '30px', color: '#333' }}>
          Cadastro
        </h2>
        
        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="nome">Nome:</label>
            <input
              type="text"
              id="nome"
              name="nome"
              value={formData.nome}
              onChange={handleChange}
              required
            />
          </div>
          
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
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="tipoPessoa">Tipo de Pessoa:</label>
            <select
              id="tipoPessoa"
              name="tipoPessoa"
              value={formData.tipoPessoa}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '16px'
              }}
            >
              <option value="fisica">Pessoa Física</option>
              <option value="juridica">Pessoa Jurídica</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="cpfCnpj">
              {formData.tipoPessoa === 'fisica' ? 'CPF:' : 'CNPJ:'}
            </label>
            <input
              type="text"
              id="cpfCnpj"
              name="cpfCnpj"
              value={formData.cpfCnpj}
              onChange={handleChange}
              placeholder={formData.tipoPessoa === 'fisica' ? '000.000.000-00' : '00.000.000/0000-00'}
              maxLength={formData.tipoPessoa === 'fisica' ? 14 : 18}
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
            {loading ? 'Cadastrando...' : 'Cadastrar'}
          </button>
        </form>
        
        <span 
          className="link" 
          onClick={() => router.push('/')}
        >
          Já tem conta? Faça login aqui
        </span>
      </div>
    </div>
  );
}
