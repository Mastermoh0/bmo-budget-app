import nodemailer from 'nodemailer'

// Create transporter based on environment
const createTransporter = () => {
  // In production, you would use a real email service like SendGrid, AWS SES, etc.
  // For development, we'll use a test account or console logging
  if (process.env.NODE_ENV === 'production' && process.env.SMTP_USER && process.env.SMTP_PASS) {
    // Production email service (configure with your email provider)
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  } else {
    // Development: Create a test account (this creates an ethereal.email account for testing)
    return new Promise((resolve, reject) => {
      nodemailer.createTestAccount((err, account) => {
        if (err) {
          console.error('Failed to create test account:', err)
          reject(err)
          return
        }

        console.log('📧 Using test email account for development')
        console.log('Test account:', account.user)

        const transporter = nodemailer.createTransport({
          host: account.smtp.host,
          port: account.smtp.port,
          secure: account.smtp.secure,
          auth: {
            user: account.user,
            pass: account.pass,
          },
        })

        resolve(transporter)
      })
    })
  }
}

export async function sendInvitationEmail(
  email: string, 
  inviterName: string, 
  budgetName: string, 
  role: string,
  invitationToken: string,
  baseUrl: string
) {
  try {
    const transporter = await createTransporter()
    
    const acceptUrl = `${baseUrl}/invite/accept?token=${invitationToken}`
    const roleDisplay = role.charAt(0).toUpperCase() + role.slice(1).toLowerCase()

    const mailOptions = {
      from: '"BMO - Budget Money Online" <noreply@bmo-budget.app>',
      to: email,
      subject: `You're invited to collaborate on "${budgetName}" budget`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>BMO Budget Invitation</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              line-height: 1.6; 
              color: #333; 
              max-width: 600px; 
              margin: 0 auto; 
              padding: 20px; 
            }
            .header { 
              background: linear-gradient(135deg, #3b82f6, #1e40af); 
              color: white; 
              padding: 30px; 
              text-align: center; 
              border-radius: 10px 10px 0 0; 
            }
            .logo { 
              display: inline-flex; 
              align-items: center; 
              gap: 10px; 
              margin-bottom: 10px; 
            }
            .logo-icon { 
              width: 40px; 
              height: 40px; 
              background: rgba(255,255,255,0.2); 
              border-radius: 8px; 
              display: flex; 
              align-items: center; 
              justify-content: center; 
              font-weight: bold; 
              font-size: 20px; 
            }
            .content { 
              background: white; 
              padding: 30px; 
              border: 1px solid #e5e7eb; 
              border-top: none; 
              border-radius: 0 0 10px 10px; 
            }
            .invitation-box { 
              background: #f8fafc; 
              border: 2px solid #e2e8f0; 
              padding: 25px; 
              text-align: center; 
              margin: 25px 0; 
              border-radius: 12px; 
            }
            .budget-name { 
              font-size: 24px; 
              font-weight: bold; 
              color: #1e40af; 
              margin: 10px 0; 
            }
            .role-badge { 
              display: inline-block;
              background: #dbeafe; 
              color: #1e40af; 
              padding: 8px 16px; 
              border-radius: 20px; 
              font-weight: bold; 
              font-size: 14px;
              margin: 10px 0;
            }
            .accept-button { 
              display: inline-block;
              background: #3b82f6; 
              color: white; 
              padding: 15px 30px; 
              text-decoration: none; 
              border-radius: 8px; 
              font-weight: bold; 
              margin: 20px 0;
              transition: background-color 0.3s;
            }
            .accept-button:hover { 
              background: #2563eb; 
            }
            .permissions { 
              background: #fef3cd; 
              border: 1px solid #fde68a; 
              padding: 20px; 
              border-radius: 8px; 
              margin: 20px 0; 
            }
            .permissions h4 {
              margin-top: 0;
              color: #92400e;
            }
            .permissions ul {
              margin: 10px 0;
              padding-left: 20px;
            }
            .footer { 
              text-align: center; 
              margin-top: 30px; 
              color: #6b7280; 
              font-size: 14px; 
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">
              <div class="logo-icon">B</div>
              <div>
                <h1 style="margin: 0; font-size: 24px;">BMO</h1>
                <p style="margin: 0; opacity: 0.9; font-size: 14px;">Budget Money Online</p>
              </div>
            </div>
          </div>
          
          <div class="content">
            <h2>You're Invited to Collaborate! 🎉</h2>
            
            <p><strong>${inviterName}</strong> has invited you to collaborate on their budget in BMO - Budget Money Online.</p>
            
            <div class="invitation-box">
              <p style="margin: 0; color: #6b7280; font-size: 16px;">Budget:</p>
              <div class="budget-name">${budgetName}</div>
              <div class="role-badge">Role: ${roleDisplay}</div>
            </div>
            
            <div class="permissions">
              <h4>🔐 Your ${roleDisplay} Permissions:</h4>
              ${role === 'VIEWER' ? `
                <ul>
                  <li>View all transactions, budgets, and reports</li>
                  <li>Export data and reports</li>
                  <li>View account balances and financial data</li>
                </ul>
                <p><em>Note: You won't be able to make changes to the budget.</em></p>
              ` : role === 'EDITOR' ? `
                <ul>
                  <li>Add and edit transactions</li>
                  <li>Create and manage categories</li>
                  <li>Add category groups</li>
                  <li>View all budget data and reports</li>
                  <li>Export data and reports</li>
                </ul>
                <p><em>Note: You won't be able to delete major items or manage users.</em></p>
              ` : `
                <ul>
                  <li>Full access to all budget features</li>
                  <li>Manage users and permissions</li>
                  <li>Delete accounts, categories, and transactions</li>
                  <li>Complete budget administration</li>
                </ul>
              `}
            </div>
            
            <div style="text-align: center;">
              <a href="${acceptUrl}" class="accept-button">Accept Invitation</a>
            </div>
            
            <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
              If you don't have a BMO account yet, you'll be able to create one when you accept the invitation.
            </p>
            
            <p style="color: #6b7280; font-size: 14px;">
              This invitation will expire in 7 days. If you have any questions, contact ${inviterName} directly.
            </p>
          </div>
          
          <div class="footer">
            <p>This invitation was sent to ${email}</p>
            <p>BMO - Budget Money Online | Collaborative Financial Management</p>
          </div>
        </body>
        </html>
      `,
      text: `
BMO Budget Invitation

Hi!

${inviterName} has invited you to collaborate on their "${budgetName}" budget in BMO - Budget Money Online.

Your Role: ${roleDisplay}

${role === 'VIEWER' ? 'As a Viewer, you can view all budget data but cannot make changes.' :
  role === 'EDITOR' ? 'As an Editor, you can add transactions and categories but cannot delete major items or manage users.' :
  'As an Owner, you have full access to all budget features.'}

To accept this invitation, click the link below or copy it into your browser:
${acceptUrl}

If you don't have a BMO account yet, you'll be able to create one when you accept the invitation.

This invitation expires in 7 days.

Best regards,
The BMO Team

This invitation was sent to ${email}
      `.trim(),
    }

    const info = await transporter.sendMail(mailOptions)
    
    console.log('✅ Invitation email sent successfully!')
    console.log('Message ID:', info.messageId)
    
    // If using test account, show preview URL
    if (nodemailer.getTestMessageUrl(info)) {
      console.log('📧 Preview test email: %s', nodemailer.getTestMessageUrl(info))
      console.log('🔗 You can view the sent email at the URL above')
    }
    
    return { success: true, messageId: info.messageId, previewUrl: nodemailer.getTestMessageUrl(info) }
  } catch (error) {
    console.error('Invitation email sending error:', error)
    return { success: false, error: error.message }
  }
}

export async function sendOtpEmail(email: string, otp: string, name?: string) {
  try {
    const transporter = await createTransporter()

    const mailOptions = {
      from: '"BMO - Budget Money Online" <noreply@bmo-budget.app>',
      to: email,
      subject: 'BMO Password Reset Code',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>BMO Password Reset</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              line-height: 1.6; 
              color: #333; 
              max-width: 600px; 
              margin: 0 auto; 
              padding: 20px; 
            }
            .header { 
              background: linear-gradient(135deg, #3b82f6, #1e40af); 
              color: white; 
              padding: 30px; 
              text-align: center; 
              border-radius: 10px 10px 0 0; 
            }
            .logo { 
              display: inline-flex; 
              align-items: center; 
              gap: 10px; 
              margin-bottom: 10px; 
            }
            .logo-icon { 
              width: 40px; 
              height: 40px; 
              background: rgba(255,255,255,0.2); 
              border-radius: 8px; 
              display: flex; 
              align-items: center; 
              justify-content: center; 
              font-weight: bold; 
              font-size: 20px; 
            }
            .content { 
              background: white; 
              padding: 30px; 
              border: 1px solid #e5e7eb; 
              border-top: none; 
              border-radius: 0 0 10px 10px; 
            }
            .otp-box { 
              background: #f3f4f6; 
              border: 2px dashed #9ca3af; 
              padding: 20px; 
              text-align: center; 
              margin: 20px 0; 
              border-radius: 8px; 
            }
            .otp-code { 
              font-size: 36px; 
              font-weight: bold; 
              color: #1e40af; 
              letter-spacing: 8px; 
              margin: 10px 0; 
            }
            .warning { 
              background: #fef3cd; 
              border: 1px solid #fde68a; 
              padding: 15px; 
              border-radius: 6px; 
              margin: 20px 0; 
            }
            .footer { 
              text-align: center; 
              margin-top: 30px; 
              color: #6b7280; 
              font-size: 14px; 
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">
              <div class="logo-icon">B</div>
              <div>
                <h1 style="margin: 0; font-size: 24px;">BMO</h1>
                <p style="margin: 0; opacity: 0.9; font-size: 14px;">Budget Money Online</p>
              </div>
            </div>
          </div>
          
          <div class="content">
            <h2>Password Reset Request</h2>
            
            ${name ? `<p>Hi ${name},</p>` : '<p>Hello,</p>'}
            
            <p>We received a request to reset your password for your BMO account. Use the code below to reset your password:</p>
            
            <div class="otp-box">
              <p style="margin: 0; color: #6b7280; font-size: 14px;">Your 6-digit verification code:</p>
              <div class="otp-code">${otp}</div>
              <p style="margin: 0; color: #6b7280; font-size: 14px;">Enter this code in the BMO app</p>
            </div>
            
            <div class="warning">
              <strong>⚠️ Important:</strong>
              <ul style="margin: 10px 0 0 0;">
                <li>This code expires in 15 minutes</li>
                <li>Don't share this code with anyone</li>
                <li>If you didn't request this reset, you can safely ignore this email</li>
              </ul>
            </div>
            
            <p>If you have any questions or need help, feel free to contact our support team.</p>
            
            <p>Best regards,<br>The BMO Team</p>
          </div>
          
          <div class="footer">
            <p>This email was sent to ${email}</p>
            <p>BMO - Budget Money Online | Secure Financial Management</p>
          </div>
        </body>
        </html>
      `,
      text: `
BMO - Password Reset Code

Hi ${name || 'there'},

We received a request to reset your password for your BMO account.

Your 6-digit verification code: ${otp}

Enter this code in the BMO app to reset your password.

Important:
- This code expires in 15 minutes
- Don't share this code with anyone
- If you didn't request this reset, you can safely ignore this email

Best regards,
The BMO Team

This email was sent to ${email}
      `.trim(),
    }

    const info = await transporter.sendMail(mailOptions)

    if (process.env.NODE_ENV !== 'production') {
      console.log('Message sent: %s', info.messageId)
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info))
    }

    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('Email sending error:', error)
    return { success: false, error: error.message }
  }
}

// Generate a 6-digit OTP
export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Validate OTP format
export function isValidOtp(otp: string): boolean {
  return /^\d{6}$/.test(otp)
}

// Generate a secure invitation token
export function generateInvitationToken(): string {
  return Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2) + Date.now().toString(36)
} 