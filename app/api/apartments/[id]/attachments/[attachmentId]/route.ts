import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { attachmentService } from '@/services/attachment.service';

// Удаление вложения: только отвязка от квартиры (запись в БД). Файл в R2 не удаляется.
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; attachmentId: string }> }
) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { attachmentId: attachmentIdStr } = await params;
    const attachmentId = parseInt(attachmentIdStr);

    if (isNaN(attachmentId)) {
      return NextResponse.json(
        { error: 'Invalid attachment ID' },
        { status: 400 }
      );
    }

    const attachment = await attachmentService.getById(attachmentId);

    if (!attachment) {
      return NextResponse.json(
        { error: 'Attachment not found' },
        { status: 404 }
      );
    }

    // Только удаляем запись из БД — файл в R2 остаётся
    await attachmentService.delete(attachmentId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] Error deleting attachment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
