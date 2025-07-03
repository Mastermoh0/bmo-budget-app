'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { ArrowLeft, ArrowRight, Coffee, LoaderIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'

interface OnboardingAnswers {
  name: string
  hearAbout: string[]
  goals: string[]
  subscriptions: string[]
  expenses: string[]
  transportation: string[]
}

const slides = [
  {
    id: 'name',
    title: 'First things first, people call us "why-nab".',
    subtitle: 'What should we call you?',
    type: 'input'
  },
  {
    id: 'hearAbout',
    title: 'Hi {name}! How\'d you hear about us?',
    type: 'multiSelect',
    options: [
      { id: 'podcast', label: 'Podcast', icon: '🎧' },
      { id: 'friend', label: 'Friend, family, or colleague', icon: '👥' },
      { id: 'search', label: 'Online search', icon: '🔍' },
      { id: 'appStore', label: 'App store', icon: '📱' },
      { id: 'social', label: 'YNAB\'s Social Media', icon: '📱' },
      { id: 'influencer', label: 'Influencer', icon: '⭐' },
      { id: 'chatgpt', label: 'ChatGPT or other AI tool', icon: '🤖' },
      { id: 'youtube', label: 'YouTube', icon: '📺' },
      { id: 'news', label: 'News article', icon: '📰' }
    ]
  },
  {
    id: 'goals',
    title: 'What brings you to YNAB today?',
    type: 'multiSelect',
    options: [
      { id: 'debt', label: 'Get out of debt', icon: '💎' },
      { id: 'partner', label: 'Manage money with my partner', icon: '💗' },
      { id: 'simplify', label: 'Simplify my finances', icon: '✏️' },
      { id: 'maximize', label: 'Make the most of my money', icon: '💪' },
      { id: 'breathing', label: 'Create more breathing room', icon: '😤' },
      { id: 'control', label: 'Feel more in control', icon: '🎮' },
      { id: 'other', label: 'Other', icon: '🔘' }
    ]
  },
  {
    id: 'buildPlan',
    title: 'Let\'s build your plan',
    subtitle: 'We\'ve got a few questions to help build your plan and set you up to give every dollar a job with confidence.',
    type: 'info'
  },
  {
    id: 'subscriptions',
    title: '🍿 Which of these subscriptions do you have?',
    type: 'multiSelect',
    options: [
      { id: 'music', label: 'Music', icon: '🎵' },
      { id: 'tvStreaming', label: 'TV streaming', icon: '📺' },
      { id: 'fitness', label: 'Fitness', icon: '💪' },
      { id: 'other', label: 'Other subscriptions', icon: '🗓️' },
      { id: 'none', label: 'I don\'t subscribe to any of these', icon: '' }
    ]
  },
  {
    id: 'expenses',
    title: '🔧 What larger, less frequent expenses do you need to prepare for?',
    type: 'multiSelect',
    options: [
      { id: 'creditCard', label: 'Annual credit card fees', icon: '💳' },
      { id: 'medical', label: 'Medical expenses', icon: '🏥' },
      { id: 'taxes', label: 'Taxes or other fees', icon: '💎' },
      { id: 'vet', label: 'Vet visits', icon: '🐕' },
      { id: 'none', label: 'None of these apply to me', icon: '' }
    ]
  },
  {
    id: 'transportation',
    title: '🚗 How do you get around?',
    type: 'multiSelect',
    options: [
      { id: 'car', label: 'Car', icon: '🚗' },
      { id: 'rideshare', label: 'Rideshare', icon: '🚙' },
      { id: 'bike', label: 'Bike', icon: '🚲' },
      { id: 'motorcycle', label: 'Motorcycle', icon: '🏍️' },
      { id: 'walk', label: 'Walk', icon: '🚶' },
      { id: 'wheelchair', label: 'Wheelchair', icon: '♿' },
      { id: 'transit', label: 'Public transit', icon: '🚌' },
      { id: 'none', label: 'None of these apply to me', icon: '' }
    ]
  }
]

export default function OnboardingSlideshow() {
  const router = useRouter()
  const { data: session } = useSession()
  const [currentSlide, setCurrentSlide] = useState(0)
  const [answers, setAnswers] = useState<OnboardingAnswers>({
    name: session?.user?.name || '',
    hearAbout: [],
    goals: [],
    subscriptions: [],
    expenses: [],
    transportation: []
  })
  const [isLoading, setIsLoading] = useState(false)

  const progress = ((currentSlide + 1) / slides.length) * 100

  const handleInputChange = (value: string) => {
    setAnswers({ ...answers, name: value })
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
    if (currentSlide < slides.length - 1) {
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
      const response = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(answers)
      })

      if (response.ok) {
        router.push('/')
      } else {
        throw new Error('Failed to complete onboarding')
      }
    } catch (error) {
      console.error('Error completing onboarding:', error)
      setIsLoading(false)
    }
  }

  const canContinue = () => {
    const slide = slides[currentSlide]
    if (slide.type === 'input') {
      return answers.name.trim().length > 0
    }
    return true
  }

  const currentSlideData = slides[currentSlide]

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
        <Card className="w-full max-w-md p-8 text-center bg-white">
          <div className="mb-6">
            <LoaderIcon className="w-12 h-12 mx-auto text-emerald-600 animate-spin" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Setting up your budget...
          </h2>
          <p className="text-gray-600">
            We're creating your personalized categories and budget structure based on your responses.
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-400 to-emerald-600 flex flex-col">
      {/* Progress Bar */}
      <div className="w-full bg-white bg-opacity-20 h-2">
        <div 
          className="h-full bg-blue-600 transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            
            {/* Left Side - Illustration */}
            <div className="hidden lg:flex items-center justify-center">
              <div className="w-80 h-80 bg-gradient-to-br from-emerald-300 to-emerald-500 rounded-3xl flex items-center justify-center relative overflow-hidden">
                {currentSlide === 0 && (
                  <div className="relative">
                    <Coffee className="w-32 h-32 text-blue-600" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-lg">
                        I ❤️ YNAB.
                      </div>
                    </div>
                  </div>
                )}
                {currentSlide === 3 && (
                  <div className="text-center">
                    <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center mb-4">
                      <span className="text-white text-4xl">🌳</span>
                    </div>
                    <div className="bg-blue-600 text-white px-6 py-2 rounded-lg">
                      <span className="text-lg font-bold">📊</span>
                    </div>
                  </div>
                )}
                {![0, 3].includes(currentSlide) && (
                  <div className="text-6xl">
                    {currentSlideData.title.includes('🍿') && '🍿'}
                    {currentSlideData.title.includes('🔧') && '🔧'}
                    {currentSlideData.title.includes('🚗') && '🚗'}
                    {!currentSlideData.title.match(/[🍿🔧🚗]/) && '👋'}
                  </div>
                )}
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

                {currentSlideData.type === 'multiSelect' && currentSlideData.options && (
                  <div className="space-y-3">
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

                  <Button
                    onClick={handleNext}
                    disabled={!canContinue()}
                    className={`${
                      currentSlide === slides.length - 1 
                        ? 'bg-emerald-600 hover:bg-emerald-700' 
                        : 'bg-blue-600 hover:bg-blue-700'
                    } text-white`}
                  >
                    {currentSlide === slides.length - 1 ? 'Finish' : 'Continue'}
                    {currentSlide < slides.length - 1 && (
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