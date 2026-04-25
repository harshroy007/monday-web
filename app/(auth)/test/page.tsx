'use client';

import { useState } from 'react';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import axios from 'axios';

const API_URL = 'https://worker-production-46ee.up.railway.app';
const TEST_KEY = 'harsh-priya-7700';

interface TestResult {
  endpoint: string;
  status: 'pending' | 'success' | 'error';
  response?: any;
  error?: string;
  time?: number;
}

export default function TestPage() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedResult, setSelectedResult] = useState<TestResult | null>(null);

  const tests = [
    { name: 'Dashboard', method: 'GET', path: '/api/mobile/dashboard' },
    { name: 'Profile', method: 'GET', path: '/api/mobile/profile' },
    { name: 'Wiki', method: 'GET', path: '/api/mobile/wiki' },
    { name: 'Feed', method: 'GET', path: '/api/mobile/feed' },
    { name: 'Brief', method: 'GET', path: '/api/mobile/brief' },
    { name: 'Guard Full', method: 'GET', path: '/api/mobile/guard/full' },
    { name: 'Messages', method: 'GET', path: '/api/mobile/messages' },
    { name: 'Actions', method: 'GET', path: '/api/mobile/actions' },
    { name: 'Changelog', method: 'GET', path: '/api/mobile/changelog' },
    { name: 'Chat', method: 'POST', path: '/api/mobile/chat', body: { message: 'What is my biggest challenge?' } },
    { name: 'Remember', method: 'POST', path: '/api/mobile/remember', body: { fact: 'Test fact from QA' } },
  ];

  const runTest = async (test: any) => {
    const resultIndex = results.findIndex(r => r.endpoint === test.name);
    const newResult: TestResult = {
      endpoint: test.name,
      status: 'pending',
    };

    if (resultIndex >= 0) {
      results[resultIndex] = newResult;
    } else {
      results.push(newResult);
    }
    setResults([...results]);

    try {
      const start = Date.now();
      let response;

      if (test.method === 'GET') {
        response = await axios.get(`${API_URL}${test.path}`, {
          headers: { 'X-Jarvis-Key': TEST_KEY },
        });
      } else {
        response = await axios.post(`${API_URL}${test.path}`, test.body, {
          headers: { 'X-Jarvis-Key': TEST_KEY },
        });
      }

      const time = Date.now() - start;
      newResult.status = 'success';
      newResult.response = response.data;
      newResult.time = time;
    } catch (err: any) {
      newResult.status = 'error';
      newResult.error = err.message || 'Unknown error';
    }

    if (resultIndex >= 0) {
      results[resultIndex] = newResult;
    } else {
      results.push(newResult);
    }
    setResults([...results]);
  };

  const runAllTests = async () => {
    setLoading(true);
    setResults([]);

    for (const test of tests) {
      await runTest(test);
      await new Promise(resolve => setTimeout(resolve, 100)); // Slight delay between tests
    }

    setLoading(false);
  };

  const passCount = results.filter(r => r.status === 'success').length;
  const failCount = results.filter(r => r.status === 'error').length;

  return (
    <div className="min-h-screen bg-[var(--color-bg)] p-4">
      <div className="max-w-6xl mx-auto">
        <Card className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-[var(--color-text)] mb-2">Monday Platform QA</h1>
              <p className="text-[var(--color-muted)]">Test all endpoints without registration</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-[var(--color-muted)] mb-2">
                <span className="text-green-400 font-bold">{passCount}</span> passed
                {' / '}
                <span className="text-red-400 font-bold">{failCount}</span> failed
              </div>
              <Button onClick={runAllTests} disabled={loading} className="w-full">
                {loading ? 'Running Tests...' : 'Run All Tests'}
              </Button>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Test List */}
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">Endpoints</h2>
            {tests.map((test, idx) => {
              const result = results.find(r => r.endpoint === test.name);
              const statusColor =
                result?.status === 'success'
                  ? 'bg-green-500/10 border-green-500/30 text-green-400'
                  : result?.status === 'error'
                  ? 'bg-red-500/10 border-red-500/30 text-red-400'
                  : 'bg-[var(--color-surface)] border-[var(--color-border)]';

              return (
                <button
                  key={idx}
                  onClick={() => {
                    runTest(test);
                    setSelectedResult(result || null);
                  }}
                  className={`w-full p-3 rounded-lg border text-left transition-all ${statusColor} hover:opacity-80`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-[var(--color-text)]">{test.name}</div>
                      <div className="text-xs text-[var(--color-muted)]">{test.method} {test.path}</div>
                    </div>
                    <div className="text-xs">
                      {result?.status === 'success' && '✅'}
                      {result?.status === 'error' && '❌'}
                      {result?.status === 'pending' && '⏳'}
                      {!result && '○'}
                    </div>
                  </div>
                  {result?.time && <div className="text-xs text-[var(--color-dim)] mt-1">{result.time}ms</div>}
                </button>
              );
            })}
          </div>

          {/* Response Display */}
          <div>
            <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">Response</h2>
            <Card className="bg-[var(--color-surface)] p-4 min-h-[600px] max-h-[600px] overflow-auto font-mono text-sm">
              {selectedResult ? (
                <>
                  <div className="mb-2">
                    <span className="text-[var(--color-muted)]">Endpoint:</span> {selectedResult.endpoint}
                  </div>
                  <div className="mb-4">
                    <span className={selectedResult.status === 'success' ? 'text-green-400' : 'text-red-400'}>
                      Status: {selectedResult.status?.toUpperCase()}
                    </span>
                  </div>
                  {selectedResult.time && (
                    <div className="mb-4 text-[var(--color-muted)]">Response Time: {selectedResult.time}ms</div>
                  )}
                  <div className="border-t border-[var(--color-border)] pt-4">
                    {selectedResult.status === 'success' ? (
                      <pre className="text-[var(--color-text)] whitespace-pre-wrap break-words">
                        {JSON.stringify(selectedResult.response, null, 2)}
                      </pre>
                    ) : (
                      <pre className="text-red-400 whitespace-pre-wrap break-words">{selectedResult.error}</pre>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-[var(--color-muted)] flex items-center justify-center h-full">
                  Click a test to view response
                </div>
              )}
            </Card>
          </div>
        </div>

        {/* Summary */}
        {results.length > 0 && (
          <Card className="mt-6">
            <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">Summary</h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-[var(--color-muted)]">Total Tests</div>
                <div className="text-2xl font-bold text-[var(--color-text)]">{results.length}</div>
              </div>
              <div>
                <div className="text-sm text-[var(--color-muted)]">Passed</div>
                <div className="text-2xl font-bold text-green-400">{passCount}</div>
              </div>
              <div>
                <div className="text-sm text-[var(--color-muted)]">Failed</div>
                <div className="text-2xl font-bold text-red-400">{failCount}</div>
              </div>
            </div>
            {failCount === 0 && results.length === tests.length && (
              <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400">
                ✅ All tests passed! Platform is ready for production.
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
