import { Pool } from 'pg';

// Environment detection
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

// SSL configuration
// Can be overridden via DATABASE_SSL environment variable:
// - "true" or "require" = enable SSL
// - "false" or "disable" = disable SSL
// - "allow" = try SSL, fallback to non-SSL if not supported
const databaseSsl = process.env.DATABASE_SSL?.toLowerCase();

let sslConfig: boolean | { rejectUnauthorized: boolean } = false;

if (databaseSsl === 'true' || databaseSsl === 'require') {
  sslConfig = { rejectUnauthorized: false }; // Enable SSL, don't reject self-signed certs
} else if (databaseSsl === 'false' || databaseSsl === 'disable') {
  sslConfig = false; // Explicitly disable SSL
} else if (databaseSsl === 'allow') {
  // Try SSL but allow fallback - handled by connection string parameters
  sslConfig = false; // Let the connection string handle it
} else {
  // Default behavior: SSL in production, no SSL in development
  sslConfig = isProduction 
    ? { rejectUnauthorized: false } // Enable SSL for production but don't reject self-signed certs
    : false; // Disable SSL for local development
}

// Parse connection string to check for SSL parameters
const connectionString = process.env.POSTGRES_URL || '';
const urlHasSslParam = connectionString.includes('sslmode=') || connectionString.includes('ssl=');

// If connection string has SSL parameters, they take precedence
// Otherwise use our sslConfig
const finalSslConfig = urlHasSslParam ? undefined : sslConfig;

// Log database connection info in development
if (isDevelopment && process.env.DEBUG) {
  console.log('🔗 Database connection info:', {
    url: connectionString.replace(/:[^:@]*@/, ':***@'), // Hide password in logs
    environment: process.env.NODE_ENV,
    ssl: finalSslConfig,
    sslFromEnv: databaseSsl || 'default',
    urlHasSslParam: urlHasSslParam
  });
}

// Create a connection pool
const pool = new Pool({
  connectionString: connectionString,
  ssl: finalSslConfig,
  connectionTimeoutMillis: 5000,
  query_timeout: 5000,
  // Additional pool configuration for different environments
  max: isProduction ? 20 : 10, // More connections in production
  idleTimeoutMillis: isProduction ? 30000 : 10000,
});

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

// Export a function to get a client from the pool
export async function getClient() {
  const client = await pool.connect();
  return client;
}

// Export a function to run a query
export async function query(text: string, params?: unknown[]) {
  const client = await pool.connect();
  try {
    return await client.query(text, params);
  } finally {
    client.release();
  }
}

// Export the pool for transactions
export { pool }; 