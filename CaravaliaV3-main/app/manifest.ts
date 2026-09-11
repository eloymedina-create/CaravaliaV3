import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Caravalia',
    short_name: 'Caravalia',
    description: 'Sistema de gestión y reservas premium para Caravalia',
    start_url: '/',
    display: 'standalone',
    background_color: '#F9F9F8',
    theme_color: '#003829',
    icons: [
      {
        src: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-67izduTedF5PTHkMbF222qhNGuht6b.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-67izduTedF5PTHkMbF222qhNGuht6b.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
