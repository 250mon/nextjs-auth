import { Pool } from "pg";

// Environment detection
const isDevelopment = process.env.NODE_ENV === "development";
const isProduction = process.env.NODE_ENV === "production";

// SSL configuration based on environment
const sslConfig = isProduction
  ? { rejectUnauthorized: false } // Enable SSL for production but don't reject self-signed certs
  : false; // Disable SSL for local development

// Log database connection info in development
if (isDevelopment && process.env.DEBUG) {
  console.log("🔗 Database connection info:", {
    url: process.env.POSTGRES_URL?.replace(/:[^:@]*@/, ":***@"), // Hide password in logs
    environment: process.env.NODE_ENV,
    ssl: sslConfig,
  });
}

// Create a connection pool
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: sslConfig,
  connectionTimeoutMillis: 5000,
  query_timeout: 5000,
  // Additional pool configuration for different environments
  max: isProduction ? 20 : 10, // More connections in production
  idleTimeoutMillis: isProduction ? 30000 : 10000,
});

// Handle pool errors
pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
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
