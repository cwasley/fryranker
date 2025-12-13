'use client'

import { inject } from '@vercel/analytics'
import { useEffect } from 'react'

export function Analytics() {
  useEffect(() => {
    inject()
  }, [])

  return null
}
