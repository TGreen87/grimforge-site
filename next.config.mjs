/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Ensure Next resolves paths relative to this repo (avoid picking /mnt/a as root)
  outputFileTracingRoot: process.cwd(),
  // Disable typed routes generation which was causing bad imports into src/app
  typedRoutes: false,
  experimental: {
    optimizeCss: true,
  },
  images: {
    domains: ['shbalyvvquvtvnkrsxtx.supabase.co'],
  },
  webpack: (config, { isServer }) => {
    // Exclude old React Router files from the build
    config.module.rules.push({
      test: /src\/(pages|components|App\.tsx|main\.tsx)/,
      use: 'ignore-loader'
    })
    
    return config
  },
}

export default nextConfig