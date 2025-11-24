"use client"

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../../lib/hooks/useAuth';
import { 
  DndContext, 
  PointerSensor, 
  useSensor, 
  useSensors, 
  useDraggable, 
  useDroppable, 
  DragOverlay,
  closestCenter  
} from '@dnd-kit/core';
import TaskModal from '../../../../components/ui/task-modal';
import TaskDetailModal from '../../../../components/ui/task-detail-modal';
import ColaboradoresModal from '../../../../components/ui/colaboradores-modal';
import EditTaskModal from '../../../../components/ui/edit-task-modal';
import DeleteColumnModal from '../../../../components/ui/delete-column-modal';
import DeleteTaskModal from '../../../../components/ui/delete-task-modal';
import NewColumnModal from '../../../../components/ui/new-column-modal';
import EditColumnModal from '../../../../components/ui/edit-column-modal';
import Chatbot from '../../../../components/ui/chat-bot';


// COMPONENTE PRINCIPAL DA PÁGINA
export default function KanbanPage({ params }) {
  useAuth() // Verifica autenticação
  const { id } = React.use(params);
  const [quadro, setQuadro] = useState(null);
  const [colunas, setColunas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newColName, setNewColName] = useState('');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedColumnId, setSelectedColumnId] = useState(null);
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [activeTask, setActiveTask] = useState(null);
  const [showColaboradoresModal, setShowColaboradoresModal] = useState(false);
  const [projeto, setProjeto] = useState(null);
  const [showEditTask, setShowEditTask] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);
  const [showDeleteColumn, setShowDeleteColumn] = useState(false);
  const [columnToDelete, setColumnToDelete] = useState(null);
  const [showDeleteTask, setShowDeleteTask] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [showNewColumnModal, setShowNewColumnModal] = useState(false);
  const [showEditColumnModal, setShowEditColumnModal] = useState(false);
  const [columnToEdit, setColumnToEdit] = useState(null);
  const router = useRouter();

  // Salva projeto_id no localStorage para o chatbot usar
  useEffect(() => {
    if (id) {
      localStorage.setItem('projeto_id', id);
    }
  }, [id]);

  const fetchQuadro = useCallback(async () => {
    setLoading(true);
    try {
      // Buscar projeto para obter colaboradores
      const pRes = await fetch(`http://localhost:3333/projetos/${id}`);
      const pData = await pRes.json();
      setProjeto(pData);

      const qRes = await fetch(`http://localhost:3333/quadros?projeto_id=${id}`);
      let qData = await qRes.json();
      
      // Buscar apenas o quadro específico deste projeto
      if (Array.isArray(qData)) {
        qData = qData.find(q => String(q.projeto_id) === String(id));
      }
      
      if (!qData) {
        setQuadro(null);
        setColunas([]);
        setLoading(false);
        return;
      }
      
      setQuadro(qData);
      const cRes = await fetch(`http://localhost:3333/colunas?quadro_id=${qData.id}`);
      let cData = await cRes.json();
      cData = Array.isArray(cData) ? cData.sort((a,b)=>a.ordem-b.ordem) : [];
      const tRes = await fetch('http://localhost:3333/tarefas');
      let tarefas = await tRes.json();
      tarefas = tarefas.filter(t => t.projeto_id === Number(id));
      const withTasks = cData.map(col => ({ ...col, tarefas: tarefas.filter(t => t.coluna_id === col.id).sort((a,b)=>a.posicao-b.posicao) }));
      setColunas(withTasks);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchQuadro() }, [fetchQuadro, router]);

  const handleAddColumn = async (columnName) => {
    if (!columnName.trim()) return;
    const optimisticId = `temp-${Date.now()}`;
    const newColumn = { id: optimisticId, nome: columnName, ordem: colunas.length, quadro_id: quadro.id, tarefas: [] };
    setColunas(prev => [...prev, newColumn]);
    
    try {
      const res = await fetch('http://localhost:3333/colunas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: columnName, ordem: colunas.length, quadro_id: quadro.id })
      });
      const createdCol = await res.json();
      setColunas(prev => prev.map(c => c.id === optimisticId ? { ...createdCol, tarefas: [] } : c));
      
      // Toaster opcional
      if (typeof window !== 'undefined' && window.__TOASTER && window.__TOASTER.create) {
        window.__TOASTER.create({ 
          title: 'Coluna criada', 
          description: `Coluna "${columnName}" foi adicionada.`, 
          status: 'success' 
        });
      }
    } catch (err) {
      console.error('Erro ao criar coluna', err);
      setColunas(prev => prev.filter(c => c.id !== optimisticId));
      
      if (typeof window !== 'undefined' && window.__TOASTER && window.__TOASTER.create) {
        window.__TOASTER.create({ 
          title: 'Erro', 
          description: 'Não foi possível criar a coluna', 
          status: 'error' 
        });
      }
    }
  };

  const handleAddCard = (colId) => {
    setSelectedColumnId(colId);
    setShowTaskModal(true);
  };

  const handleTaskClick = (tarefa) => {
    setSelectedTask(tarefa);
    setShowTaskDetail(true);
  };

  const handleTaskDelete = (tarefaId) => {
    setColunas(prev => prev.map(col => ({
      ...col,
      tarefas: col.tarefas.filter(t => t.id !== tarefaId)
    })));
  };

  const handleEditTask = (tarefa) => {
    setTaskToEdit(tarefa);
    setShowTaskDetail(false);
    setShowEditTask(true);
  };

  const handleConfirmDeleteTask = (tarefa) => {
    setTaskToDelete(tarefa);
    setShowTaskDetail(false);
    setShowDeleteTask(true);
  };

  const confirmDeleteTask = async () => {
    if (!taskToDelete) return;
    
    try {
      const res = await fetch(`http://localhost:3333/tarefas/${taskToDelete.id}`, {
        method: 'DELETE'
      });
      
      if (!res.ok) throw new Error('Erro ao excluir tarefa');
      
      // Remover tarefa da UI
      handleTaskDelete(taskToDelete.id);
      setShowDeleteTask(false);
      setTaskToDelete(null);
      
      // Toaster opcional
      if (typeof window !== 'undefined' && window.__TOASTER && window.__TOASTER.create) {
        window.__TOASTER.create({ 
          title: 'Tarefa excluída', 
          description: `Tarefa "${taskToDelete.nome}" foi removida.`, 
          status: 'success' 
        });
      }
    } catch (err) {
      console.error(err);
      if (typeof window !== 'undefined' && window.__TOASTER && window.__TOASTER.create) {
        window.__TOASTER.create({ 
          title: 'Erro', 
          description: 'Não foi possível excluir a tarefa', 
          status: 'error' 
        });
      } else {
        alert('Não foi possível excluir a tarefa');
      }
    }
  };

  const handleEditColumnClick = (column) => {
    setColumnToEdit(column);
    setShowEditColumnModal(true);
  };

  const handleUpdateColumn = async (columnId, data) => {
    try {
      const res = await fetch(`http://localhost:3333/colunas/${columnId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!res.ok) throw new Error('Erro ao atualizar coluna');
      
      const updatedCol = await res.json();
      
      setColunas(prev => prev.map(c => c.id === columnId ? { ...c, ...updatedCol } : c));
      
      if (typeof window !== 'undefined' && window.__TOASTER && window.__TOASTER.create) {
        window.__TOASTER.create({ 
          title: 'Coluna atualizada', 
          description: `Coluna "${updatedCol.nome}" foi atualizada.`, 
          status: 'success' 
        });
      }
    } catch (err) {
      console.error(err);
      if (typeof window !== 'undefined' && window.__TOASTER && window.__TOASTER.create) {
        window.__TOASTER.create({ 
          title: 'Erro', 
          description: 'Não foi possível atualizar a coluna', 
          status: 'error' 
        });
      }
    }
  };

  const handleDeleteColumn = (column) => {
    setColumnToDelete(column);
    setShowDeleteColumn(true);
  };

  const confirmDeleteColumn = async () => {
    if (!columnToDelete) return;
    
    try {
      const res = await fetch(`http://localhost:3333/colunas/${columnToDelete.id}`, {
        method: 'DELETE'
      });
      
      if (!res.ok) throw new Error('Erro ao excluir coluna');
      
      // Remover coluna da UI
      setColunas(prev => prev.filter(c => c.id !== columnToDelete.id));
      setShowDeleteColumn(false);
      setColumnToDelete(null);
      
      // Toaster opcional
      if (typeof window !== 'undefined' && window.__TOASTER && window.__TOASTER.create) {
        window.__TOASTER.create({ 
          title: 'Coluna excluída', 
          description: `Coluna "${columnToDelete.nome}" e suas tarefas foram removidas.`, 
          status: 'success' 
        });
      }
    } catch (err) {
      console.error(err);
      if (typeof window !== 'undefined' && window.__TOASTER && window.__TOASTER.create) {
        window.__TOASTER.create({ 
          title: 'Erro', 
          description: 'Não foi possível excluir a coluna', 
          status: 'error' 
        });
      } else {
        alert('Não foi possível excluir a coluna');
      }
    }
  };

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 10 } }));
  const scrollRef = useRef({ x: 0, y: 0 });

  const onDragStart = (event) => {
    if (typeof document !== 'undefined') document.body.style.overflow = 'hidden';
    if (typeof window !== 'undefined') {
      scrollRef.current = { x: window.scrollX || window.pageXOffset, y: window.scrollY || window.pageYOffset };
    }
    const { active } = event;
    const taskId = String(active.id).replace(/^task-/, '');
    const task = colunas.flatMap(c => c.tarefas).find(t => String(t.id) === taskId);
    if (task) setActiveTask(task);
  };

  const onDragMove = () => {
    if (typeof window !== 'undefined') {
      const { x, y } = scrollRef.current;
      window.scrollTo(x, y);
    }
  };

  const onDragEnd = async (event) => {
    if (typeof document !== 'undefined') document.body.style.overflow = '';
    setActiveTask(null);

    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeId = String(active.id).replace(/^task-/, '');
    const overId = String(over.id);

    const originalColunas = colunas;
    let sourceColumn = null;
    let draggedTask = null;

    for (const col of colunas) {
      const task = col.tarefas.find(t => String(t.id) === activeId);
      if (task) {
        sourceColumn = col;
        draggedTask = task;
        break;
      }
    }

    if (!draggedTask) return;

    let newColunas = JSON.parse(JSON.stringify(colunas));
    const sourceColIndex = newColunas.findIndex(c => c.id === sourceColumn.id);
    const taskIndex = newColunas[sourceColIndex].tarefas.findIndex(t => String(t.id) === activeId);

    let destColIndex = -1, destTaskIndex = -1;

    // Determinar coluna e índice de destino ANTES de remover a tarefa
    if (overId.startsWith('col-')) {
      const colId = overId.replace(/^col-/, '');
      destColIndex = newColunas.findIndex(c => String(c.id) === colId);
      if (destColIndex !== -1) destTaskIndex = newColunas[destColIndex].tarefas.length;
    } else if (overId.startsWith('task-')) {
      const overTaskId = overId.replace(/^task-/, '');
      for (let i = 0; i < newColunas.length; i++) {
        const index = newColunas[i].tarefas.findIndex(t => String(t.id) === overTaskId);
        if (index !== -1) {
          destColIndex = i;
          destTaskIndex = index;
          break;
        }
      }
    } else if (overId.startsWith('gap-')) {
      const [, colId, indexStr] = overId.split('-');
      destColIndex = newColunas.findIndex(c => String(c.id) === colId);
      if (destColIndex !== -1) destTaskIndex = parseInt(indexStr, 10);
    }

    if (destColIndex === -1) return;

    // Ajustar índice de destino se estiver na mesma coluna e a tarefa estiver acima do destino
    if (sourceColIndex === destColIndex && taskIndex < destTaskIndex) {
      destTaskIndex -= 1;
    }

    // Verificar auto-conclusão ou mudança de status baseada na coluna
    const destColumn = newColunas[destColIndex];
    if (destColumn.tipo && destColumn.tipo !== 'PADRAO') {
      if (destColumn.tipo === 'CONCLUSAO') {
        draggedTask.status = 'CONCLUIDA';
      } else {
        draggedTask.status = destColumn.tipo;
      }
    }

    // Agora sim, remover da origem e inserir no destino
    newColunas[sourceColIndex].tarefas.splice(taskIndex, 1);
    newColunas[destColIndex].tarefas.splice(destTaskIndex, 0, draggedTask);
    setColunas(newColunas);
    
    try {
      const reorderedTasks = destColumn.tarefas.map((task, index) => ({ ...task, coluna_id: destColumn.id, posicao: index }));
      
      await Promise.all(reorderedTasks.map(task => 
        fetch(`http://localhost:3333/tarefas/${task.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(task)
        })
      ));
    } catch (err) {
      console.error('Erro ao persistir drag:', err);
      setColunas(originalColunas);
    }
  };
  
  if (loading) return (
    <div className="dashboard-container"><main className="main-content">
      <div className="loading-container"><div className="loading-spinner"></div><p>Carregando quadro...</p></div>
    </main></div>);

  if (!quadro) return (
    <div className="dashboard-container"><main className="main-content"><div className="kanban-container">
      <div className="empty-state">
        <div className="empty-icon"><i className="fas fa-columns"></i></div>
        <h3>Quadro não encontrado</h3>
        <p>Este projeto não possui um quadro Kanban configurado</p>
        <button className="btn-action primary" onClick={() => router.push('/projetos')} style={{ marginTop: '16px' }}>
          <i className="fas fa-arrow-left"></i> Voltar aos Projetos
        </button>
      </div>
    </div></main></div>);

  return (
    <div className="dashboard-container">
      <main className="main-content">
        <div className="kanban-container">
          <div className="kanban-header">
            <div>
              <button className="btn-back" onClick={() => router.push('/projetos')}><i className="fas fa-arrow-left"></i> Voltar aos Projetos</button>
              <h1 className="kanban-title">{quadro.nome}</h1>
              {projeto?.colaboradores && projeto.colaboradores.length > 0 && (
                <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#64748b' }}>
                  <i className="fas fa-users"></i>
                  <span>{projeto.colaboradores.length} colaborador(es)</span>
                </div>
              )}
            </div>
            <div className="kanban-actions">
              <button className="btn-action secondary" onClick={() => setShowColaboradoresModal(true)}>
                <i className="fas fa-users"></i> Colaboradores
              </button>
              <button className="btn-action secondary" onClick={() => { setSelectedColumnId(null); setShowTaskModal(true) }}>
                <i className="fas fa-plus"></i> Nova Tarefa
              </button>
              <button className="btn-action secondary" onClick={() => { setNewColName(''); setShowNewColumnModal(true) }}>
                <i className="fas fa-columns"></i> Nova Coluna
              </button>
            </div>
          </div>

          <DndContext 
            sensors={sensors} 
            onDragStart={onDragStart} 
            onDragMove={onDragMove} 
            onDragEnd={onDragEnd}
            collisionDetection={closestCenter} 
          >
            <div className="kanban-board">
              {colunas.map((col) => (
                <Column 
                  key={col.id} 
                  col={col} 
                  onAddCard={() => handleAddCard(col.id)} 
                  onTaskClick={handleTaskClick} 
                  onDeleteColumn={() => handleDeleteColumn(col)} 
                  onEditColumn={() => handleEditColumnClick(col)}
                />
              ))}
            </div>

            <DragOverlay>
              {activeTask ? <Task tarefa={activeTask} /> : null}
            </DragOverlay>
          </DndContext>
        </div>
        
        <TaskModal isOpen={showTaskModal} onClose={() => setShowTaskModal(false)} colunas={colunas} projetoId={id} onTaskCreated={fetchQuadro} />
        <TaskDetailModal 
          isOpen={showTaskDetail} 
          onClose={() => setShowTaskDetail(false)} 
          tarefa={selectedTask} 
          onEdit={handleEditTask}
          onConfirmDelete={handleConfirmDeleteTask}
          onTaskUpdated={fetchQuadro} 
        />
        <EditTaskModal
          isOpen={showEditTask}
          onClose={() => setShowEditTask(false)}
          tarefa={taskToEdit}
          colunas={colunas}
          onTaskUpdated={() => {
            setShowEditTask(false);
            fetchQuadro();
          }}
        />
        <DeleteTaskModal
          isOpen={showDeleteTask}
          task={taskToDelete}
          onConfirm={confirmDeleteTask}
          onCancel={() => {
            setShowDeleteTask(false);
            setTaskToDelete(null);
          }}
        />
        <DeleteColumnModal
          isOpen={showDeleteColumn}
          column={columnToDelete}
          onConfirm={confirmDeleteColumn}
          onCancel={() => {
            setShowDeleteColumn(false);
            setColumnToDelete(null);
          }}
        />
        <NewColumnModal
          isOpen={showNewColumnModal}
          onClose={() => {
            setShowNewColumnModal(false);
            setNewColName('');
          }}
          onCreate={handleAddColumn}
          initialValue={newColName}
        />
        <EditColumnModal
          isOpen={showEditColumnModal}
          onClose={() => {
            setShowEditColumnModal(false);
            setColumnToEdit(null);
          }}
          onUpdate={handleUpdateColumn}
          column={columnToEdit}
        />
        <ColaboradoresModal 
          isOpen={showColaboradoresModal} 
          onClose={() => setShowColaboradoresModal(false)} 
          projetoId={id}
          colaboradoresAtuais={projeto?.colaboradores || []}
          onUpdate={(projetoAtualizado) => {
            setProjeto(projetoAtualizado);
            setShowColaboradoresModal(false);
          }}
        />
        <Chatbot 
          projetoId={id} 
          tarefaId={showTaskDetail ? selectedTask?.id : null} 
          onUpdate={fetchQuadro}
        />
      </main>
    </div>
  );
}

// COMPONENTES AUXILIARES
function Column({ col, onAddCard, onTaskClick, onDeleteColumn, onEditColumn }) {
  const { setNodeRef } = useDroppable({ id: `col-${col.id}` });
  
  const getStatusIcon = (tipo) => {
    switch(tipo) {
      case 'CONCLUSAO': return <i className="fas fa-check-circle" style={{ color: '#10b981', fontSize: '14px' }} title="Concluída"></i>;
      case 'PENDENTE': return <i className="fas fa-clock" style={{ color: '#f59e0b', fontSize: '14px' }} title="Pendente"></i>;
      case 'EM_ANDAMENTO': return <i className="fas fa-spinner" style={{ color: '#3b82f6', fontSize: '14px' }} title="Em Andamento"></i>;
      case 'CANCELADA': return <i className="fas fa-ban" style={{ color: '#ef4444', fontSize: '14px' }} title="Cancelada"></i>;
      default: return null;
    }
  };

  return (
    <div ref={setNodeRef} className="kanban-column">
      <div className="kanban-column-header">
        <h3 className="kanban-column-title">
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {col.nome}
            {getStatusIcon(col.tipo)}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span className="kanban-column-count">{col.tarefas.length}</span>
            <button 
              onClick={(e) => { e.stopPropagation(); onEditColumn(); }} 
              style={{ 
                background: 'transparent', 
                border: 'none', 
                color: '#64748b', 
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '4px',
                fontSize: '14px',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => e.target.style.background = '#f1f5f9'}
              onMouseLeave={(e) => e.target.style.background = 'transparent'}
              title="Editar coluna"
            >
              <i className="fas fa-pen"></i>
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onDeleteColumn(); }} 
              style={{ 
                background: 'transparent', 
                border: 'none', 
                color: '#dc2626', 
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '4px',
                fontSize: '14px',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => e.target.style.background = '#fee2e2'}
              onMouseLeave={(e) => e.target.style.background = 'transparent'}
              title="Excluir coluna"
            >
              <i className="fas fa-trash"></i>
            </button>
          </span>
        </h3>
      </div>
      <div className="kanban-column-content">
        <GapDrop id={`gap-${col.id}-0`} />
        {col.tarefas.map((t, i) => (
          <React.Fragment key={t.id}>
            <Task tarefa={t} onClick={onTaskClick} />
            <GapDrop id={`gap-${col.id}-${i + 1}`} />
          </React.Fragment>
        ))}
        <button className="kanban-add-card" onClick={onAddCard}>
          <i className="fas fa-plus"></i> Adicionar tarefa
        </button>
      </div>
    </div>
  );
}

function GapDrop({ id }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const style = { 
    minHeight: isOver ? '70px' : '18px', 
    marginBottom: '8px', 
    borderRadius: '8px', 
    background: isOver ? 'rgba(79, 70, 229, 0.1)' : 'transparent',
    border: isOver ? '2px dashed rgba(79, 70, 229, 0.4)' : '2px dashed transparent',
    transition: 'all 0.2s ease',
    position: 'relative',
    zIndex: 99
  };
  return <div ref={setNodeRef} style={style} />;
}

function Task({ tarefa, onClick }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: `task-${tarefa.id}` });
  
  const isExpired = () => {
    const deadline = tarefa.data_prazo || tarefa.data_vencimento;
    if (!deadline) return false;
    if (tarefa.status === 'CONCLUIDA' || tarefa.status === 'CANCELADA') return false;
    
    const todayStr = new Date().toISOString().split('T')[0];
    // Assuming deadline is YYYY-MM-DD or ISO string
    if (typeof deadline === 'string' && deadline.length >= 10) {
        return deadline.substring(0, 10) < todayStr;
    }
    return new Date(deadline) < new Date();
  };

  const expired = isExpired();

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0 : 1,
    visibility: isDragging ? 'hidden' : 'visible',
    position: 'relative',
    zIndex: 10,
    border: expired ? '1px solid #ef4444' : '1px solid transparent',
    background: expired ? '#fff5f5' : '#fff'
  };

  const getPriorityClass = (prioridade) => {
    switch(prioridade?.toLowerCase()) {
      case 'baixa': return 'priority-baixa';
      case 'media': return 'priority-media';
      case 'alta': return 'priority-alta';
      case 'critica': return 'priority-critica';
      default: return 'priority-media';
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div 
      ref={setNodeRef} 
      {...attributes} 
      {...listeners} 
      className="kanban-card" 
      style={style}
      onClick={onClick ? () => onClick(tarefa) : undefined}
    >
      <h4 className="kanban-card-title">{tarefa.nome || tarefa.titulo}</h4>
      {tarefa.descricao && <p className="kanban-card-description">{tarefa.descricao}</p>}
      <div className="kanban-card-meta">
        <span className={`kanban-card-priority ${getPriorityClass(tarefa.prioridade)}`}>{tarefa.prioridade || 'MÉDIA'}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {(tarefa.data_prazo || tarefa.data_vencimento) && (
            <span className="kanban-card-due" style={{ color: expired ? '#ef4444' : 'inherit', fontWeight: expired ? '600' : 'normal' }}>
              <i className="fas fa-calendar"></i>
              {expired && <span style={{ marginRight: '4px', marginLeft: '4px', fontSize: '10px', textTransform: 'uppercase' }}>Expirado</span>}
              {new Date(tarefa.data_prazo || tarefa.data_vencimento).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
            </span>
          )}
          {tarefa.responsavel && (
            <div 
              title={tarefa.responsavel.nome}
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: '#e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
                fontWeight: '600',
                color: '#475569',
                border: '1px solid #cbd5e1'
              }}
            >
              {getInitials(tarefa.responsavel.nome)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}