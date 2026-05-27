import type { NextConfig } from 'next';

const config: NextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@equmanager/auth',
    '@equmanager/database',
    '@equmanager/domain',
  ],
  // typedRoutes desactivado: con el nuevo refactor multi-rol los redirects
  // y links dinámicos no encajan en el árbol estático y bloquean el build.
  experimental: {
    typedRoutes: false,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'picsum.photos' },
    ],
  },
};

export default config;
