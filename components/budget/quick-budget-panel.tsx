'use client'

import { useState, useEffect } from 'react'
import { Zap, Calculator, TrendingUp, X, Target, DollarSign, PieChart } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

// Category Classification Logic
const classifyCategory = (categoryName: string): 'needs' | 'wants' | 'debt' | 'savings' | 'investments' | 'income' => {
  const name = categoryName.toLowerCase()
  
  // Income categories
  if (name.includes('salary') || name.includes('income') || name.includes('paycheck') || 
      name.includes('wages') || name.includes('bonus') || name.includes('freelance') ||
      name.includes('side hustle') || name.includes('business income')) {
    return 'income'
  }
  
  // Debt categories
  if (name.includes('debt') || name.includes('loan') || name.includes('payment') ||
      name.includes('credit card') || name.includes('mortgage') || name.includes('student loan') ||
      name.includes('car payment') || name.includes('interest') || name.includes('minimum payment')) {
    return 'debt'
  }
  
  // Savings categories  
  if (name.includes('emergency') || name.includes('saving') || name.includes('fund') ||
      name.includes('rainy day') || name.includes('reserve') || name.includes('buffer')) {
    return 'savings'
  }
  
  // Investment categories
  if (name.includes('investment') || name.includes('retirement') || name.includes('401k') ||
      name.includes('ira') || name.includes('roth') || name.includes('stock') ||
      name.includes('portfolio') || name.includes('pension') || name.includes('long-term')) {
    return 'investments'
  }
  
  // Needs (essentials)
  if (name.includes('rent') || name.includes('mortgage') || name.includes('utilities') ||
      name.includes('groceries') || name.includes('food') || name.includes('gas') ||
      name.includes('insurance') || name.includes('medical') || name.includes('health') ||
      name.includes('transportation') || name.includes('phone') || name.includes('internet') ||
      name.includes('childcare') || name.includes('medication') || name.includes('housing') ||
      name.includes('electric') || name.includes('water') || name.includes('heating') ||
      name.includes('car maintenance') || name.includes('commute')) {
    return 'needs'
  }
  
  // Everything else is wants
  return 'wants'
}

// Budget Templates
const budgetTemplates = [
  {
    id: '50-30-20',
    name: '50/30/20 Rule',
    description: 'Most popular budgeting method',
    breakdown: {
      needs: 50,
      wants: 30,
      debt: 10,
      savings: 10,
      investments: 0,
      income: 0
    },
    details: [
      '50% - Essential needs (housing, food, utilities)',
      '30% - Wants & lifestyle (entertainment, dining)',
      '20% - Debt payment & savings combined'
    ]
  },
  {
    id: '60-20-20',
    name: '60/20/20 Rule',
    description: 'Conservative approach with higher needs allocation',
    breakdown: {
      needs: 60,
      wants: 20,
      debt: 10,
      savings: 10,
      investments: 0,
      income: 0
    },
    details: [
      '60% - Essential needs (housing, food, utilities)',
      '20% - Wants & lifestyle',
      '20% - Debt payment & savings combined'
    ]
  },
  {
    id: 'pay-yourself-first',
    name: 'Pay Yourself First',
    description: 'Prioritize savings and investments',
    breakdown: {
      needs: 50,
      wants: 25,
      debt: 10,
      savings: 10,
      investments: 15,
      income: 0
    },
    details: [
      '25% - Savings & investments (pay yourself first)',
      '50% - Essential needs',
      '25% - Wants & debt payments'
    ]
  },
  {
    id: 'dave-ramsey',
    name: "Dave Ramsey's Method",
    description: 'Focus on debt elimination',
    breakdown: {
      needs: 50,
      wants: 20,
      debt: 20,
      savings: 10,
      investments: 0,
      income: 0
    },
    details: [
      '50% - Essential needs',
      '20% - Aggressive debt payment',
      '20% - Wants & lifestyle',
      '10% - Emergency fund'
    ]
  },
  {
    id: 'balanced',
    name: 'Balanced Approach',
    description: 'Even distribution across all areas',
    breakdown: {
      needs: 45,
      wants: 25,
      debt: 15,
      savings: 10,
      investments: 15,
      income: 0
    },
    details: [
      '45% - Essential needs',
      '25% - Wants & lifestyle',
      '15% - Debt payments',
      '25% - Savings & investments combined'
    ]
  }
]

interface QuickBudgetPanelProps {
  isOpen?: boolean
  onToggle?: () => void
  budgetData?: any
  onApplyBudget?: (assignments: { categoryId: string, amount: number }[]) => void
  availableToAssign?: number
}

export function QuickBudgetPanel({ 
  isOpen = false, 
  onToggle, 
  budgetData, 
  onApplyBudget,
  availableToAssign = 0 
}: QuickBudgetPanelProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [customIncome, setCustomIncome] = useState<number>(availableToAssign)
  const [preview, setPreview] = useState<{ categoryId: string, categoryName: string, currentAmount: number, newAmount: number, type: string }[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    setCustomIncome(availableToAssign)
  }, [availableToAssign])

  // Calculate template preview
  const calculatePreview = (templateId: string, income: number) => {
    if (!budgetData || !budgetData.categoryGroups) return []
    
    const template = budgetTemplates.find(t => t.id === templateId)
    if (!template) return []
    
    // Categorize all categories
    const categorizedCategories: { [key: string]: { categoryId: string, categoryName: string, currentAmount: number }[] } = {
      needs: [],
      wants: [],
      debt: [],
      savings: [],
      investments: [],
      income: []
    }
    
    budgetData.categoryGroups.forEach((group: any) => {
      group.categories.forEach((category: any) => {
        const type = classifyCategory(category.name)
        categorizedCategories[type].push({
          categoryId: category.id,
          categoryName: category.name,
          currentAmount: category.budgeted || 0
        })
      })
    })
    
    // Calculate amounts for each category type
    const assignments: { categoryId: string, categoryName: string, currentAmount: number, newAmount: number, type: string }[] = []
    
    Object.entries(template.breakdown).forEach(([type, percentage]) => {
      if (percentage > 0 && categorizedCategories[type].length > 0) {
        const totalForType = (income * percentage) / 100
        const amountPerCategory = totalForType / categorizedCategories[type].length
        
        categorizedCategories[type].forEach(cat => {
          assignments.push({
            ...cat,
            newAmount: Math.round(amountPerCategory),
            type: type
          })
        })
      }
    })
    
    return assignments
  }

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId)
    const newPreview = calculatePreview(templateId, customIncome)
    setPreview(newPreview)
  }

  const handleIncomeChange = (value: string) => {
    const income = parseFloat(value) || 0
    setCustomIncome(income)
    if (selectedTemplate) {
      const newPreview = calculatePreview(selectedTemplate, income)
      setPreview(newPreview)
    }
  }

  const handleApplyTemplate = async () => {
    if (!selectedTemplate || !onApplyBudget) return
    
    setIsLoading(true)
    try {
      const assignments = preview.map(item => ({
        categoryId: item.categoryId,
        amount: item.newAmount
      }))
      
      await onApplyBudget(assignments)
      
      // Reset state
      setSelectedTemplate(null)
      setPreview([])
    } catch (error) {
      console.error('Failed to apply budget template:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getTotalAssigned = () => preview.reduce((sum, item) => sum + item.newAmount, 0)
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'needs': return 'text-red-600 bg-red-50'
      case 'wants': return 'text-purple-600 bg-purple-50'
      case 'debt': return 'text-orange-600 bg-orange-50'
      case 'savings': return 'text-blue-600 bg-blue-50'
      case 'investments': return 'text-green-600 bg-green-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="fixed right-4 top-1/2 transform -translate-y-1/2 bg-ynab-blue text-white p-3 rounded-l-lg shadow-lg hover:bg-ynab-blue/90 transition-colors z-10"
      >
        <Zap className="w-5 h-5" />
      </button>
    )
  }

  return (
    <div className="w-96 bg-white border-l border-ynab-gray-200 flex flex-col max-h-screen">
      {/* Header */}
      <div className="p-4 border-b border-ynab-gray-200 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Zap className="w-5 h-5 text-ynab-blue" />
          <h3 className="font-semibold text-ynab-gray-800">Quick Budget</h3>
        </div>
        <button
          onClick={onToggle}
          className="p-1 hover:bg-ynab-gray-100 rounded"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Income Input */}
        <div>
          <h4 className="font-medium text-ynab-gray-800 mb-2 flex items-center space-x-2">
            <DollarSign className="w-4 h-4" />
            <span>Monthly Income</span>
          </h4>
          <input
            type="number"
            value={customIncome}
            onChange={(e) => handleIncomeChange(e.target.value)}
            placeholder="Enter your monthly income"
            className="w-full px-3 py-2 border border-ynab-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ynab-blue"
          />
          <p className="text-xs text-ynab-gray-600 mt-1">
            Available to assign: {formatCurrency(availableToAssign)}
          </p>
        </div>

        {/* Budget Templates */}
        <div>
          <h4 className="font-medium text-ynab-gray-800 mb-3 flex items-center space-x-2">
            <PieChart className="w-4 h-4" />
            <span>Budget Templates</span>
          </h4>
          <div className="space-y-3">
            {budgetTemplates.map((template) => (
              <div
                key={template.id}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedTemplate === template.id
                    ? 'border-ynab-blue bg-ynab-blue/5 ring-1 ring-ynab-blue'
                    : 'border-ynab-gray-200 hover:border-ynab-gray-300 hover:bg-ynab-gray-50'
                }`}
                onClick={() => handleTemplateSelect(template.id)}
              >
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-medium text-ynab-gray-800">{template.name}</h5>
                </div>
                <p className="text-xs text-ynab-gray-600 mb-2">{template.description}</p>
                
                {selectedTemplate === template.id && (
                  <div className="space-y-1 text-xs">
                    {template.details.map((detail, index) => (
                      <div key={index} className="text-ynab-gray-600">
                        • {detail}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Preview */}
        {preview.length > 0 && (
          <div>
            <h4 className="font-medium text-ynab-gray-800 mb-3 flex items-center space-x-2">
              <Target className="w-4 h-4" />
              <span>Assignment Preview</span>
            </h4>
            <div className="bg-ynab-gray-50 rounded-lg p-3 space-y-2 max-h-64 overflow-y-auto">
              {preview.map((item, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    <span className={`text-xs px-2 py-1 rounded capitalize ${getTypeColor(item.type)}`}>
                      {item.type}
                    </span>
                    <span className="truncate text-ynab-gray-700">{item.categoryName}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs">
                    <span className="text-ynab-gray-500">{formatCurrency(item.currentAmount)}</span>
                    <span className="text-ynab-gray-400">→</span>
                    <span className="font-medium text-ynab-blue">{formatCurrency(item.newAmount)}</span>
                  </div>
                </div>
              ))}
              
              <div className="pt-2 border-t border-ynab-gray-200 flex justify-between text-sm font-medium">
                <span>Total Assigned:</span>
                <span className="text-ynab-blue">{formatCurrency(getTotalAssigned())}</span>
              </div>
              
              {getTotalAssigned() !== customIncome && (
                <div className="text-xs text-ynab-gray-600">
                  Difference: {formatCurrency(customIncome - getTotalAssigned())}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Apply Button */}
      {selectedTemplate && preview.length > 0 && (
        <div className="p-4 border-t border-ynab-gray-200">
          <button 
            onClick={handleApplyTemplate}
            disabled={isLoading}
            className="w-full bg-ynab-blue text-white py-3 px-4 rounded-lg hover:bg-ynab-blue/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {isLoading ? 'Applying...' : `Apply ${budgetTemplates.find(t => t.id === selectedTemplate)?.name}`}
          </button>
        </div>
      )}
    </div>
  )
} 