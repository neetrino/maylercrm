/**
 * Заполняет тестовые вложения (медиа) для всех квартир из файлов в R2.
 * URL собираются из R2_PUBLIC_URL и структуры папки import на R2.
 *
 * - Renders: 6 фото (Render2–Render7) — во все квартиры как IMAGE.
 * - Type_floorplans/2D: по одному PDF и PNG на тип квартиры (1–21) — как FLOORPLAN.
 * - Matter Link: по одному 3D-линку на тип (1–21) — проставляется в поле matterLink квартиры.
 *
 * Запуск: npx dotenv -e .env.local -- tsx scripts/seed-attachments-from-r2.ts
 * или: R2_PUBLIC_URL="https://pub-xxx.r2.dev" npx tsx scripts/seed-attachments-from-r2.ts
 */

import 'dotenv/config';
import { prisma } from '../lib/prisma';
import { FileType } from '@prisma/client';

const R2_BASE = process.env.R2_PUBLIC_URL?.replace(/\/$/, '');
if (!R2_BASE) {
  console.error('R2_PUBLIC_URL must be set (e.g. in .env.local)');
  process.exit(1);
}

const RENDERS_KEY_PREFIX = 'import/Type_floorplans/Renders/';
const RENDER_FILES = ['Render2.jpeg', 'Render3.jpeg', 'Render4.jpeg', 'Render5.jpeg', 'Render6.jpeg', 'Render7.jpeg'];

const FLOORPLAN_PDF_PREFIX = 'import/Type_floorplans/2D/PDF/';
const FLOORPLAN_PNG_PREFIX = 'import/Type_floorplans/2D/PNG/';

const MATTER_LINK_BASE = 'https://3d.evolver.company/Appartment';
function matterLinkForType(typeNum: number): string {
  return `${MATTER_LINK_BASE}${Math.max(1, Math.min(21, typeNum))}`;
}

function url(key: string): string {
  return `${R2_BASE}/${key}`;
}

async function main() {
  console.log('📎 Seed attachments from R2');
  console.log('   R2 base:', R2_BASE);

  const apartments = await prisma.apartment.findMany({
    select: { id: true, apartmentType: true },
    orderBy: { id: 'asc' },
  });
  console.log(`   Apartments: ${apartments.length}`);

  // Удаляем все существующие вложения (только записи в БД, файлы в R2 не трогаем)
  const deleted = await prisma.apartmentAttachment.deleteMany({});
  console.log(`   Deleted existing attachments: ${deleted.count}`);

  let created = 0;
  for (const apt of apartments) {
    // 6 фото из Renders — во все квартиры
    for (const file of RENDER_FILES) {
      const key = RENDERS_KEY_PREFIX + file;
      await prisma.apartmentAttachment.create({
        data: {
          apartmentId: apt.id,
          fileType: FileType.IMAGE,
          fileUrl: url(key),
          fileName: file,
        },
      });
      created++;
    }

    // По типу квартиры — 1 PDF и 1 PNG из 2D (типы 1–21)
    const type = apt.apartmentType ?? 1;
    const typeNum = Math.max(1, Math.min(21, type));

    const pdfKey = `${FLOORPLAN_PDF_PREFIX}Type_${typeNum}.pdf`;
    await prisma.apartmentAttachment.create({
      data: {
        apartmentId: apt.id,
        fileType: FileType.FLOORPLAN,
        fileUrl: url(pdfKey),
        fileName: `Type_${typeNum}.pdf`,
      },
    });
    created++;

    const pngKey = `${FLOORPLAN_PNG_PREFIX}Type_${typeNum}.png`;
    await prisma.apartmentAttachment.create({
      data: {
        apartmentId: apt.id,
        fileType: FileType.FLOORPLAN,
        fileUrl: url(pngKey),
        fileName: `Type_${typeNum}.png`,
      },
    });
    created++;

    // Matter Link по типу квартиры (1–21)
    await prisma.apartment.update({
      where: { id: apt.id },
      data: { matterLink: matterLinkForType(typeNum) },
    });
  }

  console.log(`   Created attachments: ${created}`);
  console.log(`   Updated matterLink for ${apartments.length} apartments (by type 1–21)`);
  console.log('✅ Done.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
