import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: '/fries', destination: '/', permanent: true },
      { source: '/admin', destination: '/admin/spots', permanent: false },
    ]
  },
}

export default nextConfig
