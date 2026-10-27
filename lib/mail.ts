import nodemailer from 'nodemailer'
import { prisma } from './db'

export async function sendLocalMail(to: string, subject: string, text: string) {
  if (process.env.MAIL_MODE !== 'local' || !['localhost', '127.0.0.1'].includes(process.env.SMTP_HOST ?? '')) {
    throw new Error('Real email delivery is not enabled in this development version')
  }
  const transport = nodemailer.createTransport({ host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT ?? 1025), secure: false, connectionTimeout: 5000, socketTimeout: 5000 })
  await transport.sendMail({ from: process.env.SMTP_FROM ?? 'Bimo <bimo@example.invalid>', to, subject, text })
}

export async function welcomeVerifiedUser(user: { id: string; email: string; emailVerified: boolean }) {
  if (!user.emailVerified) return
  await prisma.emailOutbox.upsert({
    where: { eventKey: `welcome:${user.id}` },
    create: { eventKey: `welcome:${user.id}`, userId: user.id },
    update: {},
  })
  await deliverWelcome(user.id)
}

export async function deliverWelcome(userId?: string) {
  const due = await prisma.emailOutbox.findMany({
    where: { userId, status: 'PENDING', attempts: { lt: 3 }, nextAttemptAt: { lte: new Date() } },
    include: { user: { select: { email: true, emailVerified: true } } }, take: 10,
  })
  for (const item of due) {
    // shortcut: interrupted SMTP claims need manual review; add provider reconciliation before hosted delivery.
    const claimed = await prisma.emailOutbox.updateMany({ where: { id: item.id, status: 'PENDING', attempts: item.attempts }, data: { status: 'SENDING', attempts: { increment: 1 } } })
    if (!claimed.count) continue
    try {
      if (!item.user.emailVerified) throw new Error('Recipient is not verified')
      await sendLocalMail(item.user.email, 'Welcome to Bimo', 'Your account is ready. Create a private budget when you are ready. Gmail access is optional and is not connected by signing in.')
      await prisma.emailOutbox.update({ where: { id: item.id }, data: { status: 'SENT', sentAt: new Date() } })
    } catch {
      await prisma.emailOutbox.update({ where: { id: item.id }, data: { status: item.attempts + 1 >= 3 ? 'FAILED' : 'PENDING', nextAttemptAt: new Date(Date.now() + 60000) } })
    }
  }
}
