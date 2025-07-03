// Re-export Prisma types
export type {
  User,
  Group,
  GroupMember,
  Account,
  CategoryGroup,
  Category,
  Transaction,
  Budget,
  Goal,
  MoneyMove,
  AccountType,
  GroupRole,
  GoalType,
  TransactionStatus
} from '@prisma/client'

// Extended types for the frontend
export interface BudgetWithCategory extends Budget {
  category: Category & {
    categoryGroup: CategoryGroup
  }
}

export interface TransactionWithDetails extends Transaction {
  fromAccount: Account
  toAccount?: Account
  category?: Category
}

export interface CategoryWithBudget extends Category {
  budgets: Budget[]
  goals: Goal[]
  _count: {
    transactions: number
  }
}

export interface CategoryGroupWithCategories extends CategoryGroup {
  categories: CategoryWithBudget[]
}

export interface MonthlyBudgetData {
  month: Date
  toBeBudgeted: number
  totalBudgeted: number
  totalActivity: number
  totalAvailable: number
  categoryGroups: CategoryGroupWithCategories[]
}

export interface QuickBudgetRule {
  id: string
  name: string
  description: string
  type: 'percentage' | 'fixed' | 'priority'
  rules: {
    categoryId: string
    amount?: number
    percentage?: number
    priority?: number
  }[]
}

// Store types
export interface BudgetStore {
  currentMonth: Date
  toBeBudgeted: number
  selectedCategoryId?: string
  
  // Actions
  setCurrentMonth: (month: Date) => void
  setToBeBudgeted: (amount: number) => void
  setSelectedCategory: (categoryId?: string) => void
}

export interface OfflineStore {
  isOnline: boolean
  pendingSync: SyncItem[]
  lastSyncAt?: Date
  
  // Actions
  setOnlineStatus: (isOnline: boolean) => void
  addPendingSync: (item: SyncItem) => void
  removePendingSync: (id: string) => void
  clearPendingSync: () => void
}

export interface SyncItem {
  id: string
  type: 'create' | 'update' | 'delete'
  entity: 'transaction' | 'budget' | 'category' | 'account'
  data: any
  timestamp: Date
} 