/** @type {import('next').NextConfig} */
const nextConfig = {
  // Internationalization — EN + ES
  // Using next-intl with App Router
  experimental: {
    serverComponentsExternalPackages: ['stripe'],
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ]
  },

  // Redirects
  async redirects() {
    return [
      {
        source: '/dashboard',
        destination: '/study',
        permanent: false,
      },
    ]
  },
}

module.exports = nextConfig
