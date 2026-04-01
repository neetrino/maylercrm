import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { apartmentService } from '@/services/apartment.service';
import { updateApartmentStatusSchema } from '@/lib/validations';
import { invalidateCache, cacheKeys, cacheTags } from '@/lib/cache';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Проверка сессии для внутреннего использования
    const session = await auth();
    
    // Если нет сессии, проверяем Bearer Token для внешнего API
    if (!session) {
      const authHeader = request.headers.get('authorization');
      const apiToken = process.env.API_TOKEN;

      if (!authHeader || !apiToken) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const token = authHeader.replace('Bearer ', '');
      if (token !== apiToken) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const { id: idParam } = await params;
    const id = parseInt(idParam);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid apartment ID' },
        { status: 400 }
      );
    }

    /** Keys accepted from JSON body or query string (external integrations often use ?status=...&...) */
    const STATUS_QUERY_KEYS = [
      'status',
      'deal_date',
      'ownership_name',
      'email',
      'passport_tax_no',
      'phone',
      'sales_type',
      'price_sqm',
      'total_paid',
      'buyer_address',
      'other_buyers',
      'payment_schedule',
      'deal_description',
    ] as const;

    let jsonBody: Record<string, unknown> = {};
    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      try {
        const text = await request.text();
        if (text.trim()) {
          jsonBody = JSON.parse(text) as Record<string, unknown>;
        }
      } catch {
        return NextResponse.json(
          { error: 'Invalid JSON body' },
          { status: 400 }
        );
      }
    } else {
      try {
        const clone = request.clone();
        const text = await clone.text();
        if (text.trim()) {
          try {
            jsonBody = JSON.parse(text) as Record<string, unknown>;
          } catch {
            /* ignore non-JSON body */
          }
        }
      } catch {
        /* no body */
      }
    }

    const merged: Record<string, unknown> = { ...jsonBody };
    const sp = request.nextUrl.searchParams;
    for (const key of STATUS_QUERY_KEYS) {
      const q = sp.get(key);
      if (q !== null && q !== '' && merged[key] === undefined) {
        merged[key] = q;
      }
    }

    const validatedData = updateApartmentStatusSchema.parse(merged);

    // Преобразование данных для обновления
    const updateData: Prisma.ApartmentUpdateInput = {
      status: validatedData.status,
    };

    // Добавляем дополнительные поля, если они предоставлены
    if (validatedData.deal_date !== undefined) {
      updateData.dealDate = validatedData.deal_date
        ? new Date(validatedData.deal_date)
        : null;
    }
    if (validatedData.ownership_name !== undefined) {
      updateData.ownershipName = validatedData.ownership_name;
    }
    if (validatedData.email !== undefined) {
      updateData.email = validatedData.email;
    }
    if (validatedData.passport_tax_no !== undefined) {
      updateData.passportTaxNo = validatedData.passport_tax_no;
    }
    if (validatedData.phone !== undefined) {
      updateData.phone = validatedData.phone;
    }
    if (validatedData.sales_type !== undefined) {
      updateData.salesType = validatedData.sales_type;
    }
    if (validatedData.price_sqm !== undefined) {
      updateData.priceSqm = validatedData.price_sqm;
    }
    if (validatedData.total_paid !== undefined) {
      updateData.totalPaid = validatedData.total_paid;
    }
    if (validatedData.buyer_address !== undefined) {
      updateData.buyerAddress = validatedData.buyer_address;
    }
    if (validatedData.other_buyers !== undefined) {
      updateData.otherBuyers = validatedData.other_buyers;
    }
    if (validatedData.payment_schedule !== undefined) {
      updateData.paymentSchedule = validatedData.payment_schedule;
    }
    if (validatedData.deal_description !== undefined) {
      updateData.dealDescription = validatedData.deal_description;
    }

    try {
      await apartmentService.update(id, updateData);
    } catch (e: unknown) {
      const code =
        e && typeof e === 'object' && 'code' in e ? String((e as { code: string }).code) : '';
      if (code === 'P2025') {
        return NextResponse.json({ error: 'Apartment not found' }, { status: 404 });
      }
      throw e;
    }

    const apartment = await apartmentService.getById(id);
    
    if (!apartment) {
      return NextResponse.json(
        { error: 'Apartment not found' },
        { status: 404 }
      );
    }

    // Инвалидируем кеш dashboard и списка квартир при изменении статуса
    invalidateCache(
      [
        cacheKeys.dashboard.summary,
        cacheKeys.dashboard.financial,
        cacheKeys.dashboard.timeline,
      ],
      [cacheTags.apartmentsList]
    );

    return NextResponse.json({
      id: apartment.id,
      status: apartment.status.toLowerCase(),
      deal_date: apartment.dealDate ? apartment.dealDate.toISOString().split('T')[0] : null,
      ownership_name: apartment.ownershipName,
      email: apartment.email,
      passport_tax_no: apartment.passportTaxNo,
      phone: apartment.phone,
      sales_type: apartment.salesType?.toLowerCase() ?? null,
      price_sqm: apartment.priceSqm != null ? Number(apartment.priceSqm) : null,
      total_paid: apartment.totalPaid != null ? Number(apartment.totalPaid) : null,
      buyer_address: apartment.buyerAddress,
      other_buyers: apartment.otherBuyers,
      payment_schedule: apartment.paymentSchedule,
      deal_description: apartment.dealDescription,
      updated_at: apartment.updatedAt.toISOString(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const flat = error.flatten();
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: flat.fieldErrors,
          message:
            'Send status in JSON body or as query param. Status: upcoming | available | reserved | sold (case insensitive). Example: PUT with body {"status":"available"} or ?status=available',
        },
        { status: 400 }
      );
    }

    console.error('[API] Error updating apartment status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
