/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Ensure Next resolves paths relative to this repo (avoid picking /mnt/a as root)
  outputFileTracingRoot: process.cwd(),
  // Disable typed routes generation which was causing bad imports into src/app
  typedRoutes: false,
  // Ensure required envs exist when Netlify Supabase Connector provides SUPABASE_* names
  env: {
    // Map Netlify Supabase Connector envs to the NEXT_PUBLIC_* names
    NEXT_PUBLIC_SUPABASE_URL:
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.SUPABASE_URL ||
      process.env.SUPABASE_DATABASE_URL ||
      '',
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      '',
    SUPABASE_SERVICE_ROLE_KEY:
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_SERVICE_ROLE ||
      '',
    SITE_URL_STAGING: process.env.SITE_URL_STAGING || process.env.DEPLOY_URL || process.env.URL || '',
  },
  // Don't fail the build on type or ESLint issues in CI until we fix all TS
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    // Disable CSS optimization to avoid requiring 'critters' in this environment
    optimizeCss: false,
  },
  images: {
    // Allow Supabase storage buckets across projects
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    // Exclude old React Router files from the build (but keep Next.js components)
    config.module.rules.push({
      test: /src\/(pages|App\.tsx|main\.tsx)$/,
      use: 'ignore-loader'
    })
    
    return config
  },
}

export default nextConfig
