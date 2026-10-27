import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { isValidOtp } from '@/lib/email'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, otp } = body

    // Validate inputs
    if (!email || !otp) {
      return NextResponse.json(
        { error: 'Email and OTP are required' },
        { status: 400 }
      )
    }

    if (!isValidOtp(otp)) {
      return NextResponse.json(
        { error: 'Invalid OTP format. Please enter a 6-digit code.' },
        { status: 400 }
      )
    }

    // Find the password reset token
    const resetToken = await prisma.passwordResetToken.findFirst({
      where: {
        email: email.toLowerCase(),
        token: otp,
        expires: {
          gt: new Date() // Token hasn't expired
        }
      },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    if (!resetToken) {
      return NextResponse.json(
        { error: 'Invalid or expired OTP. Please request a new code.' },
        { status: 400 }
      )
    }

    // OTP is valid, return success
    return NextResponse.json({
      message: 'OTP verified successfully',
      user: {
        id: resetToken.user.id,
        name: resetToken.user.name,
        email: resetToken.user.email,
      }
    })

  } catch (error) {
    console.error('OTP verification error:', error)
    return NextResponse.json(
      { error: 'Failed to verify OTP. Please try again.' },
      { status: 500 }
    )
  }
} 