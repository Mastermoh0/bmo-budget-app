import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { ConditionalLayout } from '@/components/conditional-layout'
import { OnboardingCheck } from '@/components/onboarding/onboarding-check'
import { ForceSignInRedirect } from '@/components/force-signin-redirect'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'BMO - Budget Money Online',
  description: 'BMO Budget App - Your personal finance manager with real-time budget tracking',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'BMO Budget',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: '/icon-192x192.png',
    apple: '/icon-192x192.png',
  },
}

export const viewport = {
  themeColor: '#005A8B',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="BMO Budget" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
      </head>
      <body className={inter.className}>
        <Providers>
          <ForceSignInRedirect>
            <OnboardingCheck />
            <ConditionalLayout>
              {children}
            </ConditionalLayout>
          </ForceSignInRedirect>
        </Providers>
      </body>
    </html>
  )
} 