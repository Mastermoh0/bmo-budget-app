import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Create demo group
  const demoGroup = await prisma.group.upsert({
    where: { id: 'demo-group' },
    update: {},
    create: {
      id: 'demo-group',
      name: 'Demo Budget',
      description: 'Demo budget for testing',
      currency: 'USD',
    },
  })

  console.log('Created demo group:', demoGroup.name)

  // Create demo accounts
  const accounts = await Promise.all([
    prisma.account.upsert({
      where: { id: 'demo-checking' },
      update: {},
      create: {
        id: 'demo-checking',
        name: 'Chase Checking',
        type: 'CHECKING',
        balance: 2500.00,
        isOnBudget: true,
        institution: 'Chase Bank',
        accountNumber: '****1234',
        groupId: demoGroup.id,
      },
    }),
    prisma.account.upsert({
      where: { id: 'demo-savings' },
      update: {},
      create: {
        id: 'demo-savings',
        name: 'Emergency Fund',
        type: 'SAVINGS',
        balance: 10000.00,
        isOnBudget: true,
        institution: 'Chase Bank',
        accountNumber: '****5678',
        groupId: demoGroup.id,
      },
    }),
    prisma.account.upsert({
      where: { id: 'demo-credit' },
      update: {},
      create: {
        id: 'demo-credit',
        name: 'Chase Freedom',
        type: 'CREDIT_CARD',
        balance: -850.00,
        isOnBudget: true,
        institution: 'Chase Bank',
        accountNumber: '****9876',
        groupId: demoGroup.id,
      },
    }),
    prisma.account.upsert({
      where: { id: 'demo-investment' },
      update: {},
      create: {
        id: 'demo-investment',
        name: '401k Investment',
        type: 'INVESTMENT',
        balance: 25000.00,
        isOnBudget: false,
        institution: 'Fidelity',
        groupId: demoGroup.id,
      },
    }),
  ])

  console.log('Created demo accounts:', accounts.map(a => a.name).join(', '))

  // Create demo category groups and categories
  const categoryGroups = await Promise.all([
    prisma.categoryGroup.upsert({
      where: { id: 'demo-bills' },
      update: {},
      create: {
        id: 'demo-bills',
        name: 'Bills',
        sortOrder: 1,
        groupId: demoGroup.id,
      },
    }),
    prisma.categoryGroup.upsert({
      where: { id: 'demo-everyday' },
      update: {},
      create: {
        id: 'demo-everyday',
        name: 'Everyday Expenses',
        sortOrder: 2,
        groupId: demoGroup.id,
      },
    }),
    prisma.categoryGroup.upsert({
      where: { id: 'demo-savings-goals' },
      update: {},
      create: {
        id: 'demo-savings-goals',
        name: 'Savings Goals',
        sortOrder: 3,
        groupId: demoGroup.id,
      },
    }),
  ])

  const categories = await Promise.all([
    // Bills
    prisma.category.upsert({
      where: { id: 'demo-rent' },
      update: {},
      create: {
        id: 'demo-rent',
        name: 'Rent',
        sortOrder: 1,
        categoryGroupId: 'demo-bills',
      },
    }),
    prisma.category.upsert({
      where: { id: 'demo-utilities' },
      update: {},
      create: {
        id: 'demo-utilities',
        name: 'Utilities',
        sortOrder: 2,
        categoryGroupId: 'demo-bills',
      },
    }),
    prisma.category.upsert({
      where: { id: 'demo-internet' },
      update: {},
      create: {
        id: 'demo-internet',
        name: 'Internet',
        sortOrder: 3,
        categoryGroupId: 'demo-bills',
      },
    }),
    // Everyday Expenses
    prisma.category.upsert({
      where: { id: 'demo-groceries' },
      update: {},
      create: {
        id: 'demo-groceries',
        name: 'Groceries',
        sortOrder: 1,
        categoryGroupId: 'demo-everyday',
      },
    }),
    prisma.category.upsert({
      where: { id: 'demo-gas' },
      update: {},
      create: {
        id: 'demo-gas',
        name: 'Gas & Fuel',
        sortOrder: 2,
        categoryGroupId: 'demo-everyday',
      },
    }),
    prisma.category.upsert({
      where: { id: 'demo-dining' },
      update: {},
      create: {
        id: 'demo-dining',
        name: 'Dining Out',
        sortOrder: 3,
        categoryGroupId: 'demo-everyday',
      },
    }),
    // Savings Goals
    prisma.category.upsert({
      where: { id: 'demo-vacation' },
      update: {},
      create: {
        id: 'demo-vacation',
        name: 'Vacation Fund',
        sortOrder: 1,
        categoryGroupId: 'demo-savings-goals',
      },
    }),
    prisma.category.upsert({
      where: { id: 'demo-car-repair' },
      update: {},
      create: {
        id: 'demo-car-repair',
        name: 'Car Repairs',
        sortOrder: 2,
        categoryGroupId: 'demo-savings-goals',
      },
    }),
  ])

  console.log('Created demo categories:', categories.map(c => c.name).join(', '))

  // Create demo budgets for current month
  const currentDate = new Date()
  const currentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)

  const budgets = await Promise.all([
    prisma.budget.upsert({
      where: { 
        categoryId_month_groupId: { 
          categoryId: 'demo-rent', 
          month: currentMonth,
          groupId: demoGroup.id 
        } 
      },
      update: {},
      create: {
        categoryId: 'demo-rent',
        month: currentMonth,
        budgeted: 1200.00,
        groupId: demoGroup.id,
      },
    }),
    prisma.budget.upsert({
      where: { 
        categoryId_month_groupId: { 
          categoryId: 'demo-utilities', 
          month: currentMonth,
          groupId: demoGroup.id 
        } 
      },
      update: {},
      create: {
        categoryId: 'demo-utilities',
        month: currentMonth,
        budgeted: 150.00,
        groupId: demoGroup.id,
      },
    }),
    prisma.budget.upsert({
      where: { 
        categoryId_month_groupId: { 
          categoryId: 'demo-groceries', 
          month: currentMonth,
          groupId: demoGroup.id 
        } 
      },
      update: {},
      create: {
        categoryId: 'demo-groceries',
        month: currentMonth,
        budgeted: 400.00,
        groupId: demoGroup.id,
      },
    }),
    prisma.budget.upsert({
      where: { 
        categoryId_month_groupId: { 
          categoryId: 'demo-gas', 
          month: currentMonth,
          groupId: demoGroup.id 
        } 
      },
      update: {},
      create: {
        categoryId: 'demo-gas',
        month: currentMonth,
        budgeted: 200.00,
        groupId: demoGroup.id,
      },
    }),
  ])

  console.log('Created demo budgets for categories:', budgets.map(b => b.categoryId).join(', '))

  // Create some demo transactions
  const transactions = await Promise.all([
    prisma.transaction.create({
      data: {
        date: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1),
        amount: 1200.00,
        payee: 'Apartment Complex',
        memo: 'Monthly rent payment',
        fromAccountId: 'demo-checking',
        categoryId: 'demo-rent',
        cleared: 'CLEARED',
        groupId: demoGroup.id,
      },
    }),
    prisma.transaction.create({
      data: {
        date: new Date(currentDate.getFullYear(), currentDate.getMonth(), 5),
        amount: 85.50,
        payee: 'Electric Company',
        memo: 'Monthly electric bill',
        fromAccountId: 'demo-checking',
        categoryId: 'demo-utilities',
        cleared: 'CLEARED',
        groupId: demoGroup.id,
      },
    }),
    prisma.transaction.create({
      data: {
        date: new Date(currentDate.getFullYear(), currentDate.getMonth(), 8),
        amount: 127.45,
        payee: 'Whole Foods',
        memo: 'Weekly grocery shopping',
        fromAccountId: 'demo-credit',
        categoryId: 'demo-groceries',
        cleared: 'UNCLEARED',
        groupId: demoGroup.id,
      },
    }),
    prisma.transaction.create({
      data: {
        date: new Date(currentDate.getFullYear(), currentDate.getMonth(), 10),
        amount: 45.20,
        payee: 'Shell Gas Station',
        memo: 'Fill up tank',
        fromAccountId: 'demo-credit',
        categoryId: 'demo-gas',
        cleared: 'CLEARED',
        groupId: demoGroup.id,
      },
    }),
    // Transfer example
    prisma.transaction.create({
      data: {
        date: new Date(currentDate.getFullYear(), currentDate.getMonth(), 15),
        amount: 500.00,
        payee: 'Emergency Fund Transfer',
        memo: 'Monthly savings transfer',
        fromAccountId: 'demo-checking',
        toAccountId: 'demo-savings',
        cleared: 'CLEARED',
        groupId: demoGroup.id,
      },
    }),
  ])

  console.log('Created demo transactions:', transactions.length)

  console.log('Demo data seeded successfully!')
}

main()
  .catch((e) => {
    console.error('Error seeding data:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 