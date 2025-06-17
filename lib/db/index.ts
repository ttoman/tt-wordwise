import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client);

// Simple test function to verify connection
export async function testDatabaseConnection() {
  try {
    // Simple SELECT 1 query to test connection
    const result = await db.execute('select 1 as test');
    return { success: true, result: result };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}