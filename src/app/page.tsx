'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getSession } from '@/utils/auth'

export default function RootPage() {
  const router = useRouter()

  useEffect(() => {
    const session = getSession()
    if (!session) {
      router.push('/login')
    } else {
      // 로그인된 상태라면 home 값에 따라 리다이렉션
      router.push(session.home === '사업' ? '/dashboard' : '/home')
    }
  }, [router])

  // 리다이렉션하는 동안 보여줄 로딩 화면
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-gray-500">로딩중...</div>
    </div>
  )
}
