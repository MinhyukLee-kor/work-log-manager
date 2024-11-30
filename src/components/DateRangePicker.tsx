'use client'

interface DateRange {
  startDate: Date
  endDate: Date
}

interface Props {
  dateRange: DateRange
  onChange: (range: DateRange) => void
}

export default function DateRangePicker({ dateRange, onChange }: Props) {
  const formatDate = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const handleDateChange = (type: 'start' | 'end', value: string) => {
    const date = new Date(value)
    if (type === 'start') {
      date.setHours(0, 0, 0, 0)
    } else {
      date.setHours(23, 59, 59, 999)
    }
    
    onChange({
      ...dateRange,
      [type === 'start' ? 'startDate' : 'endDate']: date
    })
  }

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
      <div className="w-full sm:w-auto">
        <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
          시작일
        </label>
        <input
          type="date"
          id="startDate"
          value={formatDate(dateRange.startDate)}
          onChange={(e) => handleDateChange('start', e.target.value)}
          className="text-black mt-1 block w-full rounded-md border-gray-300 bg-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>
      <div className="w-full sm:w-auto">
        <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
          종료일
        </label>
        <input
          type="date"
          id="endDate"
          value={formatDate(dateRange.endDate)}
          onChange={(e) => handleDateChange('end', e.target.value)}
          className="text-black mt-1 block w-full rounded-md border-gray-300 bg-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>
    </div>
  )
} 