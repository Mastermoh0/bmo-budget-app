import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

interface OnboardingData {
  name: string
  budgetingExperience?: string
  primaryGoals?: string[]
  lifeStage?: string
  housingType?: string
  incomeFrequency?: string
  monthlyIncome?: string
  hasDebt?: string
  debtTypes?: string[]
  savingsGoals?: string[]
  expenseCategories?: string[]
  shoppingHabits?: string[]
  healthWellness?: string[]
  transportation?: string[]
  subscriptions?: string[]
  hobbiesInterests?: string[]
  familyPets?: string[]
  workEducation?: string[]
  irregularExpenses?: string[]
  budgetingChallenges?: string[]
  skipped?: boolean
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const answers: OnboardingData = await request.json()
    console.log('🎯 Onboarding answers received:', JSON.stringify(answers, null, 2))

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
        description: answers.skipped 
          ? 'Your custom budget - start fresh!'
          : 'Your personalized budget based on your lifestyle',
        members: {
          create: {
            userId: session.user.id,
            role: 'OWNER'
          }
        }
      }
    })

    // Only create categories if onboarding wasn't skipped
    if (answers.skipped) {
      console.log('⏭️ Onboarding was skipped - creating blank budget')
    } else {
      // Create personalized categories and groups based on comprehensive answers
      console.log('🏗️ Creating personalized categories for group:', budgetGroup.id)
      await createPersonalizedCategories(budgetGroup.id, answers)
      console.log('✅ Categories created successfully!')
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ Error completing onboarding:', error)
    console.error('Stack trace:', error.stack)
    return NextResponse.json(
      { error: 'Failed to complete onboarding', details: error.message },
      { status: 500 }
    )
  }
}

