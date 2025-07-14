import type { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'AARUSDB',
    short_name: 'AARUSDB',
    description: 'Anti Armed Robbery Unit Suspect Database',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#000000',
    icons: [
      {
        src: '/aaru.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/aaru.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}