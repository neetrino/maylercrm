/**
 * Проставляет matterLink для всех квартир по apartment_type (1–21).
 * Тип 1 → https://3d.evolver.company/Appartment1, тип 2 → Appartment2, … тип 21 → Appartment21.
 *
 * Запуск: npx tsx scripts/seed-matter-links.ts
 */

import 'dotenv/config';
import { prisma } from '../lib/prisma';

const MATTER_LINK_BASE = 'https://3d.evolver.company/Appartment';

async function main() {
  const apartments = await prisma.apartment.findMany({
    select: { id: true, apartmentType: true },
  });
  let updated = 0;
  for (const apt of apartments) {
    const typeNum = apt.apartmentType ?? 1;
    const num = Math.max(1, Math.min(21, typeNum));
    const matterLink = `${MATTER_LINK_BASE}${num}`;
    await prisma.apartment.update({
      where: { id: apt.id },
      data: { matterLink },
    });
    updated++;
  }
  console.log(`Updated matterLink for ${updated} apartments.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
