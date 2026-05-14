import { NextResponse } from 'next/server';

const HEALTH_SERVICE_NAME = 'mylercrm';

type HealthPayload = {
  status: 'ok';
  service: typeof HEALTH_SERVICE_NAME;
  timestamp: string;
};

/**
 * Lightweight public health check for uptime monitoring (no auth, no DB).
 */
export async function GET(): Promise<NextResponse<HealthPayload>> {
  const body: HealthPayload = {
    status: 'ok',
    service: HEALTH_SERVICE_NAME,
    timestamp: new Date().toISOString(),
  };
  return NextResponse.json(body, { status: 200 });
}
