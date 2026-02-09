import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { attachmentService } from '@/services/attachment.service';
import { deleteObject, getKeyFromFileUrl, isR2Url } from '@/lib/r2';

export async function DELETE(
  request: NextRequest,
  {
    params,
  }: { params: { id: string; attachmentId: string } }
) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const attachmentId = parseInt(params.attachmentId);

    if (isNaN(attachmentId)) {
      return NextResponse.json(
        { error: 'Invalid attachment ID' },
        { status: 400 }
      );
    }

    // Получаем информацию о файле перед удалением
    const attachment = await attachmentService.getById(attachmentId);

    if (!attachment) {
      return NextResponse.json(
        { error: 'Attachment not found' },
        { status: 404 }
      );
    }

    // Удаляем файл из R2 (если это наш R2 URL)
    const r2Key = getKeyFromFileUrl(attachment.fileUrl);
    if (isR2Url(attachment.fileUrl) && r2Key) {
      try {
        await deleteObject(r2Key);
      } catch (error) {
        console.error('[API] Error deleting from R2:', error);
        // Продолжаем удаление записи из БД даже если объект не найден
      }
    } else if (!attachment.fileUrl.startsWith('/')) {
      console.warn('[API] Non-R2 URL, skipping object deletion:', attachment.fileUrl);
    }

    // Удаляем запись из БД
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
