import type { NextConfig } from "next";

// Read basePath from environment variable
// Note: .env.local is automatically loaded by Next.js
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';

// Log basePath configuration at startup
const nodeEnv = process.env.NODE_ENV || 'development';
const port = process.env.PORT || 3000;

// Parse database connection info
const postgresUrl = process.env.POSTGRES_URL || '(not set)';
const databaseSsl = process.env.DATABASE_SSL || 'default';
let dbInfo = 'Not configured';

if (postgresUrl !== '(not set)') {
  try {
    // Parse connection string to extract info (hide password)
    const url = new URL(postgresUrl.replace(/^postgresql:\/\//, 'http://'));
    const host = url.hostname;
    const dbPort = url.port || '5432';
    const database = url.pathname.replace('/', '') || 'default';
    const user = url.username || 'postgres';
    
    dbInfo = `${user}@${host}:${dbPort}/${database}`;
  } catch (e) {
    // If URL parsing fails, show masked version
    dbInfo = postgresUrl.replace(/:[^:@]*@/, ':***@');
  }
}

console.log('='.repeat(60));
console.log('🚀 Starting Next.js Inventory Application');
console.log('='.repeat(60));
console.log(`📦 Environment: ${nodeEnv}`);
console.log(`📍 Base Path: ${BASE_PATH || '(not set)'}`);
console.log(`🌐 Port: ${port}`);
console.log(`🗄️  Database: ${dbInfo}`);
console.log(`🔒 Database SSL: ${databaseSsl}`);
console.log('='.repeat(60));
console.log('');

const nextConfig: NextConfig = {
  output: 'standalone',

  // Ensure static files are served in production
  trailingSlash: false,
  
  // Mount the app at the base path (only if BASE_PATH is set)
  ...(BASE_PATH && { basePath: BASE_PATH }),

  // Image configuration
  // Disable image optimization when basePath is set to avoid issues with image optimization endpoint
  // Also disable in standalone/Docker builds
  images: {
    unoptimized: !!BASE_PATH || process.env.OUTPUT === 'standalone' || process.env.DISABLE_IMAGE_OPTIMIZATION === 'true',
  },

  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't resolve 'fs' module on the client to prevent this error on build --> Error: Can't resolve 'fs'
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        dns: false,
        child_process: false,
        pg: false,
      };
    }
    return config;
  },
};

export default nextConfig;
