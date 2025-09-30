'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Box, Heading, SimpleGrid, Text, Button, Center } from '@chakra-ui/react'
import { toaster } from '../../components/ui/toaster'

export default function ProjetosPage() {
  const router = useRouter()
  const [projetos, setProjetos] = useState(null)
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => {
    (async () => {
      try {
        // require login
        const stored = localStorage.getItem('usuarioLogado')
        if (!stored) return router.push('/')
        const res = await fetch('http://localhost:3333/projetos')
        const data = await res.json()
        // try to filter by logged user if present
        let usuario = null
        try {
          usuario = JSON.parse(localStorage.getItem('usuarioLogado'))
        } catch (e) { usuario = null }

        if (usuario && Array.isArray(data)) {
          const filtered = data.filter(p => {
            if (!p) return false
            // responsible
            if (p.responsavel && Number(p.responsavel.id) === Number(usuario.id)) return true
            // collaborators
            if (Array.isArray(p.colaboradores) && p.colaboradores.some(c => Number(c.id) === Number(usuario.id))) return true
            return false
          })
          setProjetos(filtered)
        } else {
          setProjetos(Array.isArray(data) ? data : [])
        }
      } catch (err) {
        setProjetos([])
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  if (loading) return (
    <Center p={10}><Text>Carregando projetos...</Text></Center>
  )

  if (!projetos || projetos.length === 0) return (
    <Center p={10} flexDirection="column">
      <Text mb={4}>Nenhum projeto encontrado.</Text>
      <Link href="/projetos/novo"><Button colorScheme="teal">Criar primeiro projeto</Button></Link>
    </Center>
  )

  return (
    <Box p={6}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={6}>
        <Heading size="md">Meus Projetos</Heading>
        <Link href="/projetos/novo"><Button colorScheme="teal">Novo Projeto</Button></Link>
      </Box>

      <SimpleGrid columns={[1,2,3]} spacing={6}>
        {projetos.map(p => (
          <Box key={p.id} className="project-card">
            <Heading size="sm">{p.nome}</Heading>
            <Text fontSize="sm" color="gray.600" mt={2}>{p.descricao}</Text>
            <Box mt={4} display="flex" justifyContent="space-between" alignItems="center">
              <Text fontSize="sm">Tipo: {p.tipo}</Text>
              <Box>
                <Link href={`/projetos/${p.id}/kanban`}>
                  <Button size="sm" className="project-cta" mr={2}>Abrir quadro</Button>
                </Link>
                <Button size="sm" colorScheme="red" onClick={async () => {
                  if (!confirm(`Deseja realmente excluir o projeto "${p.nome}"? Esta ação é irreversível.`)) return
                  try {
                    setDeletingId(p.id)
                    const res = await fetch(`http://localhost:3333/projetos/${p.id}`, { method: 'DELETE' })
                    if (!res.ok) throw new Error('Erro ao deletar projeto')
                    // remover do estado local
                    setProjetos(prev => prev.filter(pr => pr.id !== p.id))
                    // try toaster, fallback to window.__TOASTER or alert
                    try {
                      toaster.create({ title: 'Projeto excluído', description: `Projeto "${p.nome}" foi removido.`, status: 'success' })
                      if (typeof window !== 'undefined' && window.__TOASTER) console.log('toaster global present')
                    } catch (e) {
                      if (typeof window !== 'undefined' && window.__TOASTER && window.__TOASTER.create) {
                        window.__TOASTER.create({ title: 'Projeto excluído', description: `Projeto "${p.nome}" foi removido.`, status: 'success' })
                        } else {
                        // final fallback
                        alert(`Projeto "${p.nome}" excluído`)
                      }
                    }
                  } catch (err) {
                    console.error(err)
                    try {
                      toaster.create({ title: 'Erro', description: 'Não foi possível deletar o projeto', status: 'error' })
                    } catch (e) {
                      if (typeof window !== 'undefined' && window.__TOASTER && window.__TOASTER.create) {
                        window.__TOASTER.create({ title: 'Erro', description: 'Não foi possível deletar o projeto', status: 'error' })
                      } else {
                        alert('Não foi possível deletar o projeto')
                      }
                    }
                  } finally {
                    setDeletingId(null)
                  }
                }} isLoading={deletingId === p.id}>Excluir</Button>
              </Box>
            </Box>
          </Box>
        ))}
      </SimpleGrid>
    </Box>
  )
}
