'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import withAuth from '@/components/withAuth'
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import axios from 'axios'
import { getSession } from '@/utils/auth'

interface WorkType {
  BIZ_TP: string
  BIZ_CD: string
  BIZ_NM: string
}

interface WorkLogEntry {
  id: string  // 임시 ID (프론트엔드용)
  date: string
  start_time: string
  end_time: string
  description: string
  bizType: string    // 추가
  bizCode: string    // 추가
}

function CreateWorkLogPage() {
  const router = useRouter()
  const [workTypes, setWorkTypes] = useState<WorkType[]>([])
  const [workLogs, setWorkLogs] = useState<WorkLogEntry[]>([{
    id: '1',
    date: new Date().toISOString().split('T')[0],
    start_time: '09:00',
    end_time: '09:00',
    description: '',
    bizType: '',
    bizCode: ''
  }])

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

  const addNewEntry = () => {
    setWorkLogs([
      ...workLogs,
      {
        id: Date.now().toString(),
        date: workLogs[0].date,
        start_time: '09:00',
        end_time: '09:00',
        description: '',
        bizType: '',
        bizCode: ''
      }
    ])
  }

  const removeEntry = (id: string) => {
    if (workLogs.length > 1) {
      setWorkLogs(workLogs.filter(log => log.id !== id))
    }
  }

  const updateEntry = (id: string, field: keyof WorkLogEntry, value: string) => {
    setWorkLogs(workLogs.map(log => {
      if (log.id === id) {
        const updatedLog = { ...log, [field]: value };
        
        // 시작 시간이 변경되고, 종료 시간보다 늦을 경우
        if (field === 'start_time' && value > updatedLog.end_time) {
          updatedLog.end_time = value;
        }
        
        return updatedLog;
      }
      return log;
    }));
  };

  const handleSubmit = async () => {
    try {
      // 제출 전 데이터 확인
      console.log('Submitting workLogs:', workLogs)

      // 필수 입력값 검증
      const hasEmptyFields = workLogs.some(log => 
        !log.date || !log.start_time || !log.end_time || !log.bizCode || !log.bizType
      )

      if (hasEmptyFields) {
        alert('날짜, 시간, 업무 종류는 필수 입력 항목입니다.')
        return
      }

      const session = getSession()
      if (!session?.userId) {
        alert('로그인 정보를 찾을 수 없습니다.')
        router.push('/login')
        return
      }

      const response = await axios.post('/worklog/api/work-logs', {
        username: session.userId,
        workLogs: workLogs
      })

      if (response.data.success) {
        router.push('/dashboard')
      }
    } catch (error: any) {
      console.error('업무 등록 에러:', error)
      alert(error.response?.data?.message || '업무 등록 중 오류가 발생했습니다.')
    }
  }

  const adjustTime = (id: string, field: 'start_time' | 'end_time', minutes: number) => {
    setWorkLogs(workLogs.map(log => {
      if (log.id === id) {
        const [hours, mins] = log[field].split(':').map(Number);
        const date = new Date();
        date.setHours(hours, mins + minutes);
        
        const newTime = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
        const updatedLog = { ...log, [field]: newTime };

        // 시작 시간이 변경되고, 종료 시간보다 늦을 경우
        if (field === 'start_time' && newTime > updatedLog.end_time) {
          updatedLog.end_time = newTime;
        }

        return updatedLog;
      }
      return log;
    }));
  };

  const TimeAdjustChips = ({ logId, field }: { logId: string, field: 'start_time' | 'end_time' }) => (
    <div className="flex gap-1 mt-1">
      <button
        onClick={() => adjustTime(logId, field, 60)}
        className="px-2 py-0.5 text-xs rounded-md bg-blue-500 text-white hover:bg-blue-600 transition-colors"
      >
        +1h
      </button>
      <button
        onClick={() => adjustTime(logId, field, 30)}
        className="px-2 py-0.5 text-xs rounded-md bg-blue-500 text-white hover:bg-blue-600 transition-colors"
      >
        +30m
      </button>
      <button
        onClick={() => adjustTime(logId, field, -60)}
        className="px-2 py-0.5 text-xs rounded-md bg-blue-500 text-white hover:bg-blue-600 transition-colors"
      >
        -1h
      </button>
      <button
        onClick={() => adjustTime(logId, field, -30)}
        className="px-2 py-0.5 text-xs rounded-md bg-blue-500 text-white hover:bg-blue-600 transition-colors"
      >
        -30m
      </button>
    </div>
  )

  return (
    <div className="min-h-screen bg-white relative pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="border-b border-gray-200 pb-4 mb-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">업무 등록</h1>
            <button
              onClick={() => router.back()}
              className="text-gray-600 hover:text-gray-900"
            >
              취소
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {workLogs.map((log, index) => (
            <div 
              key={log.id}
              className="bg-white rounded-lg border border-gray-300 p-4 shadow-sm"
            >
              <div className="grid grid-cols-1 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    날짜
                  </label>
                  <input
                    type="date"
                    value={log.date}
                    onChange={(e) => updateEntry(log.id, 'date', e.target.value)}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-black"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    시작 시간
                  </label>
                  <input
                    type="time"
                    value={log.start_time}
                    onChange={(e) => updateEntry(log.id, 'start_time', e.target.value)}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-black"
                  />
                  <TimeAdjustChips logId={log.id} field="start_time" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    종료 시간
                  </label>
                  <input
                    type="time"
                    value={log.end_time}
                    onChange={(e) => updateEntry(log.id, 'end_time', e.target.value)}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-black"
                  />
                  <TimeAdjustChips logId={log.id} field="end_time" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    업무 종류 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={log.bizCode}
                    onChange={(e) => {
                      const selected = workTypes.find(t => t.BIZ_CD === e.target.value)
                      if (selected) {
                        setWorkLogs(workLogs.map(wl => 
                          wl.id === log.id 
                            ? { 
                                ...wl, 
                                bizType: selected.BIZ_TP,
                                bizCode: selected.BIZ_CD
                              }
                            : wl
                        ))
                      } else {
                        setWorkLogs(workLogs.map(wl => 
                          wl.id === log.id 
                            ? { 
                                ...wl, 
                                bizType: '',
                                bizCode: ''
                              }
                            : wl
                        ))
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
                    value={log.description}
                    onChange={(e) => updateEntry(log.id, 'description', e.target.value)}
                    rows={2}
                    className="w-full rounded-md border-2 border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-black hover:border-gray-400"
                    placeholder="업무 내용을 입력하세요"
                  />
                </div>
              </div>
              {workLogs.length > 1 && (
                <div className="mt-2 flex justify-end">
                  <button
                    onClick={() => removeEntry(log.id)}
                    className="text-red-600 hover:text-red-900"
                    title="삭제"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={addNewEntry}
          className="mt-4 w-full py-2 flex items-center justify-center text-gray-600 hover:text-gray-900 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          <span>업무 추가</span>
        </button>
      </div>

      {/* 하단 고 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 px-4 flex items-center justify-center">
        <button
          onClick={handleSubmit}
          className="w-full max-w-md h-12 flex items-center justify-center bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
        >
          <span className="text-base font-medium">등록하기</span>
        </button>
      </div>
    </div>
  )
}

export default withAuth(CreateWorkLogPage) 