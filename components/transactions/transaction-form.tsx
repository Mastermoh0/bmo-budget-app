'use client'

import { useState, useEffect } from 'react'
import { X, ArrowRightLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { CategorySearchInput } from './category-search-input'

interface Transaction {
  id: string
  date: string
  amount: number
  memo?: string
  payee?: string
  approved: boolean
  fromAccount: {
    id: string
    name: string
    type: string
  }
  toAccount?: {
    id: string
    name: string
    type: string
  }
  category?: {
    id: string
    name: string
    categoryGroup: {
      name: string
    }
  }
}

interface Account {
  id: string
  name: string
  type: string
}

interface Category {
  id: string
  name: string
  categoryGroup: {
    id: string
    name: string
  }
}

interface TransactionFormProps {
  transaction: Transaction | null
  accounts: Account[]
  categories: Category[]
  onSave: (transaction: any) => void
  onCancel: () => void
}





export function TransactionForm({ transaction, accounts, categories, onSave, onCancel }: TransactionFormProps) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    payee: '',
    memo: '',
    amount: '',
    isIncome: false, // true for income, false for expense
    fromAccountId: '',
    toAccountId: '', // For transfers
    categoryId: '',
    isTransfer: false,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (transaction) {
      setFormData({
        date: transaction.date.split('T')[0],
        payee: transaction.payee || '',
        memo: transaction.memo || '',
        amount: Math.abs(transaction.amount).toString(),
        isIncome: transaction.amount > 0, // Positive amount = income
        fromAccountId: transaction.fromAccount.id,
        toAccountId: transaction.toAccount?.id || '',
        categoryId: transaction.category?.id || '',
        isTransfer: !!transaction.toAccount,
      })
    } else if (accounts.length > 0) {
      // Default to first account for new transactions
      setFormData(prev => ({ ...prev, fromAccountId: accounts[0].id }))
    }
  }, [transaction, accounts])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.date) {
      newErrors.date = 'Date is required'
    }

    if (!formData.amount || isNaN(parseFloat(formData.amount)) || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Please enter a valid amount greater than 0'
    }

    if (!formData.fromAccountId) {
      newErrors.fromAccountId = 'Please select an account'
    }

    if (formData.isTransfer) {
      if (!formData.toAccountId) {
        newErrors.toAccountId = 'Please select a destination account for transfer'
      } else if (formData.fromAccountId === formData.toAccountId) {
        newErrors.toAccountId = 'Cannot transfer to the same account'
      }
    }
    // Note: Category is now optional for regular transactions

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    const transactionData = {
      date: new Date(formData.date).toISOString(),
      payee: formData.payee.trim() || null,
      memo: formData.memo.trim() || null,
      amount: formData.isIncome ? parseFloat(formData.amount) : -parseFloat(formData.amount), // Income = positive, Expense = negative
      fromAccountId: formData.fromAccountId,
      toAccountId: formData.isTransfer ? formData.toAccountId : null,
      categoryId: formData.isTransfer ? null : (formData.categoryId || null),
    }

    onSave(transactionData)
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value })
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' })
    }
  }

  const toggleTransfer = () => {
    const isTransfer = !formData.isTransfer
    setFormData({
      ...formData,
      isTransfer,
      toAccountId: isTransfer ? '' : '',
      categoryId: isTransfer ? '' : formData.categoryId,
    })
    // Clear related errors
    if (isTransfer) {
      setErrors({ ...errors, categoryId: '' })
    } else {
      setErrors({ ...errors, toAccountId: '' })
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-25 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {transaction ? 'Edit Transaction' : 'Add New Transaction'}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onCancel}
            className="h-8 w-8"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Transfer Toggle */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium text-gray-700">Transaction Type</span>
            <Button
              type="button"
              variant={formData.isTransfer ? "default" : "ghost"}
              size="sm"
              onClick={toggleTransfer}
              className="flex items-center space-x-2"
            >
              <ArrowRightLeft className="w-4 h-4" />
              <span>{formData.isTransfer ? 'Transfer' : 'Regular Transaction'}</span>
            </Button>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date *
            </label>
            <Input
              type="date"
              value={formData.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
              className={errors.date ? 'border-red-500' : ''}
            />
            {errors.date && (
              <p className="text-sm text-red-600 mt-1">{errors.date}</p>
            )}
          </div>

          {/* Payee */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {formData.isTransfer ? 'Transfer Description' : 'Payee'}
            </label>
            <Input
              type="text"
              value={formData.payee}
              onChange={(e) => handleInputChange('payee', e.target.value)}
              placeholder={formData.isTransfer ? 'e.g., Emergency Fund Transfer' : 'e.g., Starbucks'}
            />
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount *
            </label>
            <div className="flex space-x-2">
              <select
                value={formData.isIncome ? 'income' : 'expense'}
                onChange={(e) => {
                  handleInputChange('isIncome', e.target.value === 'income')
                }}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-32"
              >
                <option value="expense">💸 Expense</option>
                <option value="income">💰 Income</option>
              </select>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => handleInputChange('amount', e.target.value)}
                placeholder="0.00"
                className={`flex-1 ${errors.amount ? 'border-red-500' : ''}`}
              />
            </div>
            <div className="text-xs text-gray-500 mt-1">
              💸 Expense = Money spent (shows as negative) | 💰 Income = Money received (shows as positive)
            </div>
            {errors.amount && (
              <p className="text-sm text-red-600 mt-1">{errors.amount}</p>
            )}
          </div>

          {/* From Account */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {formData.isTransfer ? 'From Account *' : 'Account *'}
            </label>
            <select
              value={formData.fromAccountId}
              onChange={(e) => handleInputChange('fromAccountId', e.target.value)}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.fromAccountId ? 'border-red-500' : ''
              }`}
            >
              <option value="">Select account...</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} ({account.type})
                </option>
              ))}
            </select>
            {errors.fromAccountId && (
              <p className="text-sm text-red-600 mt-1">{errors.fromAccountId}</p>
            )}
          </div>

          {/* To Account (for transfers) */}
          {formData.isTransfer && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                To Account *
              </label>
              <select
                value={formData.toAccountId}
                onChange={(e) => handleInputChange('toAccountId', e.target.value)}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.toAccountId ? 'border-red-500' : ''
                }`}
              >
                <option value="">Select destination account...</option>
                {accounts
                  .filter(account => account.id !== formData.fromAccountId)
                  .map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name} ({account.type})
                    </option>
                  ))}
              </select>
              {errors.toAccountId && (
                <p className="text-sm text-red-600 mt-1">{errors.toAccountId}</p>
              )}
            </div>
          )}

          {/* Category - Smart Search */}
          {!formData.isTransfer && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <CategorySearchInput
                categories={categories}
                value={formData.categoryId}
                onChange={(categoryId) => handleInputChange('categoryId', categoryId)}
                placeholder="Search categories or select one..."
                error={errors.categoryId}
              />
            </div>
          )}

          {/* Memo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Memo
            </label>
            <Input
              type="text"
              value={formData.memo}
              onChange={(e) => handleInputChange('memo', e.target.value)}
              placeholder="Additional notes..."
            />
          </div>



          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="ghost"
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button type="submit">
              {transaction ? 'Update Transaction' : 'Add Transaction'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
} 