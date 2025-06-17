export async function GET() {
  try {
    // First check if DATABASE_URL exists
    if (!process.env.DATABASE_URL) {
      return Response.json({
        success: false,
        error: 'DATABASE_URL environment variable is not set'
      }, {
        status: 500
      });
    }

    // Try importing the function
    const { testDatabaseConnection } = await import('@/lib/db');

    // Call the test function
    const result = await testDatabaseConnection();

    return Response.json(result, {
      status: result.success ? 200 : 500
    });
  } catch (error) {
    console.error('API Route Error:', error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, {
      status: 500
    });
  }
}