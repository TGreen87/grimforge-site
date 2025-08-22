/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizeCss: true,
  },
  images: {
    domains: ['shbalyvvquvtvnkrsxtx.supabase.co'],
  },
}

export default nextConfig