async function createPersonalizedCategories(groupId: string, answers: OnboardingData) {
  const categoryGroups: { name: string; categories: string[] }[] = []
  console.log('📝 Starting category creation with answers:', {
    housingType: answers.housingType,
    transportation: answers.transportation,
    expenseCategories: answers.expenseCategories,
    savingsGoals: answers.savingsGoals,
    hasDebt: answers.hasDebt,
    debtTypes: answers.debtTypes
  })

  // 1. HOUSING & UTILITIES (Always needed)
  const housingCategories = []
  if (answers.housingType === 'ownHome') {
    housingCategories.push('Mortgage Payment', 'Property Tax', 'Home Insurance', 'HOA Fees')
  } else if (answers.housingType === 'ownHomeFree') {
    housingCategories.push('Property Tax', 'Home Insurance', 'HOA Fees')
  } else if (answers.housingType.includes('rent')) {
    housingCategories.push('Rent', 'Renter\'s Insurance')
  } else if (answers.housingType === 'liveWithFamily') {
    housingCategories.push('Contribution to Household')
  } else if (answers.housingType === 'dormitory') {
    housingCategories.push('Dormitory Fees', 'Meal Plan')
  }

  // Add utilities based on housing type
  if (answers.expenseCategories.includes('utilities') || !answers.housingType.includes('dormitory')) {
    housingCategories.push('Electricity', 'Gas', 'Water/Sewer', 'Trash/Recycling')
  }
  if (answers.expenseCategories.includes('internet')) {
    housingCategories.push('Internet', 'Cable/TV')
  }

  categoryGroups.push({
    name: 'Housing & Utilities',
    categories: housingCategories
  })

  // 2. TRANSPORTATION
  if (answers.transportation.length > 0 && !answers.transportation.includes('walk')) {
    const transportCategories = []
    
    if (answers.transportation.includes('ownCar')) {
      transportCategories.push('Car Payment', 'Car Insurance', 'Gas & Fuel', 'Car Maintenance')
      if (answers.irregularExpenses.includes('carMaintenance')) {
        transportCategories.push('Car Repairs Fund')
      }
    } else if (answers.transportation.includes('ownCarPaidOff')) {
      transportCategories.push('Car Insurance', 'Gas & Fuel', 'Car Maintenance', 'Car Repairs Fund')
    }
    
    if (answers.transportation.includes('publicTransit')) {
      transportCategories.push('Public Transportation')
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
    if (answers.workEducation.includes('commuting')) {
      transportCategories.push('Commuting Costs')
    }

    if (transportCategories.length > 0) {
    categoryGroups.push({
      name: 'Transportation',
      categories: transportCategories
      })
    }
  }

  // 3. FOOD & GROCERIES
  const foodCategories = []
  if (answers.expenseCategories.includes('groceries')) {
    foodCategories.push('Groceries')
    if (answers.shoppingHabits.includes('groceryDelivery')) {
      foodCategories.push('Grocery Delivery')
    }
    if (answers.shoppingHabits.includes('bulkShopping')) {
      foodCategories.push('Bulk Shopping')
    }
  }
  if (answers.expenseCategories.includes('dining')) {
    foodCategories.push('Dining Out', 'Takeout/Delivery')
  }
  if (answers.hobbiesInterests.includes('cooking')) {
    foodCategories.push('Cooking Supplies', 'Special Ingredients')
  }

  if (foodCategories.length > 0) {
    categoryGroups.push({
      name: 'Food & Dining',
      categories: foodCategories
    })
  }

  // 4. HEALTH & WELLNESS
  if (answers.healthWellness.length > 0 && !answers.healthWellness.includes('none')) {
    const healthCategories = []
    
    if (answers.healthWellness.includes('healthInsurance')) {
      healthCategories.push('Health Insurance')
    }
    if (answers.healthWellness.includes('medications')) {
      healthCategories.push('Medications')
    }
    if (answers.healthWellness.includes('therapy')) {
      healthCategories.push('Therapy/Mental Health')
    }
    if (answers.healthWellness.includes('dental')) {
      healthCategories.push('Dental Care')
    }
    if (answers.healthWellness.includes('vision')) {
      healthCategories.push('Vision Care')
    }
    if (answers.healthWellness.includes('gymMembership')) {
      healthCategories.push('Gym Membership')
    }
    if (answers.healthWellness.includes('supplements')) {
      healthCategories.push('Vitamins/Supplements')
    }
    if (answers.irregularExpenses.includes('medical')) {
      healthCategories.push('Medical Emergency Fund')
    }

    categoryGroups.push({
      name: 'Health & Wellness',
      categories: healthCategories
    })
  }

  // 5. DEBT PAYMENTS
  if (answers.hasDebt === 'yes' && answers.debtTypes.length > 0) {
    const debtCategories = []
    
    if (answers.debtTypes.includes('creditCard')) {
      debtCategories.push('Credit Card Payments')
    }
    if (answers.debtTypes.includes('studentLoan')) {
      debtCategories.push('Student Loan Payments')
    }
    if (answers.debtTypes.includes('carLoan')) {
      debtCategories.push('Car Loan Payment')
    }
    if (answers.debtTypes.includes('personalLoan')) {
      debtCategories.push('Personal Loan Payment')
    }
    if (answers.debtTypes.includes('medicalDebt')) {
      debtCategories.push('Medical Debt Payment')
    }
    if (answers.debtTypes.includes('businessDebt')) {
      debtCategories.push('Business Debt Payment')
    }
    if (answers.debtTypes.includes('other')) {
      debtCategories.push('Other Debt Payment')
    }

    categoryGroups.push({
      name: 'Debt Payments',
      categories: debtCategories
    })
  }

  // 6. SAVINGS & INVESTMENTS
  if (answers.savingsGoals.length > 0) {
    const savingsCategories = []
    
    if (answers.savingsGoals.includes('emergencyFund')) {
      savingsCategories.push('Emergency Fund')
    }
    if (answers.savingsGoals.includes('houseDownPayment')) {
      savingsCategories.push('House Down Payment')
    }
    if (answers.savingsGoals.includes('carPurchase')) {
      savingsCategories.push('Car Purchase Fund')
    }
    if (answers.savingsGoals.includes('vacation')) {
      savingsCategories.push('Vacation Fund')
    }
    if (answers.savingsGoals.includes('wedding')) {
      savingsCategories.push('Wedding Fund')
    }
    if (answers.savingsGoals.includes('babyFund')) {
      savingsCategories.push('Baby Fund')
    }
    if (answers.savingsGoals.includes('education')) {
      savingsCategories.push('Education Fund')
    }
    if (answers.savingsGoals.includes('homeImprovement')) {
      savingsCategories.push('Home Improvement Fund')
    }
    if (answers.savingsGoals.includes('retirement')) {
      savingsCategories.push('Retirement Savings')
    }
    if (answers.savingsGoals.includes('investments')) {
      savingsCategories.push('Investment Account')
    }

    categoryGroups.push({
      name: 'Savings & Investments',
      categories: savingsCategories
    })
  }

  // 7. SUBSCRIPTIONS & DIGITAL SERVICES
  if (answers.subscriptions.length > 0 && !answers.subscriptions.includes('none')) {
    const subscriptionCategories = []
    
    if (answers.subscriptions.includes('streaming')) {
      subscriptionCategories.push('Streaming Services')
    }
    if (answers.subscriptions.includes('music')) {
      subscriptionCategories.push('Music Streaming')
    }
    if (answers.subscriptions.includes('gaming')) {
      subscriptionCategories.push('Gaming Subscriptions')
    }
    if (answers.subscriptions.includes('news')) {
      subscriptionCategories.push('News & Magazines')
    }
    if (answers.subscriptions.includes('software')) {
      subscriptionCategories.push('Software Subscriptions')
    }
    if (answers.subscriptions.includes('cloud')) {
      subscriptionCategories.push('Cloud Storage')
    }
    if (answers.subscriptions.includes('delivery')) {
      subscriptionCategories.push('Delivery Services')
    }
    if (answers.subscriptions.includes('fitness')) {
      subscriptionCategories.push('Fitness Apps')
    }

    categoryGroups.push({
      name: 'Subscriptions & Digital',
      categories: subscriptionCategories
    })
  }

  // 8. FAMILY & PETS
  if (answers.familyPets.length > 0 && !answers.familyPets.includes('none')) {
    const familyCategories = []
    
    if (answers.familyPets.includes('children')) {
      familyCategories.push('Childcare', 'School Expenses', 'Kids Activities', 'Kids Clothing')
    }
    if (answers.familyPets.includes('elderCare')) {
      familyCategories.push('Elder Care')
    }
    if (answers.familyPets.includes('dogs')) {
      familyCategories.push('Dog Food', 'Dog Vet Bills', 'Dog Supplies')
    }
    if (answers.familyPets.includes('cats')) {
      familyCategories.push('Cat Food', 'Cat Vet Bills', 'Cat Supplies')
    }
    if (answers.familyPets.includes('otherPets')) {
      familyCategories.push('Pet Food', 'Pet Vet Bills', 'Pet Supplies')
    }

    categoryGroups.push({
      name: 'Family & Pets',
      categories: familyCategories
    })
  }

  // 9. HOBBIES & INTERESTS
  if (answers.hobbiesInterests.length > 0) {
    const hobbyCategories = []
    
    if (answers.hobbiesInterests.includes('sports')) {
      hobbyCategories.push('Sports Equipment', 'Sports Memberships')
    }
    if (answers.hobbiesInterests.includes('arts')) {
      hobbyCategories.push('Art Supplies', 'Craft Materials')
    }
    if (answers.hobbiesInterests.includes('music')) {
      hobbyCategories.push('Music Equipment', 'Music Lessons')
    }
    if (answers.hobbiesInterests.includes('photography')) {
      hobbyCategories.push('Photography Equipment', 'Photography Software')
    }
    if (answers.hobbiesInterests.includes('gaming')) {
      hobbyCategories.push('Gaming Equipment', 'Video Games')
    }
    if (answers.hobbiesInterests.includes('reading')) {
      hobbyCategories.push('Books', 'E-books/Audiobooks')
    }
    if (answers.hobbiesInterests.includes('gardening')) {
      hobbyCategories.push('Gardening Supplies', 'Plants/Seeds')
    }
    if (answers.hobbiesInterests.includes('travel')) {
      hobbyCategories.push('Travel Fund', 'Travel Gear')
    }
    if (answers.hobbiesInterests.includes('technology')) {
      hobbyCategories.push('Tech Gadgets', 'Tech Accessories')
    }

    if (hobbyCategories.length > 0) {
      categoryGroups.push({
        name: 'Hobbies & Interests',
        categories: hobbyCategories
      })
    }
  }

  // 10. WORK & EDUCATION
  if (answers.workEducation.length > 0 && !answers.workEducation.includes('none')) {
    const workCategories = []
    
    if (answers.workEducation.includes('workClothing')) {
      workCategories.push('Work Clothing')
    }
    if (answers.workEducation.includes('professionalDev')) {
      workCategories.push('Professional Development')
    }
    if (answers.workEducation.includes('homeOffice')) {
      workCategories.push('Home Office Supplies')
    }
    if (answers.workEducation.includes('tuition')) {
      workCategories.push('Tuition & Fees')
    }
    if (answers.workEducation.includes('books')) {
      workCategories.push('Educational Materials')
    }
    if (answers.workEducation.includes('conferences')) {
      workCategories.push('Conferences & Networking')
    }

    categoryGroups.push({
      name: 'Work & Education',
      categories: workCategories
    })
  }

  // 11. PERSONAL CARE & SHOPPING
  const personalCategories = []
  if (answers.expenseCategories.includes('clothing')) {
    personalCategories.push('Clothing')
  }
  if (answers.expenseCategories.includes('personalCare')) {
    personalCategories.push('Personal Care', 'Beauty Products')
  }
  if (answers.shoppingHabits.includes('onlineShopping')) {
    personalCategories.push('Online Shopping')
  }
  if (answers.shoppingHabits.includes('luxuryItems')) {
    personalCategories.push('Luxury Items')
  }
  if (answers.shoppingHabits.includes('thriftShopping')) {
    personalCategories.push('Thrift/Second-hand')
  }

  if (personalCategories.length > 0) {
    categoryGroups.push({
      name: 'Personal Care & Shopping',
      categories: personalCategories
    })
  }

  // 12. IRREGULAR EXPENSES & FEES
  if (answers.irregularExpenses.length > 0) {
    const irregularCategories = []
    
    if (answers.irregularExpenses.includes('homeMaintenance')) {
      irregularCategories.push('Home Maintenance Fund')
    }
    if (answers.irregularExpenses.includes('annualFees')) {
      irregularCategories.push('Annual Fees')
    }
    if (answers.irregularExpenses.includes('taxes')) {
      irregularCategories.push('Tax Preparation', 'Tax Payments')
    }
    if (answers.irregularExpenses.includes('gifts')) {
      irregularCategories.push('Holiday Gifts', 'Birthday Gifts')
    }
    if (answers.irregularExpenses.includes('appliances')) {
      irregularCategories.push('Appliance Replacement Fund')
    }
    if (answers.irregularExpenses.includes('legalFees')) {
      irregularCategories.push('Legal Fees')
    }

    categoryGroups.push({
      name: 'Irregular Expenses',
      categories: irregularCategories
    })
  }

  // 13. GIFTS & GIVING
  if (answers.expenseCategories.includes('gifts') || answers.irregularExpenses.includes('gifts')) {
    categoryGroups.push({
      name: 'Gifts & Giving',
      categories: [
        'Holiday Gifts',
        'Birthday Gifts',
        'Charitable Donations',
        'Special Occasions'
      ]
    })
  }

  // 14. FUN & ENTERTAINMENT
  const funCategories = ['Entertainment', 'Fun Money']
  if (answers.lifeStage === 'student' || answers.lifeStage === 'youngProfessional') {
    funCategories.push('Going Out', 'Social Activities')
  }
  if (answers.primaryGoals.includes('controlSpending')) {
    funCategories.push('Impulse Purchase Buffer')
  }

  categoryGroups.push({
    name: 'Fun & Entertainment',
    categories: funCategories
  })

  // Fallback: If no categories were created, add basic ones
  if (categoryGroups.length === 1) { // Only Fun & Entertainment was added
    console.log('⚠️ Very few categories created, adding basic fallbacks...')
    categoryGroups.unshift({
      name: 'Essential Expenses',
      categories: ['Groceries', 'Gas', 'Utilities']
    })
  }

  // Create the category groups and categories in the database
  console.log(`🎯 Creating ${categoryGroups.length} category groups:`, categoryGroups.map(g => `${g.name} (${g.categories.length} categories)`))
  
  for (let i = 0; i < categoryGroups.length; i++) {
    const group = categoryGroups[i]
    console.log(`📁 Creating group: ${group.name}`)
    
    const categoryGroup = await prisma.categoryGroup.create({
      data: {
        name: group.name,
        sortOrder: i,
        groupId: groupId
      }
    })

    for (let j = 0; j < group.categories.length; j++) {
      console.log(`  💰 Creating category: ${group.categories[j]}`)
      await prisma.category.create({
        data: {
          name: group.categories[j],
          sortOrder: j,
          categoryGroupId: categoryGroup.id
        }
      })
    }
  }

  console.log(`✅ Successfully created ${categoryGroups.length} groups with ${categoryGroups.reduce((total, group) => total + group.categories.length, 0)} total categories`)


} 