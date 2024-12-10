'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronUpDownIcon } from '@heroicons/react/24/outline'

interface Option {
  value: string
  label: string
  type: string
}

interface SearchableSelectProps {
  options: Option[]
  value: string
  onChange: (value: string, type: string) => void
  placeholder?: string
  className?: string
}

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = '선택하세요',
  className = ''
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const selectedOption = options.find(option => option.value === value)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={wrapperRef} className="relative">
      <div
        onClick={() => {
          setIsOpen(!isOpen)
          if (!isOpen) {
            setSearchTerm('')
            setTimeout(() => inputRef.current?.focus(), 100)
          }
        }}
        className={`flex items-center justify-between w-full rounded-lg border-2 border-gray-200 bg-white cursor-pointer h-[42px] px-3 ${className}`}
      >
        <span className="text-gray-900 truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronUpDownIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 w-full mt-1 bg-white border-2 border-gray-200 rounded-lg shadow-lg"
          >
            <div className="p-2">
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 text-sm"
                placeholder="검색..."
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <div className="max-h-60 overflow-auto">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => (
                  <div
                    key={option.value}
                    onClick={() => {
                      onChange(option.value, option.type)
                      setIsOpen(false)
                    }}
                    className={`px-3 py-2 cursor-pointer hover:bg-blue-50 text-gray-900 ${
                      option.value === value ? 'bg-blue-50' : ''
                    }`}
                  >
                    {option.label}
                  </div>
                ))
              ) : (
                <div className="px-3 py-2 text-gray-500 text-center">
                  검색 결과가 없습니다
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
} 