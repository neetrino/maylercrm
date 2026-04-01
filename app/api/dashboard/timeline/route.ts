import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { dashboardService } from '@/services/dashboard.service';
import { getCachedData, cacheKeys } from '@/lib/cache';
import { handleRouteError } from '@/lib/apiErrorResponse';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Кеш на 60 секунд - максимум 1 минута для актуальности данных
    const timeline = await getCachedData(
      cacheKeys.dashboard.timeline,
      () => dashboardService.getSalesTimeline(),
      60, // 60 секунд (1 минута)
      ['dashboard']
    );

    return NextResponse.json(timeline);
  } catch (error) {
    return handleRouteError(request, '[API] Error fetching sales timeline', error);
  }
}
