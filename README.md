# TaskCare Frontend

Interface web moderna para o TaskCare, um app focado em gerenciamento de tarefas, com criação de conta, gerenciamento de projetos e tarefas, colunas customizáveis e integração com IA.

## 📋 Sobre o Projeto

O frontend do TaskCare oferece uma experiência de usuário fluida para:
- Criação de conta e Login de usuários.
- Dashboard interativo.
- Gerenciamento de projetos e tarefas (estilo Kanban com colunas customizáveis).
- Chat com IA.
- Configurações de perfil.

## 🚀 Tecnologias Utilizadas

- **Framework:** Next.js (v15.5.2)
- **Biblioteca UI:** React (v19.1.0)
- **Estilização:** Chakra UI, Emotion
- **Ícones:** React Icons
- **Drag & Drop:** @dnd-kit (para quadros Kanban)
- **Markdown:** React Markdown (para renderização de respostas da IA)
- **Linting:** ESLint

## 📦 Pré-requisitos

- [Node.js](https://nodejs.org/) (Versão compatível com Next.js 15, recomendada v18.17+ ou v20+).

## 🔧 Instalação

1. Clone o repositório e acesse a pasta do frontend:
   ```bash
   cd abexfront
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

## ⚙️ Configuração

O projeto atualmente espera que o backend esteja rodando em `http://localhost:3333`.

> **Dica:** Verifique se o backend está rodando na porta correta para garantir a comunicação entre as aplicações.

## 🏃‍♂️ Como Rodar

Para iniciar o servidor de desenvolvimento:

```bash
npm run dev
```

A aplicação estará disponível em: `http://localhost:3000`

## 🏗️ Estrutura do Projeto

- `app/`: Páginas e rotas do Next.js (App Router).
  - `cadastro/`: Página de registro.
  - `dashboard/`: Painel principal.
  - `projetos/`: Gerenciamento de projetos.
- `components/`: Componentes reutilizáveis da UI.
- `lib/`: Utilitários e Hooks (ex: `useAuth`).
- `public/`: Arquivos estáticos.
