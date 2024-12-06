'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import withAuth from '@/components/withAuth'
import axios from 'axios'
import { getSession } from '@/utils/auth'
import LogoutButton from '@/components/LogoutButton'
import WorkLogList from '@/components/WorkLogList'
import DateRangePicker from '@/components/DateRangePicker'
import { PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'

function DashboardPage() {
  const router = useRouter()
  const [workLogs, setWorkLogs] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchWorkLogs = async (start: Date, end: Date) => {
    try {
      setLoading(true)
      const session = getSession()
      if (!session?.userId) {
        alert('로그인 정보를 찾을 수 없습니다.')
        router.push('/login')
        return
      }

      const formatDate = (date: Date) => {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
      }

      const response = await axios.get('/worklog/api/work-logs', {
        params: {
          userId: session.userId,
          startDate: formatDate(start),
          endDate: formatDate(end)
        }
      })

      if (response.data.success) {
        setWorkLogs(response.data.workLogs)
      }
    } catch (error) {
      console.error('업무 내역 조회 에러:', error)
      alert('업무 내역을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const today = new Date()
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)

  startOfMonth.setHours(0, 0, 0, 0)
  endOfMonth.setHours(23, 59, 59, 999)

  const [dateRange, setDateRange] = useState({
    startDate: startOfMonth,
    endDate: endOfMonth
  })

  // 초기 데이터 로딩
  useEffect(() => {
    fetchWorkLogs(startOfMonth, endOfMonth)
  }, [])

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">업무 내역 조회</h1>
            <LogoutButton />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center space-x-4">
            <div className="flex-grow">
              <DateRangePicker
                dateRange={dateRange}
                onChange={(newDateRange) => {
                  setDateRange(newDateRange)
                }}
              />
            </div>
            <button
              onClick={() => fetchWorkLogs(dateRange.startDate, dateRange.endDate)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center"
            >
              <MagnifyingGlassIcon className="h-5 w-5 mr-2" />
              <span>조회</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm">
          <WorkLogList 
            workLogs={workLogs} 
            loading={loading}
            dateRange={dateRange} 
          />
        </div>
      </div>

      <div className="fixed bottom-4 left-0 right-0 px-4 flex items-center justify-center">
        <button
          onClick={() => router.push('/work-logs/create')}
          className="w-full max-w-md h-14 flex items-center justify-center space-x-2 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
        >
          <PlusIcon className="h-6 w-6" />
          <span className="text-lg font-medium">업무 등록</span>
        </button>
      </div>
    </div>
  )
}

export default withAuth(DashboardPage)

