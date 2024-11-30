'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'
import { getSession } from '@/utils/auth'
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline'

interface WorkLog {
  id: number
  date: string
  start_time: string
  end_time: string
  description: string
}

interface GroupedWorkLogs {
  [date: string]: WorkLog[]
}

interface Props {
  dateRange: {
    startDate: Date
    endDate: Date
  }
}

export default function WorkLogList({ dateRange }: Props) {
  const [workLogs, setWorkLogs] = useState<WorkLog[]>([])
  const [loading, setLoading] = useState(false)

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('ko-KR', {
      year: '2-digit',
      month: '2-digit',
      day: '2-digit'
    }).replace(/\. /g, '-').replace('.', '')
  }

  const formatTime = (timeStr: string) => {
    return timeStr.substring(0, 5)
  }

  // 업무 일자별로 데이터 그룹화
  const groupWorkLogsByDate = (logs: WorkLog[]): GroupedWorkLogs => {
    return logs.reduce((groups, log) => {
      const date = log.date
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(log)
      return groups
    }, {} as GroupedWorkLogs)
  }

  useEffect(() => {
    const fetchWorkLogs = async () => {
      try {
        setLoading(true)
        const session = getSession()
        const response = await axios.get('/api/work-logs', {
          params: {
            username: session?.username,
            startDate: dateRange.startDate.toISOString().split('T')[0],
            endDate: dateRange.endDate.toISOString().split('T')[0]
          }
        })
        setWorkLogs(response.data.workLogs)
      } catch (error) {
        console.error('업무 내역 조회 에러:', error)
        alert('업무 내역을 불러오는데 실패했습니다.')
      } finally {
        setLoading(false)
      }
    }

    fetchWorkLogs()
  }, [dateRange])

  if (loading) {
    return <div className="text-center py-4">로딩중...</div>
  }

  const groupedWorkLogs = groupWorkLogsByDate(workLogs)
  const dates = Object.keys(groupedWorkLogs).sort().reverse()

  return (
    <div className="overflow-hidden">
      {/* 데스크톱 테이블 */}
      <div className="hidden md:block max-h-[calc(100vh-350px)] overflow-y-auto">
        <table className="min-w-full divide-y divide-gray-300">
          <thead>
            <tr className="bg-gray-50">
              <th scope="col" className="w-24 px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap border-b border-gray-300">
                업무일자
              </th>
              <th scope="col" className="w-20 px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap border-b border-gray-300">
                시작
              </th>
              <th scope="col" className="w-20 px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap border-b border-gray-300">
                종료
              </th>
              <th scope="col" className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-300">
                업무내용
              </th>
              <th scope="col" className="w-20 relative px-2 py-3 border-b border-gray-300">
                <span className="sr-only">작업</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-300">
            {workLogs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-2 py-4 text-center text-sm text-gray-500">
                  해당 기간에 등록된 업무 내역이 없습니다.
                </td>
              </tr>
            ) : (
              dates.map((date) => (
                groupedWorkLogs[date].map((log, index) => (
                  <tr 
                    key={log.id}
                    className={index === 0 ? 'border-t-4 border-gray-300' : ''}
                  >
                    <td className="px-2 py-4 text-sm text-gray-900 whitespace-nowrap">
                      {index === 0 ? formatDate(log.date) : ''}
                    </td>
                    <td className="px-2 py-4 text-sm text-gray-900 whitespace-nowrap">
                      {formatTime(log.start_time)}
                    </td>
                    <td className="px-2 py-4 text-sm text-gray-900 whitespace-nowrap">
                      {formatTime(log.end_time)}
                    </td>
                    <td className="px-2 py-4 text-sm text-gray-900">
                      {log.description}
                    </td>
                    <td className="px-2 py-4 text-right text-sm font-medium whitespace-nowrap">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => {/* 수정 기능 구현 예정 */}}
                          className="p-1 text-blue-600 hover:text-blue-900 rounded-full hover:bg-blue-100"
                          title="수정"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {/* 삭제 기능 구현 예정 */}}
                          className="p-1 text-red-600 hover:text-red-900 rounded-full hover:bg-red-100"
                          title="삭제"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 모바일 테이블 */}
      <div className="md:hidden max-h-[calc(100vh-380px)] overflow-y-auto">
        <table className="min-w-full divide-y divide-gray-300">
          <thead>
            <tr className="bg-gray-50">
              <th scope="col" className="w-24 px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap border-b border-gray-300">
                업무일자
              </th>
              <th scope="col" className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-300">
                업무내용
              </th>
              <th scope="col" className="w-16 relative px-2 py-2 border-b border-gray-300">
                <span className="sr-only">작업</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-300">
            {workLogs.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-2 py-2 text-center text-sm text-gray-500">
                  해당 기간에 등록된 업무 내역이 없습니다.
                </td>
              </tr>
            ) : (
              dates.map((date) => (
                groupedWorkLogs[date].map((log, index) => (
                  <tr 
                    key={log.id}
                    className={index === 0 ? 'border-t-4 border-gray-300' : ''}
                  >
                    <td className="px-2 py-2 text-sm text-gray-900 whitespace-nowrap">
                      {index === 0 ? formatDate(log.date) : ''}
                    </td>
                    <td className="px-2 py-2">
                      <p className="text-sm text-gray-900 mb-0.5">
                        {log.description}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatTime(log.start_time)} - {formatTime(log.end_time)}
                      </p>
                    </td>
                    <td className="px-2 py-2 text-right text-sm font-medium whitespace-nowrap">
                      <div className="flex justify-end space-x-1">
                        <button
                          onClick={() => {/* 수정 기능 구현 예정 */}}
                          className="p-1 text-blue-600 hover:text-blue-900 rounded-full hover:bg-blue-100"
                          title="수정"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {/* 삭제 기능 구현 예정 */}}
                          className="p-1 text-red-600 hover:text-red-900 rounded-full hover:bg-red-100"
                          title="삭제"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
} 