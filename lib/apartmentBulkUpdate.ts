import type { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

export type BulkApartmentPayloadItem = {
  id: number;
  apartmentNo?: string;
  apartmentName?: string | null;
};

type ApartmentRow = {
  id: number;
  buildingId: number;
  apartmentNo: string;
  apartmentName: string | null;
};

export type BulkMergedRow = {
  id: number;
  buildingId: number;
  newNo: string;
  newName: string | null;
  oldNo: string;
};

const BULK_TEMP_PREFIX = '__BULK_';

export function buildBulkTempApartmentNo(id: number): string {
  return `${BULK_TEMP_PREFIX}${id}_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`;
}

export function mergeBulkApartmentRows(
  items: BulkApartmentPayloadItem[],
  byId: Map<number, ApartmentRow>
): BulkMergedRow[] {
  return items.map((item) => {
    const apt = byId.get(item.id)!;
    return {
      id: item.id,
      buildingId: apt.buildingId,
      newNo: item.apartmentNo !== undefined ? item.apartmentNo.trim() : apt.apartmentNo,
      newName:
        item.apartmentName !== undefined
          ? item.apartmentName?.trim() || null
          : apt.apartmentName,
      oldNo: apt.apartmentNo,
    };
  });
}

export function assertUniqueApartmentNosInBatch(merged: BulkMergedRow[]): void {
  const seenNo = new Map<string, number>();
  for (const m of merged) {
    const key = `${m.buildingId}:${m.newNo}`;
    if (seenNo.has(key) && seenNo.get(key) !== m.id) {
      throw new Error(`Duplicate apartment number in batch: ${m.newNo}`);
    }
    seenNo.set(key, m.id);
  }
}

export async function assertNoExternalApartmentNoConflict(
  db: PrismaClient,
  batchIds: number[],
  merged: BulkMergedRow[]
): Promise<void> {
  for (const m of merged) {
    if (m.newNo === m.oldNo) continue;
    const conflict = await db.apartment.findFirst({
      where: {
        buildingId: m.buildingId,
        apartmentNo: m.newNo,
        id: { notIn: batchIds },
      },
    });
    if (conflict) {
      throw new Error(`Apartment number ${m.newNo} is already used in this building`);
    }
  }
}
