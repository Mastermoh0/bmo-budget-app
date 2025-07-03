'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mail, ArrowLeft, Send, Clock, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [step, setStep] = useState<'email' | 'otp' | 'password'>('email')
  const [formData, setFormData] = useState({
    email: '',
    otp: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)

  const validateEmail = () => {
    if (!formData.email.trim()) {
      setErrors({ email: 'Email is required' })
      return false
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setErrors({ email: 'Please enter a valid email address' })
      return false
    }
    setErrors({})
    return true
  }

  const validateOtp = () => {
    if (!formData.otp.trim()) {
      setErrors({ otp: 'OTP is required' })
      return false
    }
    if (!/^\d{6}$/.test(formData.otp)) {
      setErrors({ otp: 'OTP must be 6 digits' })
      return false
    }
    setErrors({})
    return true
  }

  const validatePassword = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.newPassword) {
      newErrors.newPassword = 'Password is required'
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters'
    }

    if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateEmail()) {
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email.toLowerCase(),
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setStep('otp')
        startCountdown()
      } else {
        setErrors({ email: data.error || 'Failed to send OTP. Please try again.' })
      }
    } catch (error) {
      setErrors({ email: 'Network error. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateOtp()) {
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email.toLowerCase(),
          otp: formData.otp,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setStep('password')
      } else {
        setErrors({ otp: data.error || 'Invalid or expired OTP. Please try again.' })
      }
    } catch (error) {
      setErrors({ otp: 'Network error. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validatePassword()) {
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email.toLowerCase(),
          otp: formData.otp,
          newPassword: formData.newPassword,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        router.push('/auth/signin?message=Password reset successful! Please sign in with your new password.')
      } else {
        setErrors({ general: data.error || 'Failed to reset password. Please try again.' })
      }
    } catch (error) {
      setErrors({ general: 'Network error. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  const startCountdown = () => {
    setCountdown(60)
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value })
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' })
    }
  }

  const renderEmailStep = () => (
    <form onSubmit={handleSendOtp} className="p-6 space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Forgot Password?</h2>
        <p className="text-gray-600 mt-2">
          Enter your email address and we'll send you a 6-digit code to reset your password.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Email Address
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            placeholder="Enter your email"
            className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
            disabled={isLoading}
          />
        </div>
        {errors.email && (
          <p className="text-sm text-red-600 mt-1">{errors.email}</p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full bg-blue-600 hover:bg-blue-700"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Send className="w-4 h-4 mr-2 animate-spin" />
            Sending Code...
          </>
        ) : (
          <>
            <Send className="w-4 h-4 mr-2" />
            Send Reset Code
          </>
        )}
      </Button>
    </form>
  )

  const renderOtpStep = () => (
    <form onSubmit={handleVerifyOtp} className="p-6 space-y-4">
      <div className="text-center mb-6">
        <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900">Check Your Email</h2>
        <p className="text-gray-600 mt-2">
          We've sent a 6-digit code to <strong>{formData.email}</strong>
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          6-Digit Code
        </label>
        <Input
          type="text"
          value={formData.otp}
          onChange={(e) => handleInputChange('otp', e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="000000"
          className={`text-center text-2xl tracking-widest ${errors.otp ? 'border-red-500' : ''}`}
          disabled={isLoading}
          maxLength={6}
        />
        {errors.otp && (
          <p className="text-sm text-red-600 mt-1">{errors.otp}</p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full bg-blue-600 hover:bg-blue-700"
        disabled={isLoading || formData.otp.length !== 6}
      >
        {isLoading ? 'Verifying...' : 'Verify Code'}
      </Button>

      <div className="text-center">
        {countdown > 0 ? (
          <div className="flex items-center justify-center text-sm text-gray-500">
            <Clock className="w-4 h-4 mr-1" />
            Resend code in {countdown}s
          </div>
        ) : (
          <button
            type="button"
            onClick={handleSendOtp}
            className="text-sm text-blue-600 hover:text-blue-700"
            disabled={isLoading}
          >
            Didn't receive the code? Resend
          </button>
        )}
      </div>
    </form>
  )

  const renderPasswordStep = () => (
    <form onSubmit={handleResetPassword} className="p-6 space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Set New Password</h2>
        <p className="text-gray-600 mt-2">
          Enter your new password below.
        </p>
      </div>

      {errors.general && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{errors.general}</p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          New Password
        </label>
        <Input
          type="password"
          value={formData.newPassword}
          onChange={(e) => handleInputChange('newPassword', e.target.value)}
          placeholder="Enter new password"
          className={errors.newPassword ? 'border-red-500' : ''}
          disabled={isLoading}
        />
        {errors.newPassword && (
          <p className="text-sm text-red-600 mt-1">{errors.newPassword}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Confirm New Password
        </label>
        <Input
          type="password"
          value={formData.confirmPassword}
          onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
          placeholder="Confirm new password"
          className={errors.confirmPassword ? 'border-red-500' : ''}
          disabled={isLoading}
        />
        {errors.confirmPassword && (
          <p className="text-sm text-red-600 mt-1">{errors.confirmPassword}</p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full bg-blue-600 hover:bg-blue-700"
        disabled={isLoading}
      >
        {isLoading ? 'Resetting Password...' : 'Reset Password'}
      </Button>
    </form>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white shadow-xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <Link 
              href="/auth/signin" 
              className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Sign In
            </Link>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">B</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">BMO</h1>
                <p className="text-sm text-gray-500">Budget Money Online</p>
              </div>
            </div>
          </div>
        </div>

        {/* Form Steps */}
        {step === 'email' && renderEmailStep()}
        {step === 'otp' && renderOtpStep()}
        {step === 'password' && renderPasswordStep()}
      </Card>
    </div>
  )
} 