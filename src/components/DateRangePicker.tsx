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
          className="w-full rounded-lg border-2 border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-black"
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
          className="w-full rounded-lg border-2 border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-black"
        />
      </div>
    </div>
  )
} 