'use client'

import { useState } from 'react'
import withAuth from '@/components/withAuth'
import LogoutButton from '@/components/LogoutButton'
import WorkLogList from '@/components/WorkLogList'
import DateRangePicker from '@/components/DateRangePicker'
import { PlusIcon } from '@heroicons/react/24/outline'
import { useRouter } from 'next/navigation'

function DashboardPage() {
  const today = new Date()
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)

  startOfMonth.setHours(0, 0, 0, 0)
  endOfMonth.setHours(23, 59, 59, 999)

  const [dateRange, setDateRange] = useState({
    startDate: startOfMonth,
    endDate: endOfMonth
  })

  const router = useRouter()

  return (
    <div className="min-h-screen bg-white relative pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="border-b border-gray-200 pb-4 mb-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">업무 내역 조회</h1>
            <LogoutButton />
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-3 mb-3 shadow-sm">
          <DateRangePicker
            dateRange={dateRange}
            onChange={setDateRange}
          />
        </div>

        <div className="bg-white rounded-lg shadow">
          <WorkLogList dateRange={dateRange} />
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 px-4 flex items-center justify-center">
        <button
          onClick={() => router.push('/work-logs/create')}
          className="w-full max-w-md h-12 flex items-center justify-center space-x-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
        >
          <PlusIcon className="h-5 w-5" />
          <span className="text-base font-medium">업무 등록</span>
        </button>
      </div>
    </div>
  )
}

export default withAuth(DashboardPage) 