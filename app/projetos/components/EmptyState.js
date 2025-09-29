import { Box, Heading, Text, Button } from '@chakra-ui/react'
import Link from 'next/link'

export default function EmptyState(){
  return (
    <Box textAlign="center" p={10}>
      <Heading size="md">Nenhum projeto</Heading>
      <Text mt={2}>Crie seu primeiro projeto para começar a usar quadros Kanban.</Text>
      <Link href="/projetos/novo"><Button mt={4} colorScheme="teal">Criar Projeto</Button></Link>
    </Box>
  )
}
