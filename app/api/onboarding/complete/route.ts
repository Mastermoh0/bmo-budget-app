import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

interface OnboardingData {
  name: string
  hearAbout: string[]
  goals: string[]
  subscriptions: string[]
  expenses: string[]
  transportation: string[]
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const answers: OnboardingData = await request.json()

    // Update user with name and onboarding completion
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: answers.name,
        hasCompletedOnboarding: true,
        onboardingData: answers
      }
    })

    // Create a default budget group for the user
    const budgetGroup = await prisma.budgetGroup.create({
      data: {
        name: `${answers.name}'s Budget`,
        description: 'Your personal budget',
        members: {
          create: {
            userId: session.user.id,
            role: 'OWNER'
          }
        }
      }
    })

    // Create category groups and categories based on answers
    await createCategoriesFromAnswers(budgetGroup.id, answers)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error completing onboarding:', error)
    return NextResponse.json(
      { error: 'Failed to complete onboarding' },
      { status: 500 }
    )
  }
}

async function createCategoriesFromAnswers(groupId: string, answers: OnboardingData) {
  const categoryGroups = []

  // Always create basic groups
  categoryGroups.push({
    name: 'Fixed Expenses',
    categories: [
      'Rent/Mortgage',
      'Utilities',
      'Insurance',
      'Phone'
    ]
  })

  categoryGroups.push({
    name: 'Variable Expenses',
    categories: [
      'Groceries',
      'Dining Out',
      'Gas',
      'Clothing'
    ]
  })

  // Add subscriptions category group if they have subscriptions
  if (answers.subscriptions.length > 0 && !answers.subscriptions.includes('none')) {
    const subscriptionCategories = []
    
    if (answers.subscriptions.includes('music')) {
      subscriptionCategories.push('Music Streaming')
    }
    if (answers.subscriptions.includes('tvStreaming')) {
      subscriptionCategories.push('TV/Video Streaming')
    }
    if (answers.subscriptions.includes('fitness')) {
      subscriptionCategories.push('Fitness/Gym')
    }
    if (answers.subscriptions.includes('other')) {
      subscriptionCategories.push('Other Subscriptions')
    }

    categoryGroups.push({
      name: 'Subscriptions',
      categories: subscriptionCategories
    })
  }

  // Add transportation categories based on their choices
  if (answers.transportation.length > 0 && !answers.transportation.includes('none')) {
    const transportCategories = []
    
    if (answers.transportation.includes('car')) {
      transportCategories.push('Car Payment', 'Car Maintenance', 'Car Insurance')
    }
    if (answers.transportation.includes('rideshare')) {
      transportCategories.push('Rideshare/Taxi')
    }
    if (answers.transportation.includes('bike')) {
      transportCategories.push('Bike Maintenance')
    }
    if (answers.transportation.includes('motorcycle')) {
      transportCategories.push('Motorcycle Payment', 'Motorcycle Insurance')
    }
    if (answers.transportation.includes('transit')) {
      transportCategories.push('Public Transportation')
    }

    categoryGroups.push({
      name: 'Transportation',
      categories: transportCategories
    })
  }

  // Add expense preparation categories
  if (answers.expenses.length > 0 && !answers.expenses.includes('none')) {
    const expenseCategories = []
    
    if (answers.expenses.includes('creditCard')) {
      expenseCategories.push('Annual Fees')
    }
    if (answers.expenses.includes('medical')) {
      expenseCategories.push('Medical Expenses', 'Emergency Fund')
    }
    if (answers.expenses.includes('taxes')) {
      expenseCategories.push('Tax Preparation', 'Tax Payments')
    }
    if (answers.expenses.includes('vet')) {
      expenseCategories.push('Pet Care', 'Vet Bills')
    }

    categoryGroups.push({
      name: 'Irregular Expenses',
      categories: expenseCategories
    })
  }

  // Add goal-based categories
  if (answers.goals.includes('debt')) {
    categoryGroups.push({
      name: 'Debt Payments',
      categories: [
        'Credit Card Payments',
        'Student Loans',
        'Personal Loans'
      ]
    })
  }

  if (answers.goals.includes('breathing') || answers.goals.includes('control')) {
    categoryGroups.push({
      name: 'Financial Security',
      categories: [
        'Emergency Fund',
        'Rainy Day Fund'
      ]
    })
  }

  if (answers.goals.includes('maximize')) {
    categoryGroups.push({
      name: 'Investing & Saving',
      categories: [
        'Retirement Savings',
        'Investment Account',
        'Long-term Savings'
      ]
    })
  }

  // Always add fun categories
  categoryGroups.push({
    name: 'Fun & Recreation',
    categories: [
      'Entertainment',
      'Hobbies',
      'Vacation Fund',
      'Gifts'
    ]
  })

  // Create the category groups and categories in the database
  for (let i = 0; i < categoryGroups.length; i++) {
    const group = categoryGroups[i]
    
    const categoryGroup = await prisma.categoryGroup.create({
      data: {
        name: group.name,
        sortOrder: i,
        groupId: groupId
      }
    })

    for (let j = 0; j < group.categories.length; j++) {
      await prisma.category.create({
        data: {
          name: group.categories[j],
          sortOrder: j,
          categoryGroupId: categoryGroup.id
        }
      })
    }
  }

  // Create a default checking account
  await prisma.budgetAccount.create({
    data: {
      name: 'Checking Account',
      type: 'CHECKING',
      balance: 0,
      isOnBudget: true,
      groupId: groupId
    }
  })
} 