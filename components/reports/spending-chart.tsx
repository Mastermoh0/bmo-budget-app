'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { formatCurrency } from '@/lib/utils'

interface SpendingChartProps {
  data: Array<{
    id: string
    name: string
    amount: number
    transactionCount: number
  }>
  viewMode: 'categories' | 'groups'
}

// Color palette for chart segments
const COLORS = [
  '#3B82F6', // Blue
  '#EF4444', // Red
  '#10B981', // Green
  '#F59E0B', // Amber
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#6B7280', // Gray
  '#F97316', // Orange
  '#84CC16', // Lime
  '#06B6D4', // Cyan
  '#8B5A2B', // Brown
  '#DC2626', // Red-600
  '#059669', // Emerald-600
  '#7C3AED', // Violet-600
  '#DB2777', // Pink-600
]

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <div className="font-medium text-gray-900">{data.name}</div>
        <div className="text-blue-600 font-semibold">{formatCurrency(data.amount)}</div>
        <div className="text-sm text-gray-500">
          {data.transactionCount} transaction{data.transactionCount !== 1 ? 's' : ''}
        </div>
      </div>
    )
  }
  return null
}

const CustomLegend = ({ payload }: any) => {
  if (!payload || payload.length === 0) return null
  
  return (
    <div className="mt-6 space-y-2 max-h-40 overflow-y-auto">
      {payload.map((entry: any, index: number) => (
        <div key={`legend-${index}`} className="flex items-center text-sm">
          <div 
            className="w-3 h-3 rounded-full mr-2 flex-shrink-0"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-gray-700 truncate flex-1">{entry.value}</span>
          <span className="text-gray-900 font-medium ml-2">
            {formatCurrency(entry.payload.amount)}
          </span>
        </div>
      ))}
    </div>
  )
}

export function SpendingChart({ data, viewMode }: SpendingChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="text-gray-400 mb-2">No spending data</div>
          <div className="text-sm text-gray-500">
            Start adding transactions to see your spending breakdown
          </div>
        </div>
      </div>
    )
  }

  // Prepare data for the chart with colors
  const chartData = data.map((item, index) => ({
    ...item,
    color: COLORS[index % COLORS.length]
  }))

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={120}
            paddingAngle={2}
            dataKey="amount"
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.color}
                stroke="#fff"
                strokeWidth={2}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
} 