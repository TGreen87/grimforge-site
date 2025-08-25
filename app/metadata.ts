import type { Metadata } from 'next'
import { generateSiteMetadata } from '@/lib/seo/metadata'

export const metadata: Metadata = generateSiteMetadata()