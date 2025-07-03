'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { 
  Home, 
  CreditCard, 
  TrendingUp, 
  Settings, 
  PlusCircle,
  ChevronDown,
  ChevronRight,
  Receipt,
  User,
  LogOut
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface Account {
  id: string
  name: string
  balance: number
  type: string
}

export function BudgetSidebar() {
  const pathname = usePathname()
  const [showAccounts, setShowAccounts] = useState(true)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch accounts from API
  useEffect(() => {
    async function fetchAccounts() {
      try {
        const response = await fetch('/api/accounts')
        if (response.ok) {
          const data = await response.json()
          setAccounts(data)
        }
      } catch (error) {
        console.error('Failed to fetch accounts:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAccounts()
  }, [])

  const navigation = [
    { id: 'budget', name: 'Plan', icon: Home, href: '/' },
    { id: 'accounts', name: 'Accounts', icon: CreditCard, href: '/accounts' },
    { id: 'transactions', name: 'Transactions', icon: Receipt, href: '/transactions' },
    { id: 'reports', name: 'Reports', icon: TrendingUp, href: '/reports' },
    { id: 'profile', name: 'Profile', icon: User, href: '/profile' },
    { id: 'settings', name: 'Settings', icon: Settings, href: '/settings' },
  ]

  const handleLogout = async () => {
    await signOut({
      callbackUrl: '/auth/signin',
      redirect: true
    })
  }

  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0)

  return (
    <div className="w-64 bg-white border-r border-ynab-gray-200 flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b border-ynab-gray-200">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-ynab-blue rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">B</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-ynab-blue">BMO</h2>
            <p className="text-xs text-ynab-gray-500">Budget Money Online</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                isActive
                  ? 'bg-ynab-blue text-white'
                  : 'text-ynab-gray-700 hover:bg-ynab-gray-100'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.name}</span>
            </Link>
          )
        })}
        
        {/* Logout Button */}
        <div className="pt-2 mt-2 border-t border-ynab-gray-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors text-red-600 hover:bg-red-50"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </nav>

      {/* Accounts Section */}
      <div className="border-t border-ynab-gray-200 p-4">
        <button
          onClick={() => setShowAccounts(!showAccounts)}
          className="w-full flex items-center justify-between text-left text-sm font-medium text-ynab-gray-700 mb-3"
        >
          <span>Accounts</span>
          {showAccounts ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>

        {showAccounts && (
          <div className="space-y-2">
            {loading ? (
              <div className="text-sm text-ynab-gray-500 p-2">Loading accounts...</div>
            ) : (
              <>
                {accounts.map((account) => (
                  <div
                    key={account.id}
                    className="flex items-center justify-between p-2 hover:bg-ynab-gray-50 rounded-lg cursor-pointer transition-colors"
                  >
                    <span className="text-sm text-ynab-gray-700">{account.name}</span>
                    <span className={`text-sm font-medium ${
                      account.balance >= 0 ? 'text-ynab-green' : 'text-ynab-red'
                    }`}>
                      {formatCurrency(account.balance)}
                    </span>
                  </div>
                ))}
                
                <div className="border-t border-ynab-gray-200 pt-2 mt-2">
                  <div className="flex items-center justify-between p-2">
                    <span className="text-sm font-medium text-ynab-gray-800">Total</span>
                    <span className={`text-sm font-bold ${
                      totalBalance >= 0 ? 'text-ynab-green' : 'text-ynab-red'
                    }`}>
                      {formatCurrency(totalBalance)}
                    </span>
                  </div>
                </div>

                <Link href="/accounts" className="w-full flex items-center space-x-2 p-2 text-ynab-blue hover:bg-ynab-gray-50 rounded-lg transition-colors">
                  <PlusCircle className="w-4 h-4" />
                  <span className="text-sm">Add Account</span>
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
} 