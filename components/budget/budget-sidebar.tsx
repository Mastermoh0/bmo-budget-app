'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { 
  Home, 
  CreditCard, 
  TrendingUp, 
  Users, 
  PlusCircle,
  ChevronDown,
  ChevronRight,
  Receipt,
  User,
  LogOut
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { useUserRole } from '@/hooks/useUserRole'

interface Account {
  id: string
  name: string
  balance: number
  type: string
}

export function BudgetSidebar() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { canEdit } = useUserRole()
  const [showAccounts, setShowAccounts] = useState(true)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)

  // Get current plan ID from URL or localStorage
  const getCurrentPlanId = () => {
    const urlPlanId = searchParams.get('plan')
    if (urlPlanId) return urlPlanId
    
    // Fallback to localStorage
    return localStorage.getItem('lastSelectedPlan')
  }

  // Fetch accounts from API
  useEffect(() => {
    async function fetchAccounts() {
      try {
        const currentPlanId = getCurrentPlanId()
        const url = currentPlanId ? `/api/accounts?planId=${currentPlanId}` : '/api/accounts'
        
        console.log('🔍 BudgetSidebar: Fetching accounts for plan:', currentPlanId)
        
        const response = await fetch(url)
        if (response.ok) {
          const data = await response.json()
          setAccounts(data)
          console.log('✅ BudgetSidebar: Accounts loaded:', data.length, 'accounts')
        } else {
          console.error('❌ BudgetSidebar: Failed to fetch accounts:', response.status)
        }
      } catch (error) {
        console.error('Failed to fetch accounts:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAccounts()
  }, [searchParams]) // Re-fetch when URL parameters change

  const navigation = [
    { id: 'budget', name: 'Plan', icon: Home, href: '/' },
    { id: 'accounts', name: 'Accounts', icon: CreditCard, href: '/accounts' },
    { id: 'transactions', name: 'Transactions', icon: Receipt, href: '/transactions' },
    { id: 'reports', name: 'Reports', icon: TrendingUp, href: '/reports' },
    { id: 'profile', name: 'Profile', icon: User, href: '/profile' },
    { id: 'teams', name: 'Teams', icon: Users, href: '/teams' },
  ]

  const handleLogout = async () => {
    await signOut({
      callbackUrl: '/auth/signin',
      redirect: true
    })
  }

  // Define liability account types that should be subtracted from net worth
  const liabilityTypes = ['CREDIT_CARD', 'LINE_OF_CREDIT', 'MORTGAGE', 'LOAN', 'OTHER_LIABILITY']
  
  const totalBalance = accounts.reduce((sum, account) => {
    const balance = Number(account.balance) // Convert Prisma Decimal to JavaScript number
    if (liabilityTypes.includes(account.type)) {
      return sum - Math.abs(balance) // Subtract debt from net worth
    }
    return sum + balance
  }, 0)

  return (
    <div className="fixed left-0 top-0 w-64 h-screen bg-white border-r border-ynab-gray-200 flex flex-col z-20">
      {/* Logo */}
      <div className="p-4 border-b border-ynab-gray-200">
        <div className="flex items-center space-x-2">
          <img 
            src="/logo.png" 
            alt="BMO Logo" 
            className="w-8 h-8 rounded-lg"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling.style.display = 'flex';
            }}
          />
          <div className="w-8 h-8 bg-ynab-blue rounded-lg flex items-center justify-center" style={{ display: 'none' }}>
            <span className="text-white font-bold text-lg">😊</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-ynab-blue">BMO</h2>
            <p className="text-xs text-ynab-gray-500">Budget Money Online</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
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
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {loading ? (
              <div className="text-sm text-ynab-gray-500 p-2">Loading accounts...</div>
            ) : (
              <>
                {accounts.map((account) => {
                  const isLiability = liabilityTypes.includes(account.type)
                  const balance = Number(account.balance) // Convert Prisma Decimal to JavaScript number
                  const displayBalance = isLiability ? -Math.abs(balance) : balance
                  
                  return (
                    <div
                      key={account.id}
                      className="flex items-center justify-between p-2 hover:bg-ynab-gray-50 rounded-lg cursor-pointer transition-colors"
                    >
                      <span className="text-sm text-ynab-gray-700">{account.name}</span>
                      <span className={`text-sm font-medium ${
                        displayBalance >= 0 ? 'text-ynab-green' : 'text-ynab-red'
                      }`}>
                        {formatCurrency(displayBalance)}
                      </span>
                    </div>
                  )
                })}
                
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

                {canEdit && (
                  <Link href="/accounts" className="w-full flex items-center space-x-2 p-2 text-ynab-blue hover:bg-ynab-gray-50 rounded-lg transition-colors">
                    <PlusCircle className="w-4 h-4" />
                    <span className="text-sm">Add Account</span>
                  </Link>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
} 