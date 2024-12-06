'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import axios from 'axios'
import { setSession, isAuthenticated } from '@/utils/auth'
import { UserIcon, KeyIcon } from '@heroicons/react/24/outline'
import { motion } from 'framer-motion'

interface LoginForm {
  username: string
  password: string
}

export default function LoginPage() {
  const router = useRouter()
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>()

  useEffect(() => {
    if (isAuthenticated()) {
      router.push('/dashboard')
    }
  }, [router])

  const onSubmit = async (data: LoginForm) => {
    try {
      const response = await axios.post('/worklog/api/auth/login', data)
      if (response.data.success) {
        setSession({
          username: data.username,
          nickname: response.data.user.nickname,
          role: response.data.user.role,
          rights: response.data.user.rights,
          duty: response.data.user.duty,
          userId: response.data.user.userId,
          home: response.data.user.home
        })
        
        if (response.data.user.passwordExpired === '1') {
          router.push('/change-password')
        } else if (response.data.user.role === 'ADMIN') {
          router.push('/admin')
        } else {
          router.push('/dashboard')  // 항상 대시보드로 이동
        }
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        alert(error.response.data.message)
      } else {
        alert('로그인 중 오류가 발생했습니다.')
      }
      console.error('로그인 에러:', error)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md px-8 py-10 mx-4"
      >
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="px-8 py-10">
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3 }}
              className="text-center mb-8"
            >
              <div className="flex justify-center mb-4">
                <motion.div
                  initial={{ rotate: -10, scale: 0.9 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ 
                    type: "spring",
                    stiffness: 260,
                    damping: 20
                  }}
                >
                  <Image
                    src="/worklog/icons/icon-512x512.png"
                    alt="WorkLog"
                    width={150}
                    height={150}
                  />
                </motion.div>
              </div>
              <p className="text-gray-600 mt-2">업무 관리 시스템에 로그인하세요</p>
            </motion.div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      {...register('username', { required: '아이디를 입력해주세요' })}
                      type="text"
                      className="text-black w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-blue-500 transition-colors duration-200"
                      placeholder="아이디"
                    />
                  </div>
                  {errors.username && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-500 text-sm mt-1"
                    >
                      {errors.username.message}
                    </motion.p>
                  )}
                </div>

                <div>
                  <div className="relative">
                    <KeyIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      {...register('password', { required: '비밀번호를 입력해주세요' })}
                      type="password"
                      className="text-blackw-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-blue-500 transition-colors duration-200"
                      placeholder="비밀번호"
                    />
                  </div>
                  {errors.password && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-500 text-sm mt-1"
                    >
                      {errors.password.message}
                    </motion.p>
                  )}
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>로그인</span>
                )}
              </motion.button>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  )
} 