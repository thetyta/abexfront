'use client';

import { useEffect, useState } from 'react';
import styles from './page.module.css';

/**
 * Página de exemplo para testar o ChatBot com uma tarefa específica
 * O chat carregará o histórico da tarefa e permitirá conversar com Gemini
 */
export default function ChatTestPage() {
  const [tarefas, setTarefas] = useState([]);
  const [selectedTarefa, setSelectedTarefa] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Buscar tarefas de teste
    const fetchTarefas = async () => {
      try {
        const response = await fetch('http://localhost:3333/tarefas');
        if (!response.ok) throw new Error('Erro ao buscar tarefas');
        const data = await response.json();
        setTarefas(data || []);
        if (data && data.length > 0) {
          setSelectedTarefa(data[0].id);
        }
      } catch (error) {
        console.error('Erro:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTarefas();
  }, []);

  const handleSelectTarefa = (tarefaId) => {
    setSelectedTarefa(tarefaId);
    // Salvar tarefa_id no localStorage para o ChatBot usar
    localStorage.setItem('tarefa_id', tarefaId);
  };

  return (
    <div className={styles.container}>
      <h1>🤖 Teste do ChatBot com Gemini</h1>
      
      <div className={styles.info}>
        <h2>Como Usar</h2>
        <ol>
          <li>Selecione uma tarefa da lista</li>
          <li>O chat aparecerá no canto inferior direito</li>
          <li>Digite uma pergunta sobre a tarefa</li>
          <li>Gemini responderá com base no contexto</li>
          <li>Todo o histórico é salvo no banco</li>
        </ol>
      </div>

      <div className={styles.section}>
        <h2>📋 Selecione uma Tarefa</h2>
        {loading ? (
          <p>Carregando tarefas...</p>
        ) : tarefas.length === 0 ? (
          <p>Nenhuma tarefa encontrada. Crie uma tarefa primeiro.</p>
        ) : (
          <div className={styles.tarefaList}>
            {tarefas.map((tarefa) => (
              <button
                key={tarefa.id}
                className={`${styles.tarefaItem} ${
                  selectedTarefa === tarefa.id ? styles.active : ''
                }`}
                onClick={() => handleSelectTarefa(tarefa.id)}
              >
                <div className={styles.tarefaInfo}>
                  <strong>{tarefa.nome}</strong>
                  <small>ID: {tarefa.id}</small>
                </div>
                <span className={styles.tarefaStatus}>{tarefa.status}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedTarefa && (
        <div className={styles.section}>
          <h2>✅ Tarefa Selecionada</h2>
          <div className={styles.selectedBox}>
            <p>
              <strong>Tarefa ID:</strong> {selectedTarefa}
            </p>
            <p>
              O chat está pronto! Clique no botão 💬 no canto inferior direito.
            </p>
            <small>
              💡 Você pode fazer perguntas como:
              <ul>
                <li>&quot;Qual é o escopo desta tarefa?&quot;</li>
                <li>&quot;Como posso implementar isso?&quot;</li>
                <li>&quot;Quais são os requisitos?&quot;</li>
                <li>&quot;Gere uma checklist para esta tarefa&quot;</li>
              </ul>
            </small>
          </div>
        </div>
      )}

      <div className={styles.section}>
        <h2>📚 Informações do Sistema</h2>
        <div className={styles.infoBox}>
          <p><strong>API Backend:</strong> http://localhost:3333</p>
          <p><strong>Rota Gemini:</strong> POST /gemini/generate</p>
          <p><strong>Modelo:</strong> Gemini 2.0 Flash Lite Preview</p>
          <p><strong>Histórico:</strong> Armazenado em historico_conversas_ia</p>
        </div>
      </div>
    </div>
  );
}
