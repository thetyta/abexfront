'use client';

import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import styles from './chat-bot.module.css';

export default function ChatBot(props) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: 'Olá! Sou o seu assistente virtual TaskCare. Como posso ajudar?',
      sender: 'bot',
      timestamp: new Date(),
      feedback: null
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [projeto_id, setProjeto_id] = useState(null);
  const [abortController, setAbortController] = useState(null);
  const messagesEndRef = useRef(null);

  // Auto-scroll para a última mensagem
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Recuperar projeto_id da URL ou localStorage se estiver em página de projeto
  useEffect(() => {
    if (props.projetoId) {
      setProjeto_id(parseInt(props.projetoId));
      return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('projeto_id');
    if (id) {
      setProjeto_id(parseInt(id));
    } else if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('projeto_id');
      if (stored) {
        setProjeto_id(parseInt(stored));
      }
    }
  }, [props.projetoId]);

  // Fetch history when chat opens and projeto_id is available
  useEffect(() => {
    if (isOpen && projeto_id) {
      fetchHistory();
    }
  }, [isOpen, projeto_id]);

  const fetchHistory = async () => {
    try {
      const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado'));
      const usuarioId = usuarioLogado ? usuarioLogado.id : null;
      const token = localStorage.getItem('token');
      
      if (!usuarioId) return;

      const response = await fetch(`http://localhost:3333/projetos/${projeto_id}/historico?usuario_id=${usuarioId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          const historyMessages = data.map(msg => ({
            id: msg.id,
            text: msg.conteudo,
            sender: msg.remetente === 'USUARIO' ? 'user' : 'bot',
            timestamp: new Date(msg.created_at),
            feedback: msg.feedback ? (msg.feedback.avaliacao === 'UTIL' ? 'gostei' : 'nao_gostei') : null
          }));
          setMessages(historyMessages);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
    }
  };

  const sendMessage = async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput || isLoading) return;

    // Criar novo AbortController para esta requisição
    const controller = new AbortController();
    setAbortController(controller);

    // Adicionar mensagem do usuário
    const userMessage = {
      id: Date.now(),
      text: trimmedInput,
      sender: 'user',
      timestamp: new Date(),
      feedback: null
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const id = projeto_id || 1;
      const token = localStorage.getItem('token');

      const response = await fetch('http://localhost:3333/gemini/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          prompt: trimmedInput,
          projeto_id: id,
          tarefa_id: props.tarefaId || null
        }),
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error('Erro ao comunicar com o servidor');
      }

      const data = await response.json();
      const botMessage = {
        id: Date.now() + 1,
        text: data.text || 'Desculpe, não consegui processar sua mensagem.',
        sender: 'bot',
        timestamp: new Date(),
        feedback: null
      };

      setMessages(prev => [...prev, botMessage]);

      if (data.action === 'UPDATE_KANBAN' && props.onUpdate) {
        props.onUpdate();
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Requisição cancelada');
      } else {
        console.error('Erro:', error);
        const errorMessage = {
          id: Date.now() + 2,
          text: 'Desculpe, ocorreu um erro ao conectar com o assistente. Tente novamente.',
          sender: 'bot',
          timestamp: new Date(),
          feedback: null
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } finally {
      setIsLoading(false);
      setAbortController(null);
    }
  };

  const handleFeedback = (messageId, liked) => {
    setMessages(prev =>
      prev.map(msg =>
        msg.id === messageId ? { ...msg, feedback: liked ? 'gostei' : 'nao_gostei' } : msg
      )
    );
  };

  const handleRegenerate = async () => {
    // Encontrar a última mensagem do usuário
    const lastUserMessage = [...messages].reverse().find(msg => msg.sender === 'user');
    if (!lastUserMessage) return;

    setInput(lastUserMessage.text);
    // Remover a última mensagem do bot para regenerar
    setMessages(prev => prev.slice(0, -1));
    
    // Enviar novamente
    await new Promise(resolve => setTimeout(resolve, 100));
    sendMessage();
  };

  const handleStopGeneration = () => {
    if (abortController) {
      abortController.abort();
      setIsLoading(false);
      setAbortController(null);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Botão Flutuante */}
      <button
        className={`${styles.chatBtn} ${isOpen ? styles.open : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Abrir chat"
        title="Chat com Assistente"
      >
        <i className="fas fa-comments"></i>
      </button>

      {/* Painel de Chat */}
      <div className={`${styles.chatPanel} ${isOpen ? styles.open : ''}`}>
        {/* Header */}
        <div className={styles.chatHeader}>
          <h3>
            <i className="fas fa-robot"></i> Assistente TaskCare
          </h3>
          <button
            className={styles.closeBtn}
            onClick={() => setIsOpen(false)}
            aria-label="Fechar chat"
          >
            ✕
          </button>
        </div>

        {/* Mensagens */}
        <div className={styles.chatMessages}>
          {messages.map(msg => (
            <div key={msg.id}>
              <div
                className={`${styles.message} ${
                  msg.sender === 'user' ? styles.userMessage : styles.botMessage
                }`}
              >
                <div className={styles.markdownBody}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                </div>
                <small className={styles.timestamp}>
                  {msg.timestamp.toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </small>
              </div>
              {msg.sender === 'bot' && !isLoading && (
                <div className={styles.messageActions}>
                  <button
                    className={`${styles.feedbackBtn} ${msg.feedback === 'gostei' ? styles.liked : ''}`}
                    onClick={() => handleFeedback(msg.id, true)}
                    title="Gostei desta resposta"
                  >
                    <i className="fas fa-thumbs-up"></i>
                  </button>
                  <button
                    className={`${styles.feedbackBtn} ${msg.feedback === 'nao_gostei' ? styles.disliked : ''}`}
                    onClick={() => handleFeedback(msg.id, false)}
                    title="Não gostei desta resposta"
                  >
                    <i className="fas fa-thumbs-down"></i>
                  </button>
                  <button
                    className={styles.regenerateBtn}
                    onClick={handleRegenerate}
                    title="Gerar novamente"
                  >
                    <i className="fas fa-redo"></i> Regenerar
                  </button>
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className={`${styles.message} ${styles.botMessage}`}>
              <p>
                <i className="fas fa-spinner fa-spin"></i> Gerando resposta...
              </p>
              <button
                className={styles.stopBtn}
                onClick={handleStopGeneration}
                title="Parar geração"
              >
                <i className="fas fa-stop-circle"></i> Parar
              </button>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className={styles.chatInput}>
          <textarea
            className={styles.input}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Digite sua mensagem... (Enter para enviar)"
            disabled={isLoading}
          />
          <button
            className={styles.sendBtn}
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            aria-label="Enviar mensagem"
          >
            <i className="fas fa-paper-plane"></i>
          </button>
        </div>
      </div>
    </>
  );
}
