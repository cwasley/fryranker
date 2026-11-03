import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  async redirects() {
    return [{ source: '/fries', destination: '/', permanent: true }]
  },
}

export default nextConfig
