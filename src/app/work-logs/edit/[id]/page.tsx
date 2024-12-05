'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import withAuth from '@/components/withAuth'
import axios from 'axios'
import { getSession } from '@/utils/auth'

interface WorkLog {
  id: string
  date: string
  start_time: string
  end_time: string
  description: string
  bizType: string
  bizCode: string
}

interface WorkType {
  BIZ_TP: string
  BIZ_CD: string
  BIZ_NM: string
}

interface Props {
  params: { id: string }
}

function EditWorkLogPage({ params }: Props) {
  const router = useRouter()
  const [workLog, setWorkLog] = useState<WorkLog | null>(null)
  const [workTypes, setWorkTypes] = useState<WorkType[]>([])
  const [loading, setLoading] = useState(true)

  // 업무 종류 조회
  useEffect(() => {
    const fetchWorkTypes = async () => {
      try {
        const response = await axios.get('/worklog/api/work-types')
        if (response.data.success) {
          setWorkTypes(response.data.workTypes)
        }
      } catch (error) {
        console.error('업무 종류 조회 에러:', error)
      }
    }

    fetchWorkTypes()
  }, [])

  // 업무 내역 조회
  useEffect(() => {
    const fetchWorkLog = async () => {
      try {
        setLoading(true)
        const session = getSession()
        const response = await axios.get(`/worklog/api/work-logs/${params.id}`, {
          params: { userId: session?.userId }
        })
        
        if (response.data.success && response.data.workLog) {
          setWorkLog(response.data.workLog)
        } else {
          alert('업무 내역을 찾을 수 없습니다.')
          router.back()
        }
      } catch (error) {
        console.error('업무 내역 조회 에러:', error)
        alert('업무 내역을 불러오는데 실패했습니다.')
        router.back()
      } finally {
        setLoading(false)
      }
    }

    fetchWorkLog()
  }, [params.id, router])

  const handleSubmit = async () => {
    try {
      if (!workLog) return

      const session = getSession()
      if (!session?.userId) {
        alert('로그인 정보를 찾을 수 없습니다.')
        router.push('/login')
        return
      }

      const response = await axios.put(`/worklog/api/work-logs/${params.id}`, {
        userId: session.userId,
        workLog: workLog
      })

      if (response.data.success) {
        router.push('/dashboard')
      }
    } catch (error: any) {
      console.error('업무 수정 에러:', error)
      alert(error.response?.data?.message || '업무 수정 중 오류가 발생했습니다.')
    }
  }

  const adjustTime = (field: 'start_time' | 'end_time', minutes: number) => {
    if (!workLog) return;
    
    const [hours, mins] = workLog[field].split(':').map(Number);
    const date = new Date();
    date.setHours(hours, mins + minutes);
    
    const newTime = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    
    // 시작 시간이 변경되고, 종료 시간보다 늦을 경우
    if (field === 'start_time' && newTime > workLog.end_time) {
      setWorkLog({
        ...workLog,
        start_time: newTime,
        end_time: newTime
      });
    } else {
      setWorkLog({
        ...workLog,
        [field]: newTime
      });
    }
  };

  const TimeAdjustChips = ({ field }: { field: 'start_time' | 'end_time' }) => (
    <div className="flex gap-1 mt-1">
      <button
        onClick={() => adjustTime(field, 60)}
        className="px-2 py-0.5 text-xs rounded-md bg-blue-500 text-white hover:bg-blue-600 transition-colors"
      >
        +1h
      </button>
      <button
        onClick={() => adjustTime(field, 30)}
        className="px-2 py-0.5 text-xs rounded-md bg-blue-500 text-white hover:bg-blue-600 transition-colors"
      >
        +30m
      </button>
      <button
        onClick={() => adjustTime(field, -60)}
        className="px-2 py-0.5 text-xs rounded-md bg-blue-500 text-white hover:bg-blue-600 transition-colors"
      >
        -1h
      </button>
      <button
        onClick={() => adjustTime(field, -30)}
        className="px-2 py-0.5 text-xs rounded-md bg-blue-500 text-white hover:bg-blue-600 transition-colors"
      >
        -30m
      </button>
    </div>
  );

  if (loading || !workLog) {
    return <div className="min-h-screen bg-white flex items-center justify-center">로딩중...</div>
  }

  return (
    <div className="min-h-screen bg-white relative pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="border-b border-gray-200 pb-4 mb-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">업무 수정</h1>
            <button
              onClick={() => router.back()}
              className="text-gray-600 hover:text-gray-900"
            >
              취소
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-300 p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                날짜
              </label>
              <input
                type="date"
                value={workLog.date}
                onChange={(e) => setWorkLog({ ...workLog, date: e.target.value })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-black"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                시작 시간
              </label>
              <input
                type="time"
                value={workLog.start_time}
                onChange={(e) => {
                  const newTime = e.target.value;
                  if (newTime > workLog.end_time) {
                    setWorkLog({
                      ...workLog,
                      start_time: newTime,
                      end_time: newTime
                    });
                  } else {
                    setWorkLog({
                      ...workLog,
                      start_time: newTime
                    });
                  }
                }}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-black"
              />
              <TimeAdjustChips field="start_time" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                종료 시간
              </label>
              <input
                type="time"
                value={workLog.end_time}
                onChange={(e) => setWorkLog({ ...workLog, end_time: e.target.value })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-black"
              />
              <TimeAdjustChips field="end_time" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                업무 종류 <span className="text-red-500">*</span>
              </label>
              <select
                value={workLog.bizCode}
                onChange={(e) => {
                  const selected = workTypes.find(t => t.BIZ_CD === e.target.value)
                  if (selected) {
                    setWorkLog({
                      ...workLog,
                      bizType: selected.BIZ_TP,
                      bizCode: selected.BIZ_CD
                    })
                  }
                }}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              >
                <option value="">선택하세요</option>
                {workTypes.map((type) => (
                  <option key={type.BIZ_CD} value={type.BIZ_CD}>
                    {type.BIZ_NM}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                업무 내용
              </label>
              <textarea
                value={workLog.description}
                onChange={(e) => setWorkLog({ ...workLog, description: e.target.value })}
                rows={2}
                className="w-full rounded-md border-2 border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-black hover:border-gray-400"
                placeholder="업무 내용을 입력하세요"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 px-4 flex items-center justify-center">
        <button
          onClick={handleSubmit}
          className="w-full max-w-md h-12 flex items-center justify-center bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
        >
          <span className="text-base font-medium">수정하기</span>
        </button>
      </div>
    </div>
  )
}

export default withAuth(EditWorkLogPage)