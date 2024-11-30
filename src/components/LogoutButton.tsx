'use client'

import { useRouter } from 'next/navigation'
import { clearSession } from '@/utils/auth'
import axios from 'axios'

export default function LogoutButton() {
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await axios.post('/api/auth/logout')
      clearSession()
      router.push('/login')
    } catch (error) {
      console.error('로그아웃 에러:', error)
      alert('로그아웃 중 오류가 발생했습니다.')
    }
  }

  return (
    <button
      onClick={handleLogout}
      className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
    >
      로그아웃
    </button>
  )
} 