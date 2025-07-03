'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'

interface Account {
  id: string
  name: string
  type: string
  balance: number
  isOnBudget: boolean
  isClosed: boolean
  institution?: string
  accountNumber?: string
}

interface AccountFormProps {
  account: Account | null
  onSave: (account: Partial<Account>) => void
  onCancel: () => void
}

const accountTypes = [
  { value: 'CHECKING', label: 'Checking' },
  { value: 'SAVINGS', label: 'Savings' },
  { value: 'CASH', label: 'Cash' },
  { value: 'CREDIT_CARD', label: 'Credit Card' },
  { value: 'LINE_OF_CREDIT', label: 'Line of Credit' },
  { value: 'INVESTMENT', label: 'Investment' },
  { value: 'MORTGAGE', label: 'Mortgage' },
  { value: 'LOAN', label: 'Loan' },
  { value: 'OTHER_ASSET', label: 'Other Asset' },
  { value: 'OTHER_LIABILITY', label: 'Other Liability' },
]

export function AccountForm({ account, onSave, onCancel }: AccountFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'CHECKING',
    balance: '0.00',
    isOnBudget: true,
    isClosed: false,
    institution: '',
    accountNumber: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (account) {
      setFormData({
        name: account.name,
        type: account.type,
        balance: account.balance.toString(),
        isOnBudget: account.isOnBudget,
        isClosed: account.isClosed,
        institution: account.institution || '',
        accountNumber: account.accountNumber || '',
      })
    }
  }, [account])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Account name is required'
    }

    if (!formData.type) {
      newErrors.type = 'Account type is required'
    }

    if (isNaN(parseFloat(formData.balance))) {
      newErrors.balance = 'Please enter a valid balance'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    const accountData = {
      name: formData.name.trim(),
      type: formData.type,
      balance: parseFloat(formData.balance),
      isOnBudget: formData.isOnBudget,
      isClosed: formData.isClosed,
      institution: formData.institution.trim() || undefined,
      accountNumber: formData.accountNumber.trim() || undefined,
    }

    onSave(accountData)
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value })
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' })
    }
  }

  const isLiability = ['CREDIT_CARD', 'LINE_OF_CREDIT', 'MORTGAGE', 'LOAN', 'OTHER_LIABILITY'].includes(formData.type)

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-25 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white rounded-lg shadow-xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {account ? 'Edit Account' : 'Add New Account'}
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
          {/* Account Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account Name *
            </label>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="e.g., Chase Checking"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-sm text-red-600 mt-1">{errors.name}</p>
            )}
          </div>

          {/* Account Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account Type *
            </label>
            <select
              value={formData.type}
              onChange={(e) => handleInputChange('type', e.target.value)}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.type ? 'border-red-500' : ''
              }`}
            >
              {accountTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            {errors.type && (
              <p className="text-sm text-red-600 mt-1">{errors.type}</p>
            )}
          </div>

          {/* Balance */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {isLiability ? 'Current Balance (Debt)' : 'Current Balance'}
            </label>
            <Input
              type="number"
              step="0.01"
              value={formData.balance}
              onChange={(e) => handleInputChange('balance', e.target.value)}
              placeholder="0.00"
              className={errors.balance ? 'border-red-500' : ''}
            />
            {isLiability && (
              <p className="text-xs text-gray-500 mt-1">
                Enter positive amount for debt (e.g., 1500.00 for $1,500 owed)
              </p>
            )}
            {errors.balance && (
              <p className="text-sm text-red-600 mt-1">{errors.balance}</p>
            )}
          </div>

          {/* Institution */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Institution (Optional)
            </label>
            <Input
              type="text"
              value={formData.institution}
              onChange={(e) => handleInputChange('institution', e.target.value)}
              placeholder="e.g., Chase Bank"
            />
          </div>

          {/* Account Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account Number (Optional)
            </label>
            <Input
              type="text"
              value={formData.accountNumber}
              onChange={(e) => handleInputChange('accountNumber', e.target.value)}
              placeholder="Last 4 digits or full number"
            />
          </div>

          {/* Account Options */}
          <div className="space-y-3">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isOnBudget"
                checked={formData.isOnBudget}
                onChange={(e) => handleInputChange('isOnBudget', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isOnBudget" className="ml-2 block text-sm text-gray-700">
                Budget Account
              </label>
            </div>
            <p className="text-xs text-gray-500 ml-6">
              Budget accounts are included in your budget planning. Tracking accounts are for net worth only.
            </p>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isClosed"
                checked={formData.isClosed}
                onChange={(e) => handleInputChange('isClosed', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isClosed" className="ml-2 block text-sm text-gray-700">
                Closed Account
              </label>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={onCancel}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
            >
              {account ? 'Update Account' : 'Add Account'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
} 