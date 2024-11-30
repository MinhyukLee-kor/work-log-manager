'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { isAuthenticated, getSession } from '@/utils/auth'

export default function withAuth(Component: React.ComponentType, requiredRole?: string) {
  return function ProtectedRoute(props: any) {
    const router = useRouter()

    useEffect(() => {
      const checkAuth = () => {
        if (!isAuthenticated()) {
          router.push('/login')
          return
        }

        if (requiredRole) {
          const session = getSession()
          if (session?.role !== requiredRole) {
            router.push('/unauthorized')
          }
        }
      }

      checkAuth()
    }, [router])

    return <Component {...props} />
  }
} 