'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { ArrowLeft, ArrowRight, Coffee, LoaderIcon, DollarSign, Home, Users, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'

interface OnboardingAnswers {
  name: string
  budgetingExperience: string
  primaryGoals: string[]
  lifeStage: string
  housingType: string
  incomeFrequency: string
  monthlyIncome: string
  hasDebt: string
  debtTypes: string[]
  savingsGoals: string[]
  expenseCategories: string[]
  shoppingHabits: string[]
  healthWellness: string[]
  transportation: string[]
  subscriptions: string[]
  hobbiesInterests: string[]
  familyPets: string[]
  workEducation: string[]
  irregularExpenses: string[]
  budgetingChallenges: string[]
}

const slides = [
  {
    id: 'name',
    title: 'Welcome to BMO Budget!',
    subtitle: 'Let\'s start with your name so we can personalize your experience.',
    type: 'input',
    icon: '👋'
  },
  {
    id: 'budgetingExperience',
    title: 'What\'s your budgeting experience?',
    subtitle: 'This helps us tailor the setup process for you.',
    type: 'singleSelect',
    options: [
      { id: 'beginner', label: 'Complete beginner - never budgeted before', icon: '🌱' },
      { id: 'some', label: 'Some experience - tried budgeting apps or spreadsheets', icon: '🌿' },
      { id: 'experienced', label: 'Experienced - have been budgeting for years', icon: '🌳' },
      { id: 'expert', label: 'Expert - I help others with budgeting', icon: '🏆' }
    ]
  },
  {
    id: 'primaryGoals',
    title: 'What are your main financial goals?',
    subtitle: 'Select all that apply - we\'ll create categories to help you achieve them.',
    type: 'multiSelect',
    options: [
      { id: 'payoffDebt', label: 'Pay off debt', icon: '💎' },
      { id: 'buildEmergencyFund', label: 'Build emergency fund', icon: '🛡️' },
      { id: 'saveForHouse', label: 'Save for a house', icon: '🏠' },
      { id: 'retirement', label: 'Plan for retirement', icon: '👴' },
      { id: 'vacation', label: 'Save for vacation', icon: '✈️' },
      { id: 'wedding', label: 'Plan for wedding', icon: '💍' },
      { id: 'education', label: 'Save for education', icon: '🎓' },
      { id: 'business', label: 'Start a business', icon: '🚀' },
      { id: 'controlSpending', label: 'Control spending', icon: '🎯' },
      { id: 'increaseIncome', label: 'Increase income', icon: '📈' }
    ]
  },
  {
    id: 'lifeStage',
    title: 'What stage of life are you in?',
    subtitle: 'This helps us understand your financial priorities.',
    type: 'singleSelect',
    options: [
      { id: 'student', label: 'Student', icon: '📚' },
      { id: 'youngProfessional', label: 'Young professional (20s-30s)', icon: '💼' },
      { id: 'establishedCareer', label: 'Established career (30s-40s)', icon: '🏢' },
      { id: 'familyFocused', label: 'Family focused (with kids)', icon: '👨‍👩‍👧‍👦' },
      { id: 'preRetirement', label: 'Pre-retirement (50s-60s)', icon: '⏰' },
      { id: 'retired', label: 'Retired', icon: '🌅' },
      { id: 'other', label: 'Other', icon: '🤔' }
    ]
  },
  {
    id: 'housingType',
    title: 'What\'s your housing situation?',
    subtitle: 'This affects your fixed expenses and savings potential.',
    type: 'singleSelect',
    options: [
      { id: 'ownHome', label: 'Own my home (with mortgage)', icon: '🏠' },
      { id: 'ownHomeFree', label: 'Own my home (no mortgage)', icon: '🏡' },
      { id: 'rentApartment', label: 'Rent an apartment', icon: '🏢' },
      { id: 'rentHouse', label: 'Rent a house', icon: '🏘️' },
      { id: 'liveWithFamily', label: 'Live with family/parents', icon: '👨‍👩‍👧‍👦' },
      { id: 'dormitory', label: 'Live in dormitory/student housing', icon: '🏫' },
      { id: 'other', label: 'Other arrangement', icon: '🤷' }
    ]
  },
  {
    id: 'incomeFrequency',
    title: 'How often do you get paid?',
    subtitle: 'This helps us set up your budget timing.',
    type: 'singleSelect',
    options: [
      { id: 'weekly', label: 'Weekly', icon: '📅' },
      { id: 'biweekly', label: 'Every two weeks', icon: '📆' },
      { id: 'monthly', label: 'Monthly', icon: '🗓️' },
      { id: 'irregular', label: 'Irregular (freelance/commission)', icon: '🔄' },
      { id: 'multiple', label: 'Multiple sources', icon: '💰' }
    ]
  },
  {
    id: 'monthlyIncome',
    title: 'What\'s your approximate monthly income?',
    subtitle: 'This helps us suggest realistic budget amounts (optional).',
    type: 'singleSelect',
    options: [
      { id: 'under2k', label: 'Under $2,000', icon: '💵' },
      { id: '2k-4k', label: '$2,000 - $4,000', icon: '💴' },
      { id: '4k-6k', label: '$4,000 - $6,000', icon: '💶' },
      { id: '6k-8k', label: '$6,000 - $8,000', icon: '💷' },
      { id: '8k-10k', label: '$8,000 - $10,000', icon: '💸' },
      { id: 'over10k', label: 'Over $10,000', icon: '🤑' },
      { id: 'preferNotToSay', label: 'Prefer not to say', icon: '🤐' }
    ]
  },
  {
    id: 'hasDebt',
    title: 'Do you currently have any debt?',
    subtitle: 'We\'ll help you create a debt payoff plan.',
    type: 'singleSelect',
    options: [
      { id: 'yes', label: 'Yes, I have debt to pay off', icon: '📊' },
      { id: 'no', label: 'No, I\'m debt-free', icon: '🎉' },
      { id: 'onlyMortgage', label: 'Only mortgage debt', icon: '🏠' }
    ]
  },
  {
    id: 'debtTypes',
    title: 'What types of debt do you have?',
    subtitle: 'Select all that apply.',
    type: 'multiSelect',
    condition: (answers: OnboardingAnswers) => answers.hasDebt === 'yes',
    options: [
      { id: 'creditCard', label: 'Credit card debt', icon: '💳' },
      { id: 'studentLoan', label: 'Student loans', icon: '🎓' },
      { id: 'carLoan', label: 'Car loan', icon: '🚗' },
      { id: 'personalLoan', label: 'Personal loan', icon: '💰' },
      { id: 'medicalDebt', label: 'Medical debt', icon: '🏥' },
      { id: 'businessDebt', label: 'Business debt', icon: '🏢' },
      { id: 'other', label: 'Other debt', icon: '📋' }
    ]
  },
  {
    id: 'savingsGoals',
    title: 'What are you saving for?',
    subtitle: 'We\'ll create dedicated savings categories for these goals.',
    type: 'multiSelect',
    options: [
      { id: 'emergencyFund', label: 'Emergency fund (3-6 months expenses)', icon: '🛡️' },
      { id: 'houseDownPayment', label: 'House down payment', icon: '🏠' },
      { id: 'carPurchase', label: 'Car purchase', icon: '🚗' },
      { id: 'vacation', label: 'Vacation fund', icon: '🏖️' },
      { id: 'wedding', label: 'Wedding expenses', icon: '💒' },
      { id: 'babyFund', label: 'Baby/family planning', icon: '👶' },
      { id: 'education', label: 'Education/courses', icon: '📚' },
      { id: 'homeImprovement', label: 'Home improvement', icon: '🔨' },
      { id: 'retirement', label: 'Retirement', icon: '👴' },
      { id: 'investments', label: 'Investments', icon: '📈' }
    ]
  },
  {
    id: 'expenseCategories',
    title: 'Which expense categories are important to you?',
    subtitle: 'We\'ll make sure to include these in your budget.',
    type: 'multiSelect',
    options: [
      { id: 'groceries', label: 'Groceries & household items', icon: '🛒' },
      { id: 'dining', label: 'Dining out & takeout', icon: '🍕' },
      { id: 'utilities', label: 'Utilities (electric, gas, water)', icon: '💡' },
      { id: 'internet', label: 'Internet & phone', icon: '📱' },
      { id: 'insurance', label: 'Insurance (health, auto, etc.)', icon: '🛡️' },
      { id: 'clothing', label: 'Clothing & personal care', icon: '👕' },
      { id: 'gifts', label: 'Gifts & donations', icon: '🎁' },
      { id: 'personalCare', label: 'Personal care & beauty', icon: '💄' }
    ]
  },
  {
    id: 'shoppingHabits',
    title: 'What are your shopping habits?',
    subtitle: 'This helps us understand your spending patterns.',
    type: 'multiSelect',
    options: [
      { id: 'onlineShopping', label: 'Online shopping (Amazon, etc.)', icon: '📦' },
      { id: 'groceryDelivery', label: 'Grocery delivery services', icon: '🚚' },
      { id: 'bulkShopping', label: 'Bulk shopping (Costco, Sam\'s Club)', icon: '🛍️' },
      { id: 'thriftShopping', label: 'Thrift stores & second-hand', icon: '♻️' },
      { id: 'luxuryItems', label: 'Luxury/designer items', icon: '💎' },
      { id: 'impulseBuying', label: 'Impulse purchases', icon: '🎯' },
      { id: 'bargainHunting', label: 'Bargain hunting & coupons', icon: '🏷️' }
    ]
  },
  {
    id: 'healthWellness',
    title: 'What health & wellness expenses do you have?',
    subtitle: 'These can be significant budget categories.',
    type: 'multiSelect',
    options: [
      { id: 'gymMembership', label: 'Gym membership', icon: '🏋️' },
      { id: 'healthInsurance', label: 'Health insurance premiums', icon: '🏥' },
      { id: 'medications', label: 'Medications & prescriptions', icon: '💊' },
      { id: 'therapy', label: 'Therapy & mental health', icon: '🧠' },
      { id: 'dental', label: 'Dental care', icon: '🦷' },
      { id: 'vision', label: 'Vision care & glasses', icon: '👓' },
      { id: 'supplements', label: 'Vitamins & supplements', icon: '🌿' },
      { id: 'none', label: 'None of these apply', icon: '❌' }
    ]
  },
  {
    id: 'transportation',
    title: 'How do you get around?',
    subtitle: 'Transportation costs can vary greatly.',
    type: 'multiSelect',
    options: [
      { id: 'ownCar', label: 'Own a car (with payments)', icon: '🚗' },
      { id: 'ownCarPaidOff', label: 'Own a car (paid off)', icon: '🚙' },
      { id: 'publicTransit', label: 'Public transportation', icon: '🚌' },
      { id: 'rideshare', label: 'Rideshare (Uber, Lyft)', icon: '🚕' },
      { id: 'bike', label: 'Bicycle', icon: '🚲' },
      { id: 'motorcycle', label: 'Motorcycle', icon: '🏍️' },
      { id: 'walk', label: 'Walking', icon: '🚶' },
      { id: 'workFromHome', label: 'Work from home (minimal transport)', icon: '🏠' }
    ]
  },
  {
    id: 'subscriptions',
    title: 'What subscriptions do you pay for?',
    subtitle: 'These recurring expenses add up quickly.',
    type: 'multiSelect',
    options: [
      { id: 'streaming', label: 'Streaming services (Netflix, Hulu, etc.)', icon: '📺' },
      { id: 'music', label: 'Music streaming (Spotify, Apple Music)', icon: '🎵' },
      { id: 'gaming', label: 'Gaming subscriptions', icon: '🎮' },
      { id: 'news', label: 'News & magazines', icon: '📰' },
      { id: 'software', label: 'Software subscriptions', icon: '💻' },
      { id: 'cloud', label: 'Cloud storage', icon: '☁️' },
      { id: 'delivery', label: 'Delivery services (Amazon Prime, etc.)', icon: '📦' },
      { id: 'fitness', label: 'Fitness apps', icon: '💪' },
      { id: 'none', label: 'No subscriptions', icon: '❌' }
    ]
  },
  {
    id: 'hobbiesInterests',
    title: 'What are your hobbies and interests?',
    subtitle: 'We\'ll create categories for your passions.',
    type: 'multiSelect',
    options: [
      { id: 'sports', label: 'Sports & athletics', icon: '⚽' },
      { id: 'arts', label: 'Arts & crafts', icon: '🎨' },
      { id: 'music', label: 'Music & instruments', icon: '🎸' },
      { id: 'photography', label: 'Photography', icon: '📸' },
      { id: 'gaming', label: 'Gaming', icon: '🎮' },
      { id: 'reading', label: 'Reading & books', icon: '📚' },
      { id: 'cooking', label: 'Cooking & baking', icon: '👨‍🍳' },
      { id: 'gardening', label: 'Gardening', icon: '🌱' },
      { id: 'travel', label: 'Travel & exploration', icon: '🌍' },
      { id: 'technology', label: 'Technology & gadgets', icon: '💻' }
    ]
  },
  {
    id: 'familyPets',
    title: 'Do you have family or pets?',
    subtitle: 'These can be significant budget categories.',
    type: 'multiSelect',
    options: [
      { id: 'children', label: 'Children (childcare, school, activities)', icon: '👶' },
      { id: 'elderCare', label: 'Elder care responsibilities', icon: '👴' },
      { id: 'dogs', label: 'Dogs', icon: '🐕' },
      { id: 'cats', label: 'Cats', icon: '🐱' },
      { id: 'otherPets', label: 'Other pets', icon: '🐹' },
      { id: 'none', label: 'No dependents or pets', icon: '❌' }
    ]
  },
  {
    id: 'workEducation',
    title: 'What work or education expenses do you have?',
    subtitle: 'These might be tax-deductible or reimbursable.',
    type: 'multiSelect',
    options: [
      { id: 'workClothing', label: 'Work clothing & uniforms', icon: '👔' },
      { id: 'professionalDev', label: 'Professional development', icon: '📈' },
      { id: 'homeOffice', label: 'Home office supplies', icon: '🏠' },
      { id: 'commuting', label: 'Commuting costs', icon: '🚊' },
      { id: 'tuition', label: 'Tuition & education', icon: '🎓' },
      { id: 'books', label: 'Books & learning materials', icon: '📚' },
      { id: 'conferences', label: 'Conferences & networking', icon: '🤝' },
      { id: 'none', label: 'No work/education expenses', icon: '❌' }
    ]
  },
  {
    id: 'irregularExpenses',
    title: 'What irregular expenses do you need to prepare for?',
    subtitle: 'These don\'t happen monthly but need planning.',
    type: 'multiSelect',
    options: [
      { id: 'carMaintenance', label: 'Car maintenance & repairs', icon: '🔧' },
      { id: 'homeMaintenance', label: 'Home maintenance & repairs', icon: '🏠' },
      { id: 'annualFees', label: 'Annual fees (credit cards, memberships)', icon: '💳' },
      { id: 'taxes', label: 'Tax preparation & payments', icon: '📊' },
      { id: 'gifts', label: 'Holiday & birthday gifts', icon: '🎁' },
      { id: 'medical', label: 'Medical emergencies', icon: '🏥' },
      { id: 'appliances', label: 'Appliance replacement', icon: '🔌' },
      { id: 'legalFees', label: 'Legal fees', icon: '⚖️' }
    ]
  },
  {
    id: 'budgetingChallenges',
    title: 'What budgeting challenges do you face?',
    subtitle: 'We\'ll help you overcome these common obstacles.',
    type: 'multiSelect',
    options: [
      { id: 'overspending', label: 'Overspending on wants vs needs', icon: '💸' },
      { id: 'tracking', label: 'Forgetting to track expenses', icon: '📝' },
      { id: 'irregularIncome', label: 'Irregular income', icon: '📊' },
      { id: 'emergencies', label: 'Unexpected emergencies', icon: '🚨' },
      { id: 'partnerDifferences', label: 'Partner has different spending habits', icon: '👫' },
      { id: 'motivation', label: 'Staying motivated', icon: '🎯' },
      { id: 'complexity', label: 'Budgeting seems too complex', icon: '🤯' },
      { id: 'timeManagement', label: 'Don\'t have time to budget', icon: '⏰' }
    ]
  }
]

export default function OnboardingSlideshow() {
  const router = useRouter()
  const { data: session } = useSession()
  const [currentSlide, setCurrentSlide] = useState(0)
  const [answers, setAnswers] = useState<OnboardingAnswers>({
    name: session?.user?.name || '',
    budgetingExperience: '',
    primaryGoals: [],
    lifeStage: '',
    housingType: '',
    incomeFrequency: '',
    monthlyIncome: '',
    hasDebt: '',
    debtTypes: [],
    savingsGoals: [],
    expenseCategories: [],
    shoppingHabits: [],
    healthWellness: [],
    transportation: [],
    subscriptions: [],
    hobbiesInterests: [],
    familyPets: [],
    workEducation: [],
    irregularExpenses: [],
    budgetingChallenges: []
  })
  const [isLoading, setIsLoading] = useState(false)

  // Filter slides based on conditions
  const getVisibleSlides = () => {
    return slides.filter(slide => {
      if (slide.condition) {
        return slide.condition(answers)
      }
      return true
    })
  }

  const visibleSlides = getVisibleSlides()
  const progress = ((currentSlide + 1) / visibleSlides.length) * 100

  const handleInputChange = (value: string) => {
    setAnswers({ ...answers, name: value })
  }

  const handleSingleSelect = (field: keyof OnboardingAnswers, value: string) => {
    setAnswers({ ...answers, [field]: value })
  }

  const handleMultiSelect = (field: keyof OnboardingAnswers, optionId: string) => {
    const currentValues = answers[field] as string[]
    
    if (optionId === 'none') {
      setAnswers({ ...answers, [field]: currentValues.includes('none') ? [] : ['none'] })
    } else {
      const newValues = currentValues.includes(optionId)
        ? currentValues.filter(id => id !== optionId && id !== 'none')
        : [...currentValues.filter(id => id !== 'none'), optionId]
      setAnswers({ ...answers, [field]: newValues })
    }
  }

  const handleNext = () => {
    if (currentSlide < visibleSlides.length - 1) {
      setCurrentSlide(currentSlide + 1)
    } else {
      handleFinish()
    }
  }

  const handleBack = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1)
    }
  }

  const handleFinish = async () => {
    setIsLoading(true)
    
    try {
      console.log('🚀 Sending onboarding answers:', answers)
      const response = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(answers)
      })

      if (response.ok) {
        console.log('✅ Onboarding completed successfully!')
        router.push('/')
      } else {
        const errorData = await response.json()
        console.error('❌ Server error:', errorData)
        throw new Error(`Failed to complete onboarding: ${errorData.details || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('❌ Error completing onboarding:', error)
      alert(`Onboarding failed: ${error.message}`)
      setIsLoading(false)
    }
  }

  const canContinue = () => {
    const slide = visibleSlides[currentSlide]
    if (slide.type === 'input') {
      return answers.name.trim().length > 0
    }
    if (slide.type === 'singleSelect') {
      return (answers[slide.id as keyof OnboardingAnswers] as string) !== ''
    }
    return true
  }

  const currentSlideData = visibleSlides[currentSlide]

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
        <Card className="w-full max-w-md p-8 text-center bg-white">
          <div className="mb-6">
            <LoaderIcon className="w-12 h-12 mx-auto text-blue-600 animate-spin" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Creating your personalized budget...
          </h2>
          <p className="text-gray-600 mb-4">
            We're analyzing your responses and setting up custom categories and groups tailored to your lifestyle.
          </p>
          <div className="text-sm text-gray-500">
            This may take a few moments...
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 to-blue-600 flex flex-col">
      {/* Progress Bar */}
      <div className="w-full bg-white bg-opacity-20 h-3">
        <div 
          className="h-full bg-white transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            
            {/* Left Side - Illustration */}
            <div className="hidden lg:flex items-center justify-center">
              <div className="w-80 h-80 bg-gradient-to-br from-blue-300 to-blue-500 rounded-3xl flex items-center justify-center relative overflow-hidden">
                <div className="text-6xl">
                  {currentSlideData.icon || '💰'}
                      </div>
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="bg-white bg-opacity-90 rounded-lg p-3 text-center">
                    <div className="text-sm font-medium text-gray-800">
                      Step {currentSlide + 1} of {visibleSlides.length}
                    </div>
                  </div>
                  </div>
              </div>
            </div>

            {/* Right Side - Content */}
            <Card className="w-full max-w-lg bg-white p-8">
              <div className="space-y-6">
                
                {/* Title */}
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    {currentSlideData.title.replace('{name}', answers.name)}
                  </h1>
                  {currentSlideData.subtitle && (
                    <p className="text-gray-600">
                      {currentSlideData.subtitle}
                    </p>
                  )}
                </div>

                {/* Content based on slide type */}
                {currentSlideData.type === 'input' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Name
                    </label>
                    <Input
                      type="text"
                      value={answers.name}
                      onChange={(e) => handleInputChange(e.target.value)}
                      placeholder="Your first name"
                      className="w-full"
                    />
                  </div>
                )}

                {currentSlideData.type === 'singleSelect' && currentSlideData.options && (
                  <div className="space-y-3">
                    {currentSlideData.options.map((option) => {
                      const isSelected = (answers[currentSlideData.id as keyof OnboardingAnswers] as string) === option.id
                      return (
                        <button
                          key={option.id}
                          onClick={() => handleSingleSelect(currentSlideData.id as keyof OnboardingAnswers, option.id)}
                          className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                            isSelected 
                              ? 'border-blue-600 bg-blue-50 text-blue-900' 
                              : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            {option.icon && <span className="text-xl">{option.icon}</span>}
                            <span className="font-medium">{option.label}</span>
                            {isSelected && <span className="ml-auto text-blue-600">✓</span>}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}

                {currentSlideData.type === 'multiSelect' && currentSlideData.options && (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {currentSlideData.options.map((option) => {
                      const isSelected = (answers[currentSlideData.id as keyof OnboardingAnswers] as string[]).includes(option.id)
                      return (
                        <button
                          key={option.id}
                          onClick={() => handleMultiSelect(currentSlideData.id as keyof OnboardingAnswers, option.id)}
                          className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                            isSelected 
                              ? 'border-blue-600 bg-blue-50 text-blue-900' 
                              : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            {option.icon && <span className="text-xl">{option.icon}</span>}
                            <span className="font-medium">{option.label}</span>
                            {isSelected && <span className="ml-auto text-blue-600">✓</span>}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}

                {/* Navigation */}
                <div className="flex justify-between items-center pt-6">
                  <Button
                    variant="outline"
                    onClick={handleBack}
                    disabled={currentSlide === 0}
                    className={currentSlide === 0 ? 'invisible' : ''}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>

                  <div className="text-sm text-gray-500">
                    {currentSlide + 1} of {visibleSlides.length}
                  </div>

                  <Button
                    onClick={handleNext}
                    disabled={!canContinue()}
                    className={`${
                      currentSlide === visibleSlides.length - 1 
                        ? 'bg-green-600 hover:bg-green-700' 
                        : 'bg-blue-600 hover:bg-blue-700'
                    } text-white`}
                  >
                    {currentSlide === visibleSlides.length - 1 ? 'Create Budget' : 'Continue'}
                    {currentSlide < visibleSlides.length - 1 && (
                      <ArrowRight className="w-4 h-4 ml-2" />
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
} 