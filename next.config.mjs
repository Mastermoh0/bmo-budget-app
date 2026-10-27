/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  logging: { incomingRequests: false },
  serverExternalPackages: ['pg', 'nodemailer'],
}

export default nextConfig
