import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { apartmentService } from '@/services/apartment.service';
import { invalidateCache, cacheKeys, cacheTags } from '@/lib/cache';
import { handleRouteError, jsonError } from '@/lib/apiErrorResponse';
import { z } from 'zod';

const bulkUpdateSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.number().int().positive(),
        apartmentNo: z.string().min(1).max(50).optional(),
        apartmentName: z
          .string()
          .max(255)
          .optional()
          .nullable()
          .or(z.literal('').transform(() => null)),
      })
    )
    .min(1, 'At least one item required')
    .max(500, 'Maximum 500 items per request'),
});

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = bulkUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError(request, 400, {
        error: 'Validation error',
        details: parsed.error.errors,
      });
    }

    const results = await apartmentService.bulkUpdate(parsed.data.items);

    invalidateCache(
      [cacheKeys.dashboard.summary, cacheKeys.dashboard.financial],
      [cacheTags.apartmentsList]
    );

    return NextResponse.json({ updated: results.length, items: results });
  } catch (error) {
    return handleRouteError(request, '[API] Error bulk updating apartments', error);
  }
}
