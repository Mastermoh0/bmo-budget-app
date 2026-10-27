import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number | string, currency = 'NGN'): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numAmount)
}

export function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(dateObj)
}

export function formatMonthYear(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
  }).format(dateObj)
}

export function getAmountColorClass(amount: number): string {
  if (amount > 0) return 'amount-positive'
  if (amount < 0) return 'amount-negative'
  return 'amount-zero'
}

export function getCurrentMonth(): Date {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), 1)
}

export function addMonths(date: Date, months: number): Date {
  const result = new Date(date)
  result.setMonth(result.getMonth() + months)
  return result
}

export function isSameMonth(date1: Date, date2: Date): boolean {
  return date1.getFullYear() === date2.getFullYear() && 
         date1.getMonth() === date2.getMonth()
} 