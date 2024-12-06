'use client'

import { ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline'
import { useRouter } from 'next/navigation'
import { clearSession } from '@/utils/auth'
import axios from 'axios'

export default function LogoutButton() {
  const router = useRouter()

  const handleLogout = async () => {
    try {
      const response = await axios.post('/worklog/api/auth/logout')
      if (response.data.success) {
        clearSession()
        router.push('/login')
      }
    } catch (error) {
      console.error('로그아웃 에러:', error)
      alert('로그아웃 중 오류가 발생했습니다.')
    }
  }

  return (
    <button
      onClick={handleLogout}
      className="text-gray-600 hover:text-gray-900 transition-colors"
      title="로그아웃"
    >
      <ArrowRightOnRectangleIcon className="h-6 w-6" />
    </button>
  )
} 