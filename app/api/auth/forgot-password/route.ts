import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sendOtpEmail, generateOtp } from '@/lib/email'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email } = body

    // Validate email
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      )
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, name: true, email: true }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'No account found with this email address' },
        { status: 404 }
      )
    }

    // Generate OTP
    const otp = generateOtp()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes from now

    // Delete any existing password reset tokens for this user
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id }
    })

    // Create new password reset token
    await prisma.passwordResetToken.create({
      data: {
        email: user.email,
        token: otp,
        expires: expiresAt,
        userId: user.id,
      }
    })

    // Send OTP email
    const emailResult = await sendOtpEmail(user.email, otp, user.name)

    if (!emailResult.success) {
      // If email fails, clean up the token
      await prisma.passwordResetToken.deleteMany({
        where: { userId: user.id }
      })

      return NextResponse.json(
        { error: 'Failed to send reset code. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Password reset code sent to your email',
      email: user.email,
      expiresIn: 15 // minutes
    })

  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: 'Failed to process request. Please try again.' },
      { status: 500 }
    )
  }
} 