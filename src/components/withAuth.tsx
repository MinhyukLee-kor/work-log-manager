'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { isAuthenticated, getSession } from '@/utils/auth'

export default function withAuth<P extends object>(Component: React.ComponentType<P>) {
  return function ProtectedRoute(props: P) {
    const router = useRouter()

    useEffect(() => {
      if (!isAuthenticated()) {
        router.push('/login')
      }
    }, [router])

    return <Component {...props} />
  }
} 