'use client';

import { useState, useRef, useEffect } from 'react';
import styles from './chat-bot.module.css';

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: 'Olá! Sou o seu assistente virtual TaskCare. Como posso ajudar?',
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [tarefa_id, setTarefa_id] = useState(null);
  const messagesEndRef = useRef(null);

  // Auto-scroll para a última mensagem
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Recuperar tarefa_id da URL ou localStorage se estiver em página de detalhes
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('tarefa_id');
    if (id) {
      setTarefa_id(parseInt(id));
    } else if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('tarefa_id');
      if (stored) {
        setTarefa_id(parseInt(stored));
      }
    }
  }, []);

  const sendMessage = async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput || isLoading) return;

    // Adicionar mensagem do usuário
    const userMessage = {
      id: messages.length + 1,
      text: trimmedInput,
      sender: 'user',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Se não tiver tarefa_id, usar um padrão ou avisar
      const id = tarefa_id || 1; // Valor padrão para testes

      const response = await fetch('http://localhost:3333/gemini/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: trimmedInput,
          tarefa_id: id
        })
      });

      if (!response.ok) {
        throw new Error('Erro ao comunicar com o servidor');
      }

      const data = await response.json();
      const botMessage = {
        id: messages.length + 2,
        text: data.text || 'Desculpe, não consegui processar sua mensagem.',
        sender: 'bot',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Erro:', error);
      const errorMessage = {
        id: messages.length + 2,
        text: 'Desculpe, ocorreu um erro ao conectar com o assistente. Tente novamente.',
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
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
            <div
              key={msg.id}
              className={`${styles.message} ${
                msg.sender === 'user' ? styles.userMessage : styles.botMessage
              }`}
            >
              <p>{msg.text}</p>
              <small className={styles.timestamp}>
                {msg.timestamp.toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </small>
            </div>
          ))}
          {isLoading && (
            <div className={`${styles.message} ${styles.botMessage}`}>
              <p>
                <i className="fas fa-spinner fa-spin"></i> Digitando...
              </p>
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
