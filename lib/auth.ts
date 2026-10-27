import 'dotenv/config'
import { betterAuth } from 'better-auth'
import { prismaAdapter } from '@better-auth/prisma-adapter'
import { createAuthMiddleware, APIError } from 'better-auth/api'
import { prisma } from './db'
import { sendLocalMail, welcomeVerifiedUser } from './mail'
import { createHmac } from 'node:crypto'
import { consumeAccountLimit } from './throttle'

const baseURL = process.env.BETTER_AUTH_URL
if (!baseURL || !['localhost', '127.0.0.1'].includes(new URL(baseURL).hostname)) {
  throw new Error('This foundation must run on its explicitly configured local origin until hosted readiness is reviewed')
}
if (!process.env.BETTER_AUTH_SECRET || process.env.BETTER_AUTH_SECRET.length < 32) throw new Error('A generated authentication secret is required')

export const googleConfigured = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)

export const auth = betterAuth({
  appName: 'Bimo', baseURL, secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: [baseURL],
  database: prismaAdapter(prisma, { provider: 'postgresql', transaction: true }),
  advanced: { cookiePrefix: 'bimo-foundation', ipAddress: { ipAddressHeaders: ['x-vercel-forwarded-for', 'x-forwarded-for'] } },
  session: { expiresIn: 60 * 60 * 24 * 7, updateAge: 60 * 60 * 24, freshAge: 60 * 15, cookieCache: { enabled: false } },
  emailAndPassword: {
    enabled: true, requireEmailVerification: true, minPasswordLength: 12, maxPasswordLength: 128,
    resetPasswordTokenExpiresIn: 3600, revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => { await sendLocalMail(user.email, 'Reset your Bimo password', `Reset your password: ${url}\nThis link expires in one hour.`) },
  },
  emailVerification: {
    sendOnSignUp: true, sendOnSignIn: true, autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => { await sendLocalMail(user.email, 'Verify your Bimo email', `Verify your email: ${url}`) },
  },
  user: {
    changeEmail: { enabled: true, sendChangeEmailConfirmation: async ({ user, url }) => { await sendLocalMail(user.email, 'Approve your Bimo email change', `Approve this email change: ${url}`) } },
    deleteUser: { enabled: false },
  },
  account: { encryptOAuthTokens: true, accountLinking: { enabled: true, disableImplicitLinking: true, allowDifferentEmails: false, allowUnlinkingAll: false } },
  socialProviders: googleConfigured ? { google: { clientId: process.env.GOOGLE_CLIENT_ID!, clientSecret: process.env.GOOGLE_CLIENT_SECRET!, scope: ['openid', 'email', 'profile'] } } : {},
  rateLimit: { enabled: true, storage: 'database', window: 60, max: 100, customRules: { '/sign-in/email': { window: 60, max: 5 }, '/sign-up/email': { window: 60, max: 3 }, '/request-password-reset': { window: 60, max: 3 }, '/send-verification-email': { window: 60, max: 3 } } },
  hooks: {
    before: createAuthMiddleware(async ctx => {
      if (['/sign-in/email', '/request-password-reset', '/send-verification-email'].includes(ctx.path) && typeof ctx.body?.email === 'string') {
        const key = createHmac('sha256', process.env.BETTER_AUTH_SECRET!).update(ctx.body.email.trim().toLowerCase()).digest('hex')
        try { await consumeAccountLimit(`auth:${ctx.path}`, key, ctx.path === '/sign-in/email' ? 15 : 5) } catch { throw new APIError('TOO_MANY_REQUESTS', { message: 'Too many attempts. Please wait a minute.' }) }
      }
      if (['/change-email', '/change-password', '/link-social', '/unlink-account', '/set-password'].includes(ctx.path)) {
        const session = await auth.api.getSession({ headers: ctx.headers ?? new Headers() })
        if (!session?.user.emailVerified) throw new APIError('UNAUTHORIZED', { message: 'Verify your identity first' })
        if (Date.now() - new Date(session.session.createdAt).getTime() > 15 * 60000) throw new APIError('FORBIDDEN', { message: 'Sign in again before changing account security' })
      }
    }),
    after: createAuthMiddleware(async ctx => {
      const session = ctx.context.newSession
      if (session?.user.emailVerified) {
        try { await welcomeVerifiedUser(session.user) } catch { /* Welcome delivery must not block authentication. */ }
      }
    }),
  },
  logger: { disabled: true },
})
