'use client';

import { useEffect, useState } from 'react';

interface DatabaseTestResult {
  success: boolean;
  result?: any;
  error?: string;
}

export function DatabaseTest() {
  const [testResult, setTestResult] = useState<DatabaseTestResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [responseText, setResponseText] = useState<string>('');

  useEffect(() => {
    async function testConnection() {
      try {
        const response = await fetch('/api/test-db');
        const text = await response.text();
        setResponseText(text);

        try {
          const result = JSON.parse(text);
          setTestResult(result);
        } catch (parseError) {
          setTestResult({
            success: false,
            error: `Failed to parse response as JSON. Response was: ${text.substring(0, 200)}...`
          });
        }
      } catch (error) {
        setTestResult({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to test connection'
        });
      } finally {
        setLoading(false);
      }
    }

    testConnection();
  }, []);

  if (loading) {
    return (
      <div className="border rounded-lg p-4 bg-muted">
        <h3 className="font-semibold mb-2">Database Connection Test</h3>
        <p className="text-sm text-muted-foreground">Testing connection...</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-4 bg-muted">
      <h3 className="font-semibold mb-2">Database Connection Test</h3>
      {testResult?.success ? (
        <div className="text-sm">
          <p className="text-green-600 dark:text-green-400 font-medium mb-1">✅ Database connected successfully!</p>
          <p className="text-muted-foreground">
            Test result: {JSON.stringify(testResult.result)}
          </p>
        </div>
      ) : (
        <div className="text-sm">
          <p className="text-red-600 dark:text-red-400 font-medium mb-1">❌ Database connection failed</p>
          <p className="text-muted-foreground break-words">
            Error: {testResult?.error || 'Unknown error'}
          </p>
        </div>
      )}
    </div>
  );
}