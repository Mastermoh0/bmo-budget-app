'use client'

import { useState, useRef } from 'react'
import { formatCurrency, getCurrentMonth } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Calculator, Clock, Plus, Minus, X, Divide } from 'lucide-react'
import { evaluate } from 'mathjs'

export function BudgetAmountInput({ category, month, onUpdate, categoryId, initialAmount }) {
  // Handle both old and new interfaces
  const isOldInterface = categoryId !== undefined && initialAmount !== undefined
  const actualCategory = isOldInterface ? { id: categoryId, budgeted: initialAmount } : category
  const actualMonth = month || getCurrentMonth().toISOString()
  const currentAmount = isOldInterface ? initialAmount : (category?.budgeted || 0)
  
  const [isEditing, setIsEditing] = useState(false)
  const [editAmount, setEditAmount] = useState(currentAmount.toString())
  const [showMathKeypad, setShowMathKeypad] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [calculationHistory, setCalculationHistory] = useState([])
  const inputRef = useRef(null)

  const evaluateExpression = (expression) => {
    try {
      // Clean the expression
      const cleanExpression = expression.trim()
      
      // If it's just a number, return it directly
      if (/^-?\d*\.?\d+$/.test(cleanExpression)) {
        return parseFloat(cleanExpression) || 0
      }
      
      // Replace display symbols with mathjs compatible ones
      const mathExpression = cleanExpression
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/\s+/g, '') // Remove extra spaces
      
      // Evaluate the expression
      const result = evaluate(mathExpression)
      
      // Ensure we return a valid number with 2 decimal places
      const numResult = parseFloat(result)
      return isNaN(numResult) ? 0 : parseFloat(numResult.toFixed(2))
    } catch (error) {
      console.warn('Math evaluation failed:', error)
      // Try to extract just the numbers if it's a simple case
      const numbers = expression.match(/-?\d*\.?\d+/g)
      if (numbers && numbers.length === 1) {
        return parseFloat(numbers[0]) || 0
      }
      return 0
    }
  }

  const handleSave = async () => {
    const expression = editAmount.trim()
    const amount = evaluateExpression(expression)
    
    // Add to history if it was a calculation
    if (expression.includes('+') || expression.includes('-') || expression.includes('×') || expression.includes('÷') || expression.includes('*') || expression.includes('/')) {
      const historyItem = {
        expression: expression,
        result: amount,
        date: new Date().toLocaleDateString()
      }
      setCalculationHistory(prev => [historyItem, ...prev.slice(0, 9)]) // Keep last 10
    }
    
    try {
      if (isOldInterface) {
        onUpdate(categoryId, amount)
        setIsEditing(false)
      } else {
        const response = await fetch(`/api/categories/${category.categoryGroupId}/categories/${category.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            budgeted: amount,
            month: actualMonth
          }),
        })
        
        if (response.ok) {
          const updatedCategory = await response.json()
          onUpdate(category.id, amount, updatedCategory)
          setIsEditing(false)
        }
      }
    } catch (error) {
      console.error('Failed to update budget:', error)
      setEditAmount(currentAmount.toString())
      setIsEditing(false)
    }
    
    setShowMathKeypad(false)
    setShowHistory(false)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditAmount(currentAmount.toString())
    setShowMathKeypad(false)
    setShowHistory(false)
  }

  const handleInputChange = (e) => {
    let value = e.target.value
    // Allow math symbols and numbers
    value = value.replace(/[^0-9.\-+×÷*/\s]/g, '')
    setEditAmount(value)
  }

  const addMathSymbol = (symbol) => {
    const cursorPos = inputRef.current?.selectionStart || editAmount.length
    const before = editAmount.substring(0, cursorPos)
    const after = editAmount.substring(cursorPos)
    setEditAmount(before + ' ' + symbol + ' ' + after)
    setShowMathKeypad(false)
    setTimeout(() => {
      inputRef.current?.focus()
      const newPos = cursorPos + symbol.length + 2
      inputRef.current?.setSelectionRange(newPos, newPos)
    }, 0)
  }

  const useHistoryItem = (item) => {
    setEditAmount(item.result.toString())
    setShowHistory(false)
    inputRef.current?.focus()
  }

  if (isEditing) {
    return (
      <div className="relative">
        {/* Input with math toggle */}
        <div className="flex items-center gap-2">
          {/* Calculator toggle - outside input on the left */}
          <button
            type="button"
            className="text-ynab-blue hover:bg-ynab-blue/20 rounded p-2 bg-white border border-ynab-blue/30"
            onClick={() => setShowMathKeypad(!showMathKeypad)}
            onMouseDown={(e) => e.preventDefault()}
            title="Calculator"
          >
            <Calculator size={16} />
          </button>
          
          <Input
            ref={inputRef}
            type="text"
            value={editAmount}
            onChange={handleInputChange}
            className="flex-1 text-right text-sm px-3 border-2 border-ynab-blue"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave()
              if (e.key === 'Escape') handleCancel()
            }}
            onBlur={(e) => {
              // Don't save if clicking on keypad or history
              if (!e.relatedTarget?.closest('.math-popup')) {
                handleSave()
              }
            }}
          />
          
          {/* History toggle - outside input on the right */}
          <button
            type="button"
            className="text-ynab-blue hover:bg-ynab-blue/20 rounded p-2 bg-white border border-ynab-blue/30"
            onClick={() => setShowHistory(!showHistory)}
            onMouseDown={(e) => e.preventDefault()}
            title="Calculation History"
          >
            <Clock size={16} />
          </button>
        </div>

        {/* Math Keypad Popup */}
        {showMathKeypad && (
          <div className="math-popup absolute z-50 left-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-3">
            <div className="grid grid-cols-2 gap-2 w-20">
              <button
                className="flex items-center justify-center w-8 h-8 bg-white border border-gray-200 rounded hover:bg-gray-50 text-green-600"
                onClick={() => addMathSymbol('+')}
                onMouseDown={(e) => e.preventDefault()}
              >
                <Plus size={16} />
              </button>
              <button
                className="flex items-center justify-center w-8 h-8 bg-white border border-gray-200 rounded hover:bg-gray-50 text-red-600"
                onClick={() => addMathSymbol('-')}
                onMouseDown={(e) => e.preventDefault()}
              >
                <Minus size={16} />
              </button>
              <button
                className="flex items-center justify-center w-8 h-8 bg-white border border-gray-200 rounded hover:bg-gray-50 text-blue-600"
                onClick={() => addMathSymbol('×')}
                onMouseDown={(e) => e.preventDefault()}
              >
                <X size={16} />
              </button>
              <button
                className="flex items-center justify-center w-8 h-8 bg-white border border-gray-200 rounded hover:bg-gray-50 text-purple-600"
                onClick={() => addMathSymbol('÷')}
                onMouseDown={(e) => e.preventDefault()}
              >
                <Divide size={16} />
              </button>
            </div>
          </div>
        )}

        {/* History Popup */}
        {showHistory && (
          <div className="math-popup absolute z-50 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 min-w-[280px]">
            <div className="text-sm font-semibold text-gray-900 mb-3">Calculation History</div>
            
            {calculationHistory.length === 0 ? (
              <div className="text-xs text-gray-500 text-center py-4">No calculation history</div>
            ) : (
              <div className="space-y-1">
                <div className="grid grid-cols-3 gap-2 text-xs font-medium text-gray-500 border-b pb-1">
                  <div>DATE</div>
                  <div>CALCULATION</div>
                  <div className="text-right">RESULT</div>
                </div>
                {calculationHistory.map((item, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-3 gap-2 text-xs py-1 hover:bg-gray-50 cursor-pointer rounded"
                    onClick={() => useHistoryItem(item)}
                  >
                    <div className="text-gray-600">{item.date}</div>
                    <div className="text-gray-900 truncate">{item.expression}</div>
                    <div className="text-right font-medium">
                      {formatCurrency(item.result)}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <button
              className="mt-3 px-3 py-1 bg-ynab-blue text-white text-xs rounded hover:bg-ynab-blue/90"
              onClick={() => setShowHistory(false)}
            >
              Close
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      className="w-full text-right cursor-pointer hover:bg-white hover:border hover:border-ynab-blue px-2 py-1 rounded transition-colors"
    >
      <span className="text-sm">
        {formatCurrency(currentAmount)}
      </span>
    </div>
  )
} 