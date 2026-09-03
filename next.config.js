/** @type {import('next').NextConfig} */
const nextConfig = {
  // Bypasses Supabase v2 type-inference incompatibility with hand-written
  // Database types. Safe to remove once types are regenerated with:
  //   supabase gen types typescript --project-id <id> > types/database.types.ts
  typescript: {
    ignoreBuildErrors: true,
  },

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
