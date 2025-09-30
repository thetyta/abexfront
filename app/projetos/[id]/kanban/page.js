"use client"

import React, { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Box, HStack, VStack, Heading, Text, Button, Input, IconButton, Spinner, Center } from '@chakra-ui/react'
import { DndContext, PointerSensor, useSensor, useSensors, useDraggable, useDroppable } from '@dnd-kit/core'

export default function KanbanPage({ params }) {
  // Next.js may pass params as a Promise in new versions — unwrap with React.use()
  const { id } = React.use(params)
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
  // fetch only columns for this quadro to reduce payload
  const cRes = await fetch(`http://localhost:3333/colunas?quadro_id=${qData.id}`)
  let cData = await cRes.json()
  cData = Array.isArray(cData) ? cData.sort((a,b)=>a.ordem-b.ordem) : []

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
    // optimistic UI update: add temporary column immediately
    const tempId = `temp-${Date.now()}`
    const tempCol = { id: tempId, nome: newColName, ordem: colunas.length, quadro_id: quadro.id, tarefas: [] }
    setColunas(prev => [...prev, tempCol])
    setNewColName('')
    try {
      const res = await fetch('http://localhost:3333/colunas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: newColName, ordem: colunas.length, quadro_id: quadro.id })
      })
      const col = await res.json()
      // replace temp with real
      setColunas(prev => prev.map(c => c.id === tempId ? { ...col, tarefas: [] } : c))
    } catch (err) {
      console.error('Erro ao criar coluna', err)
      // rollback optimistic update
      setColunas(prev => prev.filter(c => c.id !== tempId))
      // optionally show toast (toaster import might be available globally)
      if (typeof window !== 'undefined' && window.__TOASTER && window.__TOASTER.create) {
        window.__TOASTER.create({ title: 'Erro', description: 'Falha ao criar coluna', status: 'error' })
      } else {
        alert('Falha ao criar coluna')
      }
    }
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
  // DnD Kit implementation
  // require a small pointer movement before starting drag to avoid accidental drags that can trigger scrolling
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 10 } }))

  // prevent body scroll while dragging (fixes infinite auto-scroll when dragging near edges)
  const scrollRef = useRef({ x: 0, y: 0 })
  const onDragStart = () => {
    if (typeof document !== 'undefined') document.body.style.overflow = 'hidden'
    if (typeof window !== 'undefined') {
      scrollRef.current = { x: window.scrollX || window.pageXOffset, y: window.scrollY || window.pageYOffset }
    }
  }

  // keep resetting the window scroll to the saved position while dragging
  const onDragMove = () => {
    if (typeof window !== 'undefined') {
      const { x, y } = scrollRef.current
      window.scrollTo(x, y)
    }
  }

  const onDragEnd = async (event) => {
    const { active, over } = event
    // restore scroll
    if (typeof document !== 'undefined') document.body.style.overflow = ''
    if (typeof window !== 'undefined') {
      const { x, y } = scrollRef.current
      window.scrollTo(x, y)
    }
    if (!over) return
    const activeId = String(active.id).replace(/^task-/, '')
    const overId = String(over.id)

    // find source column and task
    const srcColIdx = colunas.findIndex(c => c.tarefas.some(t => String(t.id) === activeId))
    if (srcColIdx === -1) return
    const srcCol = colunas[srcColIdx]
    const task = srcCol.tarefas.find(t => String(t.id) === activeId)

    // remove from source
    let newColunas = colunas.map(c => c.id === srcCol.id ? { ...c, tarefas: c.tarefas.filter(t => String(t.id) !== activeId) } : { ...c, tarefas: [...c.tarefas] })

    // determine destination
    let destColIdx = -1
    let insertIndex = -1
    if (overId.startsWith('gap-')) {
      // gap id format: gap-<colId>-<index>
      const parts = overId.split('-')
      const colId = parts[1]
      insertIndex = parseInt(parts[2], 10)
      destColIdx = newColunas.findIndex(c => String(c.id) === String(colId))
      if (destColIdx === -1) return
      newColunas[destColIdx].tarefas.splice(insertIndex, 0, task)
    } else if (overId.startsWith('task-')) {
      const overTaskId = overId.replace(/^task-/, '')
      destColIdx = newColunas.findIndex(c => c.tarefas.some(t => String(t.id) === overTaskId))
      if (destColIdx === -1) return
      insertIndex = newColunas[destColIdx].tarefas.findIndex(t => String(t.id) === overTaskId)
      newColunas[destColIdx].tarefas.splice(insertIndex, 0, task)
    } else if (overId.startsWith('col-')) {
      const colId = overId.replace(/^col-/, '')
      destColIdx = newColunas.findIndex(c => String(c.id) === colId)
      if (destColIdx === -1) return
      newColunas[destColIdx].tarefas.push(task)
    }

    setColunas(newColunas)

    // persist changes: update coluna_id and posicao for all tasks (simple approach)
    try {
      for (let ci = 0; ci < newColunas.length; ci++) {
        const col = newColunas[ci]
        for (let i = 0; i < col.tarefas.length; i++) {
          const t = col.tarefas[i]
          // skip temp ids (e.g., temp-...)
          if (String(t.id).startsWith('temp-')) continue
          await fetch(`http://localhost:3333/tarefas/${t.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ coluna_id: col.id, posicao: i })
          })
        }
      }
    } catch (err) { console.error('Erro ao persistir drag:', err) }
  }

  // cleanup if component unmounts while dragging
  useEffect(() => {
    return () => {
      if (typeof document !== 'undefined') document.body.style.overflow = ''
    }
  }, [])

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
  <DndContext sensors={sensors} onDragStart={onDragStart} onDragMove={onDragMove} onDragEnd={onDragEnd}>
        <HStack align="start" spacing={4} overflowX="auto">
          {colunas.map((col) => (
            <Column key={col.id} col={col} onAddCard={() => handleAddCard(col.id)} />
          ))}

          <VStack minW="280px">
            <Input placeholder="Nova coluna" value={newColName} onChange={(e)=>setNewColName(e.target.value)} />
            <Button onClick={handleAddColumn} colorScheme="teal">Adicionar coluna</Button>
          </VStack>
        </HStack>
      </DndContext>
    </Box>
  )
}

function Column({ col, onAddCard }) {
  const { setNodeRef } = useDroppable({ id: `col-${col.id}` })
  return (
    <VStack ref={setNodeRef} align="stretch" className="kanban-column" minW="280px">
      <HStack justify="space-between">
        <Heading size="sm">{col.nome}</Heading>
        <IconButton aria-label="add" icon={<span style={{fontWeight:600}}>+</span>} size="sm" onClick={onAddCard} />
      </HStack>
      {/* top gap */}
      <GapDrop key={`gap-${col.id}-0`} id={`gap-${col.id}-0`} />
      {col.tarefas.map((t, i) => (
        <React.Fragment key={t.id}>
          <Task tarefa={t} index={i} />
          {/* gap after item */}
          <GapDrop id={`gap-${col.id}-${i+1}`} />
        </React.Fragment>
      ))}
    </VStack>
  )
}

function GapDrop({ id }) {
  const { setNodeRef, isOver } = useDroppable({ id })
  return (
    <Box ref={setNodeRef} minH="8px" mb={2} borderRadius="4px" style={{ background: isOver ? 'rgba(14,165,164,0.12)' : 'transparent' }} />
  )
}

function Task({ tarefa }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: `task-${tarefa.id}` })
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined
  return (
    <Box ref={setNodeRef} {...attributes} {...listeners} className="kanban-card" style={style} opacity={isDragging ? 0.8 : 1}>
      <Text fontWeight="bold">{tarefa.nome}</Text>
      <Text fontSize="sm" color="gray.600">{tarefa.prioridade}</Text>
    </Box>
  )
}
