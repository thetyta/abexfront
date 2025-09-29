'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Box, Heading, SimpleGrid, Text, Button, Center } from '@chakra-ui/react'

export default function ProjetosPage() {
  const [projetos, setProjetos] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('http://localhost:3333/projetos')
      .then(r => r.json())
      .then(data => setProjetos(data))
      .catch(() => setProjetos([]))
      .finally(() => setLoading(false))
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
          <Box key={p.id} bg="white" p={4} borderRadius="md" boxShadow="sm">
            <Heading size="sm">{p.nome}</Heading>
            <Text fontSize="sm" color="gray.600" mt={2}>{p.descricao}</Text>
            <Box mt={4} display="flex" justifyContent="space-between" alignItems="center">
              <Text fontSize="sm">Tipo: {p.tipo}</Text>
              <Link href={`/projetos/${p.id}/kanban`}>
                <Button size="sm" colorScheme="blue">Abrir quadro</Button>
              </Link>
            </Box>
          </Box>
        ))}
      </SimpleGrid>
    </Box>
  )
}
