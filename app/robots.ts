import type { MetadataRoute } from 'next'

export const runtime = 'edge';
 
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: 'https://subtitle-editor.org/sitemap.xml',
  }
}