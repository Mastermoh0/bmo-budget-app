import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { isValidOtp } from '@/lib/email'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, otp, newPassword } = body

    // Validate inputs
    if (!email || !otp || !newPassword) {
      return NextResponse.json(
        { error: 'Email, OTP, and new password are required' },
        { status: 400 }
      )
    }

    if (!isValidOtp(otp)) {
      return NextResponse.json(
        { error: 'Invalid OTP format. Please enter a 6-digit code.' },
        { status: 400 }
      )
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      )
    }

    // Find and verify the password reset token
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

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 12)

    // Update user's password and clean up reset tokens
    await prisma.$transaction([
      // Update password
      prisma.user.update({
        where: { id: resetToken.user.id },
        data: { password: hashedPassword }
      }),
      // Delete all password reset tokens for this user
      prisma.passwordResetToken.deleteMany({
        where: { userId: resetToken.user.id }
      })
    ])

    return NextResponse.json({
      message: 'Password reset successfully',
      user: {
        id: resetToken.user.id,
        name: resetToken.user.name,
        email: resetToken.user.email,
      }
    })

  } catch (error) {
    console.error('Password reset error:', error)
    return NextResponse.json(
      { error: 'Failed to reset password. Please try again.' },
      { status: 500 }
    )
  }
} 