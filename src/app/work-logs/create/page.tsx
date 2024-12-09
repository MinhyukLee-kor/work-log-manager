'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import withAuth from '@/components/withAuth'
import { PlusIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline'
import axios from 'axios'
import { getSession } from '@/utils/auth'
import { validateTimeOverlaps, validateStartEndTime } from '@/utils/workTime'
import { motion, AnimatePresence } from 'framer-motion'
import SearchableSelect from '@/components/SearchableSelect'

interface WorkType {
  BIZ_TP: string
  BIZ_CD: string
  BIZ_NM: string
}

interface WorkLogEntry {
  id: string
  date: string
  start_time: string
  end_time: string
  description: string
  bizType: string
  bizCode: string
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

  useEffect(() => {
    const fetchWorkTypes = async () => {
      try {
        const response = await axios.get('/worklog/api/work-types', {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'Expires': '0',
          }
        })
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
        
        if (field === 'start_time' && value > updatedLog.end_time) {
          updatedLog.end_time = value;
        }
        if (field === 'end_time' && value < updatedLog.start_time) {
          updatedLog.end_time = updatedLog.start_time;
        }
        
        return updatedLog;
      }
      return log;
    }));
  };

  const handleSubmit = async () => {
    try {
      const hasEmptyFields = workLogs.some(log => 
        !log.date || !log.start_time || !log.end_time || !log.bizCode || !log.bizType
      );

      if (hasEmptyFields) {
        alert('날짜, 시간, 업무 종류는 필수 입력 항목입니다.');
        return;
      }

      for (const log of workLogs) {
        const timeValidation = validateStartEndTime(log.start_time, log.end_time);
        if (!timeValidation.isValid) {
          alert(timeValidation.message);
          return;
        }
      }

      const overlapCheck = validateTimeOverlaps(workLogs);
      if (overlapCheck.isOverlapping) {
        alert(overlapCheck.message);
        return;
      }

      const session = getSession();
      if (!session?.userId) {
        alert('로그인 정보를 찾을 수 없습니다.');
        router.push('/login');
        return;
      }

      const response = await axios.post('/worklog/api/work-logs', {
        username: session.userId,
        workLogs: workLogs
      });

      if (response.data.success) {
        router.push('/dashboard');
      }
    } catch (error: any) {
      console.error('업무 등록 에러:', error);
      alert(error.response?.data?.message || '업무 등록 중 오류가 발생했습니다.');
    }
  };

  const adjustTime = (id: string, field: 'start_time' | 'end_time', minutes: number) => {
    setWorkLogs(workLogs.map(log => {
      if (log.id === id) {
        const [hours, mins] = log[field].split(':').map(Number);
        const date = new Date();
        date.setHours(hours, mins + minutes);
        
        const newTime = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
        const updatedLog = { ...log };

        if (field === 'start_time') {
          if (newTime > updatedLog.end_time) {
            updatedLog.start_time = newTime;
            updatedLog.end_time = newTime;
          } else {
            updatedLog.start_time = newTime;
          }
        } else {
          if (newTime < updatedLog.start_time) {
            updatedLog.end_time = updatedLog.start_time;
          } else {
            updatedLog.end_time = newTime;
          }
        }

        return updatedLog;
      }
      return log;
    }));
  };

  const TimeAdjustChips = ({ logId, field }: { logId: string, field: 'start_time' | 'end_time' }) => (
    <div className="flex gap-2 mt-2">
      {[60, 30, -30, -60].map((minutes) => (
        <button
          key={minutes}
          onClick={() => adjustTime(logId, field, minutes)}
          className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
        >
          {minutes > 0 ? '+' : ''}{minutes}m
        </button>
      ))}
    </div>
  )

  const inputClass = "w-full rounded-lg border-2 border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-black"

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-20"
    >
      <motion.div 
        variants={itemVariants}
        className="bg-white shadow-sm border-b"
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">업무 등록</h1>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => router.back()}
              className="text-gray-600 hover:text-gray-900 transition-colors"
              title="취소"
            >
              <XMarkIcon className="h-6 w-6" />
            </motion.button>
          </div>
        </div>
      </motion.div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <AnimatePresence>
          {workLogs.map((log, index) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-sm p-6 mb-4 border"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    날짜
                  </label>
                  <input
                    type="date"
                    value={log.date}
                    onChange={(e) => updateEntry(log.id, 'date', e.target.value)}
                    className={inputClass}
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
                    className={inputClass}
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
                    className={inputClass}
                  />
                  <TimeAdjustChips logId={log.id} field="end_time" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    업무 종류 <span className="text-red-500">*</span>
                  </label>
                  <SearchableSelect
                    options={workTypes.map(type => ({
                      value: type.BIZ_CD,
                      label: type.BIZ_NM,
                      type: type.BIZ_TP
                    }))}
                    value={log.bizCode}
                    onChange={(value, type) => {
                      setWorkLogs(workLogs.map(wl => 
                        wl.id === log.id 
                          ? { 
                              ...wl, 
                              bizType: type,
                              bizCode: value
                            }
                          : wl
                      ))
                    }}
                    className="text-black"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    업무 내용
                  </label>
                  <textarea
                    value={log.description}
                    onChange={(e) => updateEntry(log.id, 'description', e.target.value)}
                    rows={3}
                    className={`${inputClass} resize-none`}
                    placeholder="업무 내용을 입력하세요"
                  />
                </div>
              </div>
              {workLogs.length > 1 && (
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => removeEntry(log.id)}
                    className="text-red-600 hover:text-red-700 transition-colors"
                    title="삭제"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        <motion.button
          variants={itemVariants}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={addNewEntry}
          className="mt-6 w-full py-3 flex items-center justify-center text-blue-600 hover:text-blue-700 bg-white rounded-lg hover:bg-gray-50 border-2 border-blue-100 transition-colors duration-200 shadow-sm"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          <span>업무 추가</span>
        </motion.button>
      </div>

      <motion.div 
        variants={itemVariants}
        className="fixed bottom-4 left-0 right-0 px-4 flex items-center justify-center"
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSubmit}
          className="w-full max-w-md h-14 flex items-center justify-center bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
        >
          <span className="text-lg font-medium">등록하기</span>
        </motion.button>
      </motion.div>
    </motion.div>
  )
}

export default withAuth(CreateWorkLogPage)