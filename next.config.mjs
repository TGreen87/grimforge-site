/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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