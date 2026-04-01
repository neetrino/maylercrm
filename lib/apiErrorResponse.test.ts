import { describe, expect, it, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { jsonError, zodErrorResponse } from './apiErrorResponse';

describe('jsonError', () => {
  it('includes error, requestId, and x-request-id header', async () => {
    const req = new NextRequest('http://localhost/api/test');
    const res = jsonError(req, 500, { error: 'Internal server error' });
    const body = (await res.json()) as { error: string; requestId: string };
    expect(body.error).toBe('Internal server error');
    expect(typeof body.requestId).toBe('string');
    expect(body.requestId.length).toBeGreaterThan(0);
    expect(res.headers.get('x-request-id')).toBe(body.requestId);
  });
});

describe('zodErrorResponse', () => {
  const prevEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = prevEnv;
  });

  it('omits Zod details in production', async () => {
    process.env.NODE_ENV = 'production';
    const req = new NextRequest('http://localhost/api/test');
    let zodError: z.ZodError;
    try {
      z.object({ name: z.string() }).parse({ name: 1 });
    } catch (e) {
      zodError = e as z.ZodError;
    }
    const res = zodErrorResponse(req, zodError!);
    const body = (await res.json()) as { error: string; details?: unknown };
    expect(res.status).toBe(400);
    expect(body.error).toBe('Validation error');
    expect(body.details).toBeUndefined();
  });

  it('includes Zod details in development', async () => {
    process.env.NODE_ENV = 'development';
    const req = new NextRequest('http://localhost/api/test');
    let zodError: z.ZodError;
    try {
      z.object({ name: z.string() }).parse({ name: 1 });
    } catch (e) {
      zodError = e as z.ZodError;
    }
    const res = zodErrorResponse(req, zodError!);
    const body = (await res.json()) as { error: string; details?: unknown };
    expect(res.status).toBe(400);
    expect(body.details).toBeDefined();
  });
});
