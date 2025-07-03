'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { Plus, Edit3, Trash2, Search, Check, X, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ConfirmationModal } from '@/components/ui/confirmation-modal'
import { formatCurrency, formatDate } from '@/lib/utils'
import { TransactionForm } from './transaction-form'

interface Transaction {
  id: string
  date: string
  amount: number
  memo?: string
  payee?: string
  cleared: string
  approved: boolean
  flagColor?: string
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

const clearingStatusLabels = {
  UNCLEARED: 'Uncleared',
  CLEARED: 'Cleared',
  RECONCILED: 'Reconciled',
}

const clearingStatusColors = {
  UNCLEARED: 'bg-yellow-100 text-yellow-800',
  CLEARED: 'bg-green-100 text-green-800',
  RECONCILED: 'bg-blue-100 text-blue-800',
}

export function TransactionsMain() {
  const router = useRouter()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  
  // Confirmation modal state
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null)
  
  // Filters
  const [selectedAccount, setSelectedAccount] = useState<string>('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')

  // Handle authentication/user errors by redirecting to sign-in
  const handleAuthError = async (error: string) => {
    console.log('Authentication error detected:', error)
    await signOut({
      callbackUrl: '/auth/signin',
      redirect: true
    })
  }

  useEffect(() => {
    Promise.all([
      fetchTransactions(),
      fetchAccounts(),
      fetchCategories(),
    ])
  }, [])

