'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ProjetoRedirect({ params }){
  const router = useRouter()
  useEffect(()=>{
    router.push(`/projetos/${params.id}/kanban`)
  })
  return null
}
