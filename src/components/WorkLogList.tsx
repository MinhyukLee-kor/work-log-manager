'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { PencilIcon, TrashIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import axios from 'axios'
import { getSession } from '@/utils/auth'

interface WorkLog {
  id: number
  date: string
  start_time: string
  end_time: string
  description: string
  bizType: string
  bizCode: string
  bizName: string
}

interface WorkLogListProps {
  workLogs: WorkLog[];
  loading: boolean;
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
}

export default function WorkLogList({ workLogs, loading, dateRange }: WorkLogListProps) {
  const router = useRouter()

  const handleDelete = async (id: number) => {
    if (!confirm('이 업무를 삭제하시겠습니까?')) {
      return
    }

    try {
      const session = getSession()
      if (!session?.userId) {
        alert('로그인 정보를 찾을 수 없습니다.')
        router.push('/login')
        return
      }

      const response = await axios.delete(`/worklog/api/work-logs/${id}`, {
        params: { userId: session.userId }
      })

      if (response.data.success) {
        alert('삭제되었습니다.')
        window.location.reload()
      }
    } catch (error) {
      console.error('업무 삭제 에러:', error)
      alert('삭제 중 오류가 발생했습니다.')
    }
  }

  const formatDate = (dateStr: string) => {
    try {
      const [year, month, day] = dateStr.substring(0, 10).split('-')
      return `${year.substring(2)}-${month}-${day}`
    } catch (error) {
      console.error('날짜 형식 에러:', dateStr, error)
      return dateStr
    }
  }

  const calculateTotalHours = (logs: WorkLog[]) => {
    let totalMinutes = 0;
    
    logs.forEach(log => {
      const startTime = new Date(`${log.date} ${log.start_time}`);
      const endTime = new Date(`${log.date} ${log.end_time}`);
      const diffMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
      totalMinutes += diffMinutes;
    });

    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.round(totalMinutes % 60);
    
    return `${hours}시간 ${minutes}분`;
  };

  const groupedLogs = workLogs.reduce((acc, log) => {
    if (!acc[log.date]) {
      acc[log.date] = [];
    }
    acc[log.date].push(log);
    return acc;
  }, {} as Record<string, WorkLog[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!workLogs || workLogs.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-xl text-gray-500">등록된 업무가 없습니다.</p>
      </div>
    )
  }

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      <div className="overflow-auto" style={{ height: 'calc(100vh - 400px)' }}>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-200 sticky top-0 z-10">
            <tr>
              <th scope="col" className="px-1 py-1 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-[80px]">날짜</th>
              <th scope="col" className="hidden md:table-cell px-1 py-1 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-[100px]">시간</th>
              <th scope="col" className="px-1 py-1 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">업무</th>
              <th scope="col" className="px-1 py-1 text-center text-xs font-medium text-gray-500 uppercase tracking-widerw-[100px]">업무 내용</th>
              <th scope="col" className="px-1 py-1 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-[80px]">작업</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {Object.entries(groupedLogs).map(([date, logs]) => (
              <React.Fragment key={date}>
                {logs.map((log, index) => (
                  <tr 
                    key={log.id} 
                    className={`text-center hover:bg-gray-50 transition-colors duration-150 ease-in-out
                      ${index === 0 ? 'border-t-2 border-gray-300' : ''}`}
                  >
                    <td className="px-1 py-1 whitespace-nowrap text-sm text-gray-900 w-[80px]">
                      {index === 0 ? (
                        <div>
                          <div>{formatDate(log.date)}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {calculateTotalHours(logs)}
                          </div>
                        </div>
                      ) : null}
                    </td>
                    <td className="hidden md:table-cell px-1 py-1 whitespace-nowrap text-sm text-gray-500 w-[100px]">
                      {log.start_time} - {log.end_time}
                    </td>
                    <td className="px-1 py-1 whitespace-normal">
                      <div className="flex md:flex-row flex-col items-center justify-center gap-1">
                        <span className="px-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 w-fit">
                          {log.bizType === 'P' ? '프로젝트' : '공통'}
                        </span>
                        <span className="text-sm text-gray-500 md:ml-1 break-all md:line-clamp-none line-clamp-2">
                          {log.bizName}
                        </span>
                      </div>
                    </td>
                    <td className="px-1 py-1 text-sm text-gray-900 w-[100px]">
                      <div className="line-clamp-2">{log.description}</div>
                      <div className="md:hidden text-xs text-gray-500 mt-1">
                        {log.start_time} - {log.end_time}
                      </div>
                    </td>
                    <td className="px-1 py-1 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => router.push(`/work-logs/edit/${log.id}`)}
                        className="text-indigo-600 hover:text-indigo-900 mr-2"
                        title="수정"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(log.id)}
                        className="text-red-600 hover:text-red-900"
                        title="삭제"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