  const fetchTransactions = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/transactions')
      if (response.ok) {
        const data = await response.json()
        setTransactions(data)
      } else {
        const errorData = await response.json()
        
        // Check if it's an authentication/user error
        if (response.status === 401 || 
            response.status === 404 ||
            errorData.error?.includes('not found in database') ||
            errorData.error?.includes('User not found') ||
            errorData.error?.includes('Unauthorized')) {
          await handleAuthError(errorData.error)
          return
        }
        
        console.error('Failed to fetch transactions:', errorData)
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAccounts = async () => {
    try {
      const response = await fetch('/api/accounts')
      if (response.ok) {
        const data = await response.json()
        setAccounts(data.filter((account: Account & { isClosed: boolean }) => !account.isClosed))
      } else {
        const errorData = await response.json()
        
        // Check if it's an authentication/user error
        if (response.status === 401 || 
            response.status === 404 ||
            errorData.error?.includes('not found in database') ||
            errorData.error?.includes('User not found') ||
            errorData.error?.includes('Unauthorized')) {
          await handleAuthError(errorData.error)
          return
        }
        
        console.error('Failed to fetch accounts:', errorData)
      }
    } catch (error) {
      console.error('Failed to fetch accounts:', error)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      if (response.ok) {
        const categoryGroups = await response.json()
        // Flatten category groups into individual categories
        const flatCategories = categoryGroups.flatMap((group: any) => 
          group.categories.map((category: any) => ({
            ...category,
            categoryGroup: {
              id: group.id,
              name: group.name
            }
          }))
        )

        setCategories(flatCategories)
      } else {
        const errorData = await response.json()
        
        // Check if it's an authentication/user error
        if (response.status === 401 || 
            response.status === 404 ||
            errorData.error?.includes('not found in database') ||
            errorData.error?.includes('User not found') ||
            errorData.error?.includes('Unauthorized')) {
          await handleAuthError(errorData.error)
          return
        }
        
        console.error('Failed to fetch categories:', errorData)
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }

  const handleAddTransaction = () => {
    setEditingTransaction(null)
    setShowForm(true)
  }

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction)
    setShowForm(true)
  }

  const handleDeleteTransaction = (transactionId: string) => {
    setTransactionToDelete(transactionId)
    setShowDeleteConfirmation(true)
  }

  const confirmDeleteTransaction = async () => {
    if (!transactionToDelete) return

    try {
      const response = await fetch(`/api/transactions/${transactionToDelete}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setTransactions(transactions.filter(t => t.id !== transactionToDelete))
      } else {
        alert('Failed to delete transaction. Please try again.')
      }
    } catch (error) {
      console.error('Failed to delete transaction:', error)
      alert('Failed to delete transaction. Please try again.')
    } finally {
      setTransactionToDelete(null)
      setShowDeleteConfirmation(false)
    }
  }

  const handleSaveTransaction = async (transactionData: any) => {
    try {
      if (editingTransaction) {
        // Update existing transaction
        const response = await fetch(`/api/transactions/${editingTransaction.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(transactionData),
        })

        if (response.ok) {
          const updatedTransaction = await response.json()
          setTransactions(transactions.map(t => 
            t.id === editingTransaction.id ? updatedTransaction : t
          ))
        } else {
          alert('Failed to update transaction. Please try again.')
          return
        }
      } else {
        // Create new transaction
        const response = await fetch('/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(transactionData),
        })

        if (response.ok) {
          const newTransaction = await response.json()
          setTransactions([newTransaction, ...transactions])
        } else {
          alert('Failed to create transaction. Please try again.')
          return
        }
      }
      setShowForm(false)
      setEditingTransaction(null)
    } catch (error) {
      console.error('Failed to save transaction:', error)
      alert('Failed to save transaction. Please try again.')
    }
  }

  // Filter transactions
  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = !searchTerm || 
      transaction.payee?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.memo?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesAccount = !selectedAccount || 
      transaction.fromAccount.id === selectedAccount ||
      transaction.toAccount?.id === selectedAccount
    
    const matchesCategory = !selectedCategory || 
      (selectedCategory === 'uncategorized' ? !transaction.category && !transaction.toAccount : transaction.category?.id === selectedCategory)

    return matchesSearch && matchesAccount && matchesCategory
  })

  if (loading) {
    return (
      <div className="flex-1 bg-white overflow-auto flex items-center justify-center">
        <div className="text-gray-500">Loading transactions...</div>
      </div>
    )
  }

  return (
    <div className="flex-1 bg-white overflow-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
            <p className="text-gray-600">Track your income and expenses</p>
          </div>
          <Button onClick={handleAddTransaction} className="flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>Add Transaction</span>
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center space-x-2">
            <Search className="w-4 h-4 text-gray-500" />
            <Input
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />
          </div>
          
          <select
            value={selectedAccount}
            onChange={(e) => setSelectedAccount(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Accounts</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            <option value="uncategorized">Uncategorized</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name} ({category.categoryGroup?.name || 'Uncategorized'})
              </option>
            ))}
          </select>

          {(searchTerm || selectedAccount || selectedCategory) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchTerm('')
                setSelectedAccount('')
                setSelectedCategory('')
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      {/* Transaction List */}
      <div className="divide-y divide-gray-200">
        {filteredTransactions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <div className="w-12 h-12 mx-auto mb-4 text-gray-300">
              <Search className="w-full h-full" />
            </div>
            <h3 className="text-lg font-medium mb-2">No transactions found</h3>
            <p className="text-sm">
              {transactions.length === 0 
                ? "Start by adding your first transaction!" 
                : "Try adjusting your search filters."
              }
            </p>
            {transactions.length === 0 && (
              <Button onClick={handleAddTransaction} className="mt-4">
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Transaction
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* Table Header */}
            <div className="bg-gray-50 px-6 py-3 grid grid-cols-7 gap-4 text-sm font-medium text-gray-700">
              <div>Date</div>
              <div>Payee</div>
              <div>Account</div>
              <div>Category</div>
              <div>Memo</div>
              <div className="text-right">Amount</div>
              <div className="text-center">Actions</div>
            </div>

            {/* Transaction Rows */}
            {filteredTransactions.map((transaction) => (
              <div 
                key={transaction.id}
                className="px-6 py-4 hover:bg-gray-50 grid grid-cols-7 gap-4 items-center group"
              >
                <div className="text-sm text-gray-900">
                  {formatDate(transaction.date)}
                </div>
                
                <div className="text-sm">
                  <div className="text-gray-900">{transaction.payee || 'No payee'}</div>
                  {transaction.flagColor && (
                    <div 
                      className="w-3 h-3 rounded-full mt-1" 
                      style={{ backgroundColor: transaction.flagColor }}
                    />
                  )}
                </div>
                
                <div className="text-sm text-gray-600">
                  {transaction.fromAccount.name}
                  {transaction.toAccount && (
                    <span className="text-blue-600"> → {transaction.toAccount.name}</span>
                  )}
                </div>
                
                <div className="text-sm text-gray-600">
                  {transaction.category ? (
                    <span>
                      <span className="text-gray-500">{transaction.category.categoryGroup?.name}: </span>
                      {transaction.category.name}
                    </span>
                  ) : transaction.toAccount ? (
                    <span className="text-blue-600">Transfer</span>
                  ) : (
                    <span className="text-gray-400 italic">Uncategorized</span>
                  )}
                </div>
                
                <div className="text-sm text-gray-600">
                  {transaction.memo || '—'}
                </div>
                
                <div className={`text-sm font-medium text-right ${
                  transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(transaction.amount)}
                </div>
                
                <div className="flex items-center justify-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEditTransaction(transaction)}
                  >
                    <Edit3 className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteTransaction(transaction.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Transaction Form Modal */}
      {showForm && (
        <TransactionForm
          transaction={editingTransaction}
          accounts={accounts}
          categories={categories}
          onSave={handleSaveTransaction}
          onCancel={() => {
            setShowForm(false)
            setEditingTransaction(null)
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirmation}
        onClose={() => {
          setShowDeleteConfirmation(false)
          setTransactionToDelete(null)
        }}
        onConfirm={confirmDeleteTransaction}
        title="Delete Transaction"
        message="Are you sure you want to delete this transaction? This action cannot be undone and will remove it from your records and budget."
        confirmText="Delete Transaction"
        cancelText="Keep Transaction"
        type="danger"
      />
    </div>
  )
} 