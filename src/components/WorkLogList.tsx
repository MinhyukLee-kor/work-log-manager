'use client'

import { useRouter } from 'next/navigation'
import { PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline'
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
        // 페이지 새로고침
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

  let previousDate = ''

  if (loading) {
    return <div className="p-4 text-center text-gray-500">로딩중...</div>
  }

  if (!workLogs || workLogs.length === 0) {
    return <div className="p-4 text-center text-gray-500">등록된 업무가 없습니다.</div>
  }

  // 날짜별로 업무 시간을 계산하는 함수
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

  // 날짜별로 업무 로그를 그룹화
  const groupedLogs = workLogs.reduce((acc, log) => {
    if (!acc[log.date]) {
      acc[log.date] = [];
    }
    acc[log.date].push(log);
    return acc;
  }, {} as Record<string, WorkLog[]>);

  return (
    <div className="border rounded-lg shadow">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="sticky top-0 text-center bg-gray-50 px-1 py-1 md:px-3 md:py-2 text-xs font-medium text-gray-500 tracking-wider w-20 md:w-24">날짜</th>
              <th className="sticky top-0 text-center bg-gray-50 hidden md:table-cell px-1 py-1 md:px-3 md:py-2 text-xs font-medium text-gray-500 tracking-wider w-28">시간</th>
              <th className="sticky top-0 text-center bg-gray-50 px-1 py-1 md:px-3 md:py-2 text-xs font-medium text-gray-500 tracking-wider w-24 md:w-28">업무</th>
              <th className="sticky top-0 text-center bg-gray-50 px-1 py-1 md:px-3 md:py-2 text-xs font-medium text-gray-500 tracking-wider">업무 내용</th>
              <th className="sticky top-0 text-center bg-gray-50 px-1 py-1 md:px-3 md:py-2 text-xs font-medium text-gray-500 tracking-wider w-20">작업</th>
            </tr>
          </thead>
        </table>
      </div>
      <div className="overflow-auto" style={{ height: 'calc(5 * 2.75rem)' }}>
        <table className="min-w-full divide-y divide-gray-200">
          <tbody className="bg-white divide-y divide-gray-200">
            {workLogs.map((log) => {
              const showDate = log.date !== previousDate
              previousDate = log.date
              
              return (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="text-center px-1 py-1 md:px-3 md:py-2 whitespace-nowrap text-sm text-gray-900 w-20 md:w-24">
                    {showDate && (
                      <div>
                        <div>{formatDate(log.date)}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {calculateTotalHours(groupedLogs[log.date])}
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="text-center hidden md:table-cell px-1 py-1 md:px-3 md:py-2 whitespace-nowrap text-sm text-gray-900 w-28">
                    {log.start_time} - {log.end_time}
                  </td>
                  <td className="text-center px-1 py-1 md:px-3 md:py-2 whitespace-nowrap text-sm text-gray-900 w-24 md:w-28">
                    <div>
                      <div>{log.bizType === 'P' ? '프로젝트' : '공통'}</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {log.bizCode}
                      </div>
                    </div>
                  </td>
                  <td className="text-center px-1 py-1 md:px-3 md:py-2 text-sm text-gray-900">
                    <div>
                      {log.description}
                      <div className="md:hidden text-xs text-gray-500 mt-0.5">
                        {log.start_time} - {log.end_time}
                      </div>
                    </div>
                  </td>
                  <td className="text-center px-1 py-1 md:px-3 md:py-2 whitespace-nowrap text-sm text-gray-500 w-20">
                    <div className="flex items-center justify-center space-x-2">
                      <button
                        onClick={() => router.push(`/work-logs/edit/${log.id}`)}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="수정"
                      >
                        <PencilSquareIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(log.id)}
                        className="text-red-600 hover:text-red-900"
                        title="삭제"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
} 