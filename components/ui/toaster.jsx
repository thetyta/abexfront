"use client"

import React, { useEffect, useState } from 'react'
import { Box, Stack, Text, CloseButton } from '@chakra-ui/react'

// Simple in-app toaster that doesn't depend on Chakra's `useToast` hook
export default function Toaster() {
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    // expose create API on window
    if (typeof window !== 'undefined') {
      window.__TOASTER = window.__TOASTER || {}
      window.__TOASTER.create = ({ title, description, status = 'info', duration = 4000 }) => {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2,8)}`
        setToasts((t) => [...t, { id, title, description, status }])
        // auto-dismiss
        setTimeout(() => {
          setToasts((t) => t.filter(x => x.id !== id))
        }, duration)
      }
    }

    return () => {
      if (typeof window !== 'undefined' && window.__TOASTER) {
        delete window.__TOASTER.create
      }
    }
  }, [])

  return (
    <Box position="fixed" top={4} right={4} zIndex={9999}>
      <Stack spacing={3}>
        {toasts.map(toast => (
          <Box key={toast.id} bg={toast.status === 'error' ? 'red.500' : toast.status === 'success' ? 'green.500' : 'gray.800'} color="white" p={3} borderRadius="md" minW="240px" boxShadow="lg">
            <Stack direction="row" align="start" justify="space-between">
              <Box>
                {toast.title && <Text fontWeight="bold">{toast.title}</Text>}
                {toast.description && <Text fontSize="sm">{toast.description}</Text>}
              </Box>
              <CloseButton onClick={() => setToasts(t => t.filter(x => x.id !== toast.id))} />
            </Stack>
          </Box>
        ))}
      </Stack>
    </Box>
  )
}

export const toaster = {
  create: (opts) => {
    if (typeof window !== 'undefined' && window.__TOASTER && window.__TOASTER.create) {
      return window.__TOASTER.create(opts)
    }
    console.warn('toaster not mounted')
  }
}
