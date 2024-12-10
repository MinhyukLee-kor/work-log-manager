'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import withAuth from '@/components/withAuth'
import axios from 'axios'
import { getSession } from '@/utils/auth'
import { validateStartEndTime } from '@/utils/workTime'
import { ArrowLeftIcon, ClockIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { motion } from 'framer-motion'
import SearchableSelect from '@/components/SearchableSelect'

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
      if (!workLog) return;

      const timeValidation = validateStartEndTime(workLog.start_time, workLog.end_time);
      if (!timeValidation.isValid) {
        alert(timeValidation.message);
        return;
      }

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

  const handleTimeChange = (field: 'start_time' | 'end_time', value: string) => {
    if (!workLog) return;

    if (field === 'start_time' && value > workLog.end_time) {
      setWorkLog({
        ...workLog,
        start_time: value,
        end_time: value
      });
    } else if (field === 'end_time' && value < workLog.start_time) {
      setWorkLog({
        ...workLog,
        end_time: workLog.start_time
      });
    } else {
      setWorkLog({
        ...workLog,
        [field]: value
      });
    }
  };

  const adjustTime = (field: 'start_time' | 'end_time', minutes: number) => {
    if (!workLog) return;
    
    const [hours, mins] = workLog[field].split(':').map(Number);
    const date = new Date();
    date.setHours(hours, mins + minutes);
    
    const newTime = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    
    if (field === 'start_time') {
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
    } else { // end_time
      if (newTime < workLog.start_time) {
        setWorkLog({
          ...workLog,
          end_time: workLog.start_time
        });
      } else {
        setWorkLog({
          ...workLog,
          end_time: newTime
        });
      }
    }
  };

  const TimeAdjustChips = ({ field }: { field: 'start_time' | 'end_time' }) => (
    <div className="flex gap-2 mt-2">
      {[60, 30, -30, -60].map((minutes) => (
        <button
          key={minutes}
          onClick={() => adjustTime(field, minutes)}
          className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
        >
          {minutes > 0 ? '+' : ''}{minutes}m
        </button>
      ))}
    </div>
  );

  // input 필드들의 공통 클래스
  const inputClass = "w-full rounded-lg border-2 border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-black h-[42px]"

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

  if (loading || !workLog) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <motion.div
          initial={{ rotate: 0 }}
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full"
        />
      </div>
    )
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
            <h1 className="text-2xl font-bold text-gray-900">업무 수정</h1>
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
        <motion.div
          variants={itemVariants}
          className="bg-white rounded-xl shadow-sm p-6 border"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                날짜
              </label>
              <input
                type="date"
                value={workLog.date}
                onChange={(e) => setWorkLog({ ...workLog, date: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                시작 시간
              </label>
              <div className="relative">
                <input
                  type="time"
                  value={workLog.start_time}
                  onChange={(e) => handleTimeChange('start_time', e.target.value)}
                  className={`${inputClass} pl-10`}
                />
                <ClockIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              </div>
              <TimeAdjustChips field="start_time" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                종료 시간
              </label>
              <div className="relative">
                <input
                  type="time"
                  value={workLog.end_time}
                  onChange={(e) => handleTimeChange('end_time', e.target.value)}
                  className={`${inputClass} pl-10`}
                />
                <ClockIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              </div>
              <TimeAdjustChips field="end_time" />
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
                value={workLog.bizCode}
                onChange={(value, type) => {
                  setWorkLog({
                    ...workLog,
                    bizType: type,
                    bizCode: value
                  })
                }}
                className="text-black"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                업무 내용
              </label>
              <textarea
                value={workLog.description}
                onChange={(e) => setWorkLog({ ...workLog, description: e.target.value })}
                rows={4}
                className={`${inputClass} resize-none`}
                placeholder="업무 내용을 입력하세요"
              />
            </div>
          </div>
        </motion.div>
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
          <span className="text-lg font-medium">수정 완료</span>
        </motion.button>
      </motion.div>
    </motion.div>
  )
}

export default withAuth(EditWorkLogPage)

