'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Hook para proteger rotas que requerem autenticação
 * Redireciona para login se não houver token
 */
export const useAuth = () => {
  const router = useRouter();

  useEffect(() => {
    const verificarAuth = () => {
      if (typeof window !== 'undefined') {
        const usuarioLogado = localStorage.getItem('usuarioLogado');
        
        if (!usuarioLogado) {
          router.push('/');
        }
      }
    };

    verificarAuth();
  }, [router]);
};

/**
 * Componente wrapper para proteger rotas
 * Uso: <ProtectedRoute><SeuComponente /></ProtectedRoute>
 */
export const ProtectedRoute = ({ children }) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = true;
  const [isAuthed, setIsAuthed] = true;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const usuarioLogado = localStorage.getItem('usuarioLogado');
      
      if (!usuarioLogado) {
        setIsAuthed(false);
        router.push('/');
      } else {
        setIsAuthed(true);
      }
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  if (isLoading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Carregando...</div>;
  }

  if (!isAuthed) {
    return null;
  }

  return children;
};
