'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Box, Heading, Input, Textarea, Button, VStack } from '@chakra-ui/react'

export default function NovoProjetoPage() {
  const [form, setForm] = useState({ nome: '', tipo: 'PESSOAL', descricao: '', responsavel_id: 1 })
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('http://localhost:3333/projetos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      if (!res.ok) throw new Error('Erro')
      const projeto = await res.json()
      // criar quadro padrão para o projeto
      await fetch('http://localhost:3333/quadros', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: 'Quadro Principal', projeto_id: projeto.id })
      })
      router.push(`/projetos/${projeto.id}/kanban`)
    } catch (err) {
      console.error(err)
      alert('Erro ao criar projeto')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box p={6} maxW="600px" mx="auto">
      <Heading size="md" mb={4}>Criar Projeto</Heading>
      <form onSubmit={handleSubmit}>
        <VStack spacing={3} align="stretch">
          <Input name="nome" placeholder="Nome do projeto" value={form.nome} onChange={handleChange} required />
          <select name="tipo" value={form.tipo} onChange={handleChange} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
            <option value="PESSOAL">Pessoal</option>
            <option value="TRABALHO">Trabalho</option>
          </select>
          <Textarea name="descricao" placeholder="Descrição (opcional)" value={form.descricao} onChange={handleChange} />
          <Button type="submit" colorScheme="teal" isLoading={loading}>Criar</Button>
        </VStack>
      </form>
    </Box>
  )
}
