import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { apartmentService } from '@/services/apartment.service';
import { updateApartmentStatusSchema } from '@/lib/validations';
import { invalidateCache, cacheKeys, cacheTags } from '@/lib/cache';
import { z } from 'zod';

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

    const body = await request.json();
    const validatedData = updateApartmentStatusSchema.parse(body);

    // Преобразование данных для обновления
    const updateData: any = {
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

    // Используем метод update для обновления всех полей
    await apartmentService.update(id, updateData);
    
    // Получаем обновленную квартиру
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
      updated_at: apartment.updatedAt.toISOString(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid status value',
          details:
            'Status must be one of: upcoming, available, reserved, sold',
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
