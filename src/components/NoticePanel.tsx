'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline'
import Image from 'next/image'

const IMAGE_WIDTH = 600
const IMAGE_HEIGHT = 150

export default function NoticePanel(): React.JSX.Element {
  const [isExpanded, setIsExpanded] = useState(true)

  return (
    <div className="bg-white rounded-xl shadow-sm border p-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex justify-between items-center text-left"
      >
        <span className="text-lg font-medium text-gray-900">작성 안내</span>
        {isExpanded ? (
          <ChevronUpIcon className="h-5 w-5 text-gray-500" />
        ) : (
          <ChevronDownIcon className="h-5 w-5 text-gray-500" />
        )}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="mt-4 space-y-4 text-sm text-gray-600">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">1. 업무내용 작성 방법</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>출장 : 사전 품의된 &apos;출장품의서&apos; 문서번호 기재</li>
                  <li>교육 : 사전 품의된 &apos;교육품의서&apos;가 있다면 품의 문서번호 기재, 품의가 없을 시 교육명 및 교육일시 기재</li>
                  <li>기타외부활동 : 구체적인 내용 및 일시 기재</li>
                  <li>휴가 : 본인의 출근시간 반영하여 휴가시간 기재
                    <Image
                      src="/worklog/icons/notice-panel-1.png"
                      alt="휴가시간 참고"
                      width={IMAGE_WIDTH}
                      height={IMAGE_HEIGHT}
                      priority
                    />
                  </li>
                  <li>하루 두 가지 이상의 사유가 있을 시, 업무 추가하여 기재</li>
                </ul>
              </div>

              <div className="bg-yellow-50 p-3 rounded-lg">
                <p className="text-yellow-800">
                  ※매월 해당 내역과 세콤 출근기록을 비교 후, 소명이 필요할 시 대상자에게 소명 요청드리겠습니다.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">2. 업무등록 마감일시</h3>
                <p>
                  해당 월의 업무 등록은 <span className="font-bold text-red-500">매 익월 10일 전까지 마감</span>부탁드립니다. (1월 업무등록 {'>'} 2월 10일까지 마감)
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
} 