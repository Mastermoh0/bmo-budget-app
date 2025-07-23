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

const accountTypeGroups = {
  assets: [
    { value: 'CHECKING', label: 'Checking', icon: '🏦' },
    { value: 'SAVINGS', label: 'Savings', icon: '💰' },
    { value: 'CASH', label: 'Cash', icon: '💵' },
    { value: 'INVESTMENT', label: 'Investment', icon: '📈' },
    { value: 'OTHER_ASSET', label: 'Other Asset', icon: '🏠' },
  ],
  liabilities: [
    { value: 'CREDIT_CARD', label: 'Credit Card', icon: '💳' },
    { value: 'LINE_OF_CREDIT', label: 'Line of Credit', icon: '🏧' },
    { value: 'MORTGAGE', label: 'Mortgage', icon: '🏡' },
    { value: 'LOAN', label: 'Loan', icon: '🤝' },
    { value: 'OTHER_LIABILITY', label: 'Other Liability', icon: '📋' },
  ]
}

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
      <Card className="w-full max-w-lg bg-white rounded-lg shadow-xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
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

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="p-4 space-y-4 overflow-y-auto flex-1">
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Account Type *
            </label>
            
            {/* Assets */}
            <div className="mb-3">
              <h4 className="text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide">Assets</h4>
              <div className="grid grid-cols-2 gap-2">
                {accountTypeGroups.assets.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => handleInputChange('type', type.value)}
                    className={`p-2 text-xs rounded-md border transition-all text-left ${
                      formData.type === type.value
                        ? 'bg-blue-50 border-blue-300 text-blue-700'
                        : 'bg-white border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">{type.icon}</span>
                      <span className="font-medium">{type.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Liabilities */}
            <div>
              <h4 className="text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide">Liabilities</h4>
              <div className="grid grid-cols-2 gap-2">
                {accountTypeGroups.liabilities.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => handleInputChange('type', type.value)}
                    className={`p-2 text-xs rounded-md border transition-all text-left ${
                      formData.type === type.value
                        ? 'bg-red-50 border-red-300 text-red-700'
                        : 'bg-white border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">{type.icon}</span>
                      <span className="font-medium">{type.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            
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

          {/* Account Purpose & Status */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Account Settings
            </label>
            
            {/* Account Purpose */}
            <div>
              <h4 className="text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide">Purpose</h4>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleInputChange('isOnBudget', true)}
                  className={`p-2 text-xs rounded-md border transition-all ${
                    formData.isOnBudget
                      ? 'bg-blue-50 border-blue-300 text-blue-700'
                      : 'bg-white border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-1">
                    <span>💰</span>
                    <span className="font-medium">Budget</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Include in budget planning</p>
                </button>
                
                <button
                  type="button"
                  onClick={() => handleInputChange('isOnBudget', false)}
                  className={`p-2 text-xs rounded-md border transition-all ${
                    !formData.isOnBudget
                      ? 'bg-green-50 border-green-300 text-green-700'
                      : 'bg-white border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-1">
                    <span>📊</span>
                    <span className="font-medium">Tracking</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Net worth only</p>
                </button>
              </div>
            </div>
            
            {/* Account Status */}
            <div>
              <h4 className="text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide">Status</h4>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleInputChange('isClosed', false)}
                  className={`p-2 text-xs rounded-md border transition-all ${
                    !formData.isClosed
                      ? 'bg-green-50 border-green-300 text-green-700'
                      : 'bg-white border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-1">
                    <span>✅</span>
                    <span className="font-medium">Active</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Currently in use</p>
                </button>
                
                <button
                  type="button"
                  onClick={() => handleInputChange('isClosed', true)}
                  className={`p-2 text-xs rounded-md border transition-all ${
                    formData.isClosed
                      ? 'bg-gray-50 border-gray-300 text-gray-700'
                      : 'bg-white border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-1">
                    <span>🔒</span>
                    <span className="font-medium">Closed</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Archived account</p>
                </button>
              </div>
            </div>
            
            <div className="bg-gray-50 border border-gray-200 rounded-md p-2 text-center">
              <p className="text-xs text-gray-600">
                <strong>Current:</strong> {formData.isClosed ? 'Closed' : 'Active'} {formData.isOnBudget ? 'Budget' : 'Tracking'} Account
              </p>
            </div>
          </div>

          </div>

          {/* Submit Buttons - Fixed Footer */}
          <div className="flex space-x-3 p-4 border-t border-gray-200 flex-shrink-0">
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