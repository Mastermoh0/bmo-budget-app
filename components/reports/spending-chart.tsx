'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import { formatCurrency } from '@/lib/utils'
import { useState } from 'react'

interface SpendingChartProps {
  data: Array<{
    id: string
    name: string
    actualSpending: number
    budgeted: number
    available: number
    budgetActivity: number
    variance: number
    budgetUtilization: number
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

const CustomTooltip = ({ active, payload, chartType }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    
    if (chartType === 'pie') {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <div className="font-medium text-gray-900">{data.name}</div>
          <div className="space-y-1 mt-2">
            <div className="flex justify-between space-x-4">
              <span className="text-blue-600">Budgeted:</span>
              <span className="font-semibold">{formatCurrency(data.budgeted)}</span>
            </div>
            <div className="flex justify-between space-x-4">
              <span className="text-gray-600">Actual:</span>
              <span className="font-semibold">{formatCurrency(data.actualSpending)}</span>
            </div>
            <div className="flex justify-between space-x-4">
              <span className={data.variance > 0 ? 'text-red-600' : 'text-green-600'}>Variance:</span>
              <span className={`font-semibold ${data.variance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {data.variance > 0 ? '+' : ''}{formatCurrency(data.variance)}
              </span>
            </div>
            <div className="text-sm text-gray-500">
              {data.transactionCount} transaction{data.transactionCount !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      )
    } else {
      // Bar chart tooltip
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <div className="font-medium text-gray-900">{data.name}</div>
          <div className="space-y-1 mt-2">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex justify-between space-x-4">
                <span style={{ color: entry.color }}>{entry.dataKey === 'budgeted' ? 'Budgeted:' : 'Actual:'}</span>
                <span className="font-semibold">{formatCurrency(entry.value)}</span>
              </div>
            ))}
            <div className="flex justify-between space-x-4 pt-1 border-t">
              <span className={data.variance > 0 ? 'text-red-600' : 'text-green-600'}>Variance:</span>
              <span className={`font-semibold ${data.variance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {data.variance > 0 ? '+' : ''}{formatCurrency(data.variance)}
              </span>
            </div>
          </div>
        </div>
      )
    }
  }
  return null
}

const CustomLegend = ({ payload, chartType }: any) => {
  if (!payload || payload.length === 0) return null
  
  if (chartType === 'pie') {
    return (
      <div className="mt-6 space-y-2 max-h-40 overflow-y-auto">
        {payload.map((entry: any, index: number) => (
          <div key={`legend-${index}`} className="flex items-center text-sm">
            <div 
              className="w-3 h-3 rounded-full mr-2 flex-shrink-0"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-gray-700 truncate flex-1">{entry.value}</span>
            <div className="ml-2 text-right">
              <div className="text-gray-900 font-medium">
                {formatCurrency(entry.payload.actualSpending)}
              </div>
              <div className="text-xs text-gray-500">
                of {formatCurrency(entry.payload.budgeted)} budgeted
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }
  
  return (
    <div className="flex justify-center space-x-6 mt-4">
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center space-x-2">
          <div 
            className="w-3 h-3 rounded"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-sm text-gray-700">{entry.value === 'budgeted' ? 'Budgeted' : 'Actual Spending'}</span>
        </div>
      ))}
    </div>
  )
}

export function SpendingChart({ data, viewMode }: SpendingChartProps) {
  const [chartType, setChartType] = useState<'pie' | 'bar'>('pie')

  if (!data || data.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="text-gray-400 mb-2">No budget data</div>
          <div className="text-sm text-gray-500">
            Set up your budget to see budget vs actual comparisons
          </div>
        </div>
      </div>
    )
  }

  // Filter data to show only items with spending or budget
  const filteredData = data.filter(item => item.actualSpending > 0 || item.budgeted > 0)
  
  // Take top 10 items for better visibility
  const chartData = filteredData.slice(0, 10).map((item, index) => ({
    ...item,
    color: COLORS[index % COLORS.length]
  }))

  return (
    <div className="space-y-4">
      {/* Chart Type Toggle */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700">
          Budget vs Actual Visualization
        </h3>
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setChartType('pie')}
            className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
              chartType === 'pie'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Pie Chart
          </button>
          <button
            onClick={() => setChartType('bar')}
            className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
              chartType === 'bar'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Bar Chart
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="h-96">
        {chartType === 'pie' ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <Pie
                data={chartData}
                cx="50%"
                cy="48%"
                innerRadius={45}
                outerRadius={90}
                paddingAngle={2}
                dataKey="actualSpending"
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
              <Tooltip content={<CustomTooltip chartType="pie" />} />
              <Legend content={<CustomLegend chartType="pie" />} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={80}
                fontSize={12}
                stroke="#666"
              />
              <YAxis 
                tickFormatter={(value) => `$${value}`}
                fontSize={12}
                stroke="#666"
              />
              <Tooltip content={<CustomTooltip chartType="bar" />} />
              <Legend content={<CustomLegend chartType="bar" />} />
              <Bar 
                dataKey="budgeted" 
                fill="#3B82F6" 
                name="Budgeted"
                radius={[2, 2, 0, 0]}
              />
              <Bar 
                dataKey="actualSpending" 
                fill="#10B981" 
                name="Actual Spending"
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Chart Summary */}
      <div className="text-xs text-gray-500 text-center">
        {chartType === 'pie' ? (
          <>Showing actual spending breakdown for {viewMode}</>
        ) : (
          <>Comparing budgeted vs actual amounts for top {chartData.length} {viewMode}</>
        )}
      </div>
    </div>
  )
} 