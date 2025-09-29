'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Box, HStack, VStack, Heading, Text, Button, Input, IconButton, Spinner, Center } from '@chakra-ui/react'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'

export default function KanbanPage({ params }) {
  const { id } = params
  const [quadro, setQuadro] = useState(null)
  const [colunas, setColunas] = useState([])
  const [loading, setLoading] = useState(true)
  const [newColName, setNewColName] = useState('')
  const router = useRouter()

  const fetchQuadro = useCallback(async () => {
    setLoading(true)
    try {
      // buscar quadro do projeto
      const qRes = await fetch(`http://localhost:3333/quadros?projeto_id=${id}`)
      let qData = await qRes.json()
      // backend nao tem filtro por projeto na rota /quadros, fallback: buscar quadros e escolher o primeiro com projeto_id
      if (Array.isArray(qData)) qData = qData.find(q => String(q.projeto_id) === String(id)) || qData[0]
      if (!qData) {
        setQuadro(null)
        setColunas([])
        return
      }
      setQuadro(qData)

      // buscar colunas do quadro
      const cRes = await fetch(`http://localhost:3333/colunas`) // retornará todas
      let cData = await cRes.json()
      cData = cData.filter(c => c.quadro_id === qData.id).sort((a,b)=>a.ordem-b.ordem)

      // buscar tarefas e agrupar por coluna
      const tRes = await fetch('http://localhost:3333/tarefas')
      let tarefas = await tRes.json()
      tarefas = tarefas.filter(t => t.projeto_id === Number(id))

      const withTasks = cData.map(col => ({ ...col, tarefas: tarefas.filter(t => t.coluna_id === col.id).sort((a,b)=>a.posicao-b.posicao) }))
      setColunas(withTasks)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { fetchQuadro() }, [fetchQuadro, router])

  const handleAddColumn = async () => {
    if (!newColName) return
    try {
      const res = await fetch('http://localhost:3333/colunas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: newColName, ordem: colunas.length, quadro_id: quadro.id })
      })
      const col = await res.json()
      setColunas(prev => [...prev, { ...col, tarefas: [] }])
      setNewColName('')
    } catch (err) { console.error(err) }
  }

  const handleAddCard = async (colId) => {
    const name = prompt('Nome da tarefa')
    if (!name) return
    try {
      const res = await fetch('http://localhost:3333/tarefas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: name, projeto_id: Number(id), coluna_id: colId, responsavel_id: 1 })
      })
      const tarefa = await res.json()
      setColunas(prev => prev.map(c => c.id === colId ? { ...c, tarefas: [...c.tarefas, tarefa] } : c))
    } catch (err) { console.error(err) }
  }

  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result
    if (!destination) return
    const srcColIdx = Number(source.droppableId)
    const dstColIdx = Number(destination.droppableId)
    if (srcColIdx === dstColIdx && destination.index === source.index) return

    const srcCol = colunas[srcColIdx]
    const dstCol = colunas[dstColIdx]
    const item = srcCol.tarefas[source.index]

    // remove from source
    const newSrcTasks = Array.from(srcCol.tarefas)
    newSrcTasks.splice(source.index,1)
    // insert into dest
    const newDstTasks = Array.from(dstCol.tarefas)
    newDstTasks.splice(destination.index,0,item)

    const newCols = Array.from(colunas)
    newCols[srcColIdx] = { ...srcCol, tarefas: newSrcTasks }
    newCols[dstColIdx] = { ...dstCol, tarefas: newDstTasks }
    setColunas(newCols)

    // persist changes: update tarefa coluna_id and posicao
    try {
      await fetch(`http://localhost:3333/tarefas/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coluna_id: dstCol.id, posicao: destination.index })
      })
      // update positions for tasks in dest
      for (let i=0;i<newCols[dstColIdx].tarefas.length;i++){
        const t = newCols[dstColIdx].tarefas[i]
        await fetch(`http://localhost:3333/tarefas/${t.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ posicao: i })
        })
      }
      // update source positions
      for (let i=0;i<newCols[srcColIdx].tarefas.length;i++){
        const t = newCols[srcColIdx].tarefas[i]
        await fetch(`http://localhost:3333/tarefas/${t.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ posicao: i })
        })
      }
    } catch (err) { console.error(err) }
  }

  if (loading) return <Center p={10}><Spinner /></Center>

  if (!quadro) return (
    <Box p={6}>
      <Heading size="md">Quadro não encontrado</Heading>
      <Button mt={4} onClick={() => router.push('/projetos')}>Voltar</Button>
    </Box>
  )

  return (
    <Box p={6}>
      <Heading size="md" mb={4}>{quadro.nome}</Heading>
      <HStack align="start" spacing={4} overflowX="auto">
        <DragDropContext onDragEnd={onDragEnd}>
          {colunas.map((col, idx) => (
            <Droppable droppableId={String(idx)} key={col.id}>
              {(provided) => (
                <VStack ref={provided.innerRef} {...provided.droppableProps} align="stretch" bg="gray.50" p={3} minW="280px" borderRadius="md">
                    <HStack justify="space-between">
                    <Heading size="sm">{col.nome}</Heading>
                    <IconButton aria-label="add" icon={<span style={{fontWeight:600}}>+</span>} size="sm" onClick={() => handleAddCard(col.id)} />
                  </HStack>

                  {col.tarefas.map((t, i) => (
                    <Draggable draggableId={String(t.id)} index={i} key={t.id}>
                      {(prov) => (
                        <Box ref={prov.innerRef} {...prov.draggableProps} {...prov.dragHandleProps} bg="white" p={3} borderRadius="md" boxShadow="sm">
                          <Text fontWeight="bold">{t.nome}</Text>
                          <Text fontSize="sm" color="gray.600">{t.prioridade}</Text>
                        </Box>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </VStack>
              )}
            </Droppable>
          ))}
        </DragDropContext>

        <VStack minW="280px">
          <Input placeholder="Nova coluna" value={newColName} onChange={(e)=>setNewColName(e.target.value)} />
          <Button onClick={handleAddColumn} colorScheme="teal">Adicionar coluna</Button>
        </VStack>
      </HStack>
    </Box>
  )
}
