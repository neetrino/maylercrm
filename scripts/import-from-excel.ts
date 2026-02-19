/**
 * Импорт данных из MylerDBActualData.xlsx (4 листа).
 * Листы: District, Building, Apartment, Type Media.
 * Синхронизация по apartment_type: для каждой квартиры подставляются данные из Type Media по типу (1–21).
 *
 * Запуск: npx tsx scripts/import-from-excel.ts [путь к xlsx]
 * По умолчанию: import/MylerDBActualData.xlsx
 */

import * as path from 'path';
import * as fs from 'fs';
import * as XLSX from 'xlsx';
import { prisma } from '../lib/prisma';

try {
  require('dotenv').config({ path: path.join(process.cwd(), '.env.local') });
} catch {
  // ignore
}
require('dotenv').config();

const DEFAULT_PATH = path.join(process.cwd(), 'import', 'MylerDBActualData.xlsx');

function normalizeSlug(s: string): string {
  return String(s ?? '')
    .toLowerCase()
    .trim()
    .replace(/_/g, '-')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

function num(val: unknown): number | null {
  if (val === undefined || val === null || val === '') return null;
  const n = Number(String(val).replace(/\s/g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

function str(val: unknown): string | null {
  if (val === undefined || val === null) return null;
  const s = String(val).trim();
  return s === '' ? null : s;
}

/** Преобразует дату: Excel serial number или строку YYYY-MM-DD → YYYY-MM-DD или null */
function parseDate(val: unknown): string | null {
  if (val === undefined || val === null || val === '') return null;
  const s = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const n = Number(s);
  if (!Number.isFinite(n) || n < 1) return null;
  // Excel serial date (days since 1899-12-30)
  const date = new Date(Math.round((n - 25569) * 86400 * 1000));
  if (isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

const STATUSES = ['UPCOMING', 'AVAILABLE', 'RESERVED', 'SOLD'] as const;
const SALES_TYPES = ['UNSOLD', 'MORTGAGE', 'CASH', 'TIMEBASED'] as const;

type Row = Record<string, unknown>;

function getSheet(wb: XLSX.WorkBook, nameOrIndex: string | number): Row[] {
  const sheet =
    typeof nameOrIndex === 'number'
      ? wb.Sheets[wb.SheetNames[nameOrIndex]]
      : wb.Sheets[nameOrIndex];
  if (!sheet) return [];
  const rows = XLSX.utils.sheet_to_json<Row>(sheet, { defval: undefined });
  return rows;
}

async function main() {
  const filePath = process.argv[2] || DEFAULT_PATH;
  if (!fs.existsSync(filePath)) {
    console.error('File not found:', filePath);
    process.exit(1);
  }

  console.log('📂 Reading', filePath);
  const wb = XLSX.readFile(filePath);
  console.log('   Sheets:', wb.SheetNames.join(', '));

  // Читаем по именам листов (в файле: apartments, buildings, districts, Type Media)
  const sheetDistricts = wb.SheetNames.find((n) => /district/i.test(n)) ?? wb.SheetNames[0];
  const sheetBuildings = wb.SheetNames.find((n) => /building/i.test(n)) ?? wb.SheetNames[1];
  const sheetApartments = wb.SheetNames.find((n) => /apartment/i.test(n)) ?? wb.SheetNames[2];
  const sheetTypeMedia = wb.SheetNames.find((n) => /type\s*media|typemedia/i.test(n)) ?? wb.SheetNames[3];
  const districtRows = getSheet(wb, sheetDistricts);
  const buildingRows = getSheet(wb, sheetBuildings);
  const apartmentRows = getSheet(wb, sheetApartments);
  const typeMediaRows = getSheet(wb, sheetTypeMedia);

  console.log('   Districts:', districtRows.length, 'Buildings:', buildingRows.length);
  console.log('   Apartments:', apartmentRows.length, 'Type Media rows:', typeMediaRows.length);

  // Построить карту type -> row для Type Media (колонка type или № типа 1–21)
  const typeMediaByType = new Map<number, Row>();
  const typeKey = typeMediaRows[0] ? Object.keys(typeMediaRows[0]).find((k) => /type|тип|№/i.test(k)) || 'type' : 'type';
  for (const row of typeMediaRows) {
    const t = num(row[typeKey] ?? row.Type ?? row.type);
    if (t !== null && t >= 1 && t <= 21) typeMediaByType.set(t, row);
  }

  // 1. Районы (колонки: name, slug или name + slug)
  const nameKey = districtRows[0] ? (Object.keys(districtRows[0]).find((k) => /name|название/i.test(k)) || 'name') : 'name';
  const slugKey = districtRows[0] ? (Object.keys(districtRows[0]).find((k) => /slug|slug/i.test(k)) || 'slug') : 'slug';
  for (const row of districtRows) {
    const name = str(row[nameKey] ?? row.name ?? row.Name);
    const rawSlug = str(row[slugKey] ?? row.slug ?? row.districts_slug) || (name ? name : null);
    const slug = rawSlug ? normalizeSlug(rawSlug) : null;
    if (!name || !slug) continue;
    await prisma.district.upsert({
      where: { slug },
      create: { name, slug },
      update: { name },
    });
  }

  // 2. Здания (district_slug, name, slug)
  const dSlugKey = buildingRows[0] ? (Object.keys(buildingRows[0]).find((k) => /district|район|slug/i.test(k)) || 'district_slug') : 'district_slug';
  const bNameKey = buildingRows[0] ? (Object.keys(buildingRows[0]).find((k) => /name|название/i.test(k)) || 'name') : 'name';
  const bSlugKey = buildingRows[0] ? (Object.keys(buildingRows[0]).find((k) => /slug/i.test(k) && !/district/i.test(k)) || 'slug') : 'slug';
  for (const row of buildingRows) {
    const districtSlug = normalizeSlug(String(row[dSlugKey] ?? row.district_slug ?? ''));
    const name = str(row[bNameKey] ?? row.name);
    const rawSlug = str(row[bSlugKey] ?? row.slug ?? row.buildings_slug) || (name ? name : null);
    const slug = rawSlug ? normalizeSlug(rawSlug) : null;
    if (!districtSlug || !name || !slug) continue;
    const district = await prisma.district.findUnique({ where: { slug: districtSlug } });
    if (!district) continue;
    await prisma.building.upsert({
      where: { districtId_slug: { districtId: district.id, slug } },
      create: { districtId: district.id, name, slug },
      update: { name },
    });
  }

  // 3. Квартиры + подстановка данных из Type Media по apartment_type
  const aptNoKey = apartmentRows[0] ? (Object.keys(apartmentRows[0]).find((k) => /apartment|no|номер|no\./i.test(k)) || 'apartment_no') : 'apartment_no';
  const aptTypeKey = apartmentRows[0] ? (Object.keys(apartmentRows[0]).find((k) => /type|тип/i.test(k)) || 'apartment_type') : 'apartment_type';
  for (const row of apartmentRows) {
    const districtSlug = normalizeSlug(String(row.district_slug ?? row.district ?? ''));
    const buildingSlug = normalizeSlug(String(row.building_slug ?? row.building ?? ''));
    const apartmentNo = str(row[aptNoKey] ?? row.apartment_no ?? row.apartmentNo);
    if (!districtSlug || !buildingSlug || !apartmentNo) continue;

    const district = await prisma.district.findUnique({ where: { slug: districtSlug } });
    if (!district) continue;
    const building = await prisma.building.findUnique({
      where: { districtId_slug: { districtId: district.id, slug: buildingSlug } },
    });
    if (!building) continue;

    const apartmentType = num(row[aptTypeKey] ?? row.apartment_type ?? row.apartmentType) ?? null;
    const typeRow = apartmentType !== null ? typeMediaByType.get(apartmentType) : undefined;

    // Floor: в Excel колонка "Floor" (с большой буквы)
    const floorVal = num(row.Floor ?? row.floor);

    const statusRaw = String(row.status ?? '').toUpperCase().trim();
    const status = STATUSES.includes(statusRaw as (typeof STATUSES)[number]) ? (statusRaw as (typeof STATUSES)[number]) : 'UPCOMING';
    const salesTypeRaw = String(row.sales_type ?? row.salesType ?? '').toUpperCase().trim();
    const salesType = SALES_TYPES.includes(salesTypeRaw as (typeof SALES_TYPES)[number]) ? (salesTypeRaw as (typeof SALES_TYPES)[number]) : 'UNSOLD';

    // Из строки квартиры
    let sqm = num(row.sqm);
    let priceSqm = num(row.price_sqm ?? row.priceSqm);
    let floor = floorVal;
    const totalPaid = num(row.total_paid ?? row.totalPaid) ?? 0;
    const dealDate = parseDate(row.deal_date ?? row.dealDate);
    const ownershipName = str(row.ownership_name ?? row.ownershipName);
    const email = str(row.email);
    const passportTaxNo = str(row.passport_tax_no ?? row.passportTaxNo);
    const phone = str(row.phone);
    const dealDescription = str(row.deal_description ?? row.dealDescription);
    const matterLink = str(row.matter_link ?? row.matterLink);
    const floorplanDistribution = str(row.floorplan_distribution ?? row.floorplanDistribution);
    const exteriorLink = str(row.exterior_link ?? row.exteriorLink);
    const exteriorLink2 = str(row.exterior_link2 ?? row.exteriorLink2);

    // Подставить из Type Media по типу, если в квартире пусто
    if (typeRow) {
      if (sqm == null) sqm = num(typeRow.sqm);
      if (priceSqm == null) priceSqm = num(typeRow.price_sqm ?? typeRow.priceSqm);
      if (floor == null) floor = num(typeRow.floor);
    }

    const totalPrice = sqm != null && priceSqm != null ? sqm * priceSqm : null;
    const dealDateVal = dealDate && /^\d{4}-\d{2}-\d{2}$/.test(dealDate) ? new Date(dealDate) : null;
    const data = {
      buildingId: building.id,
      apartmentNo,
      apartmentType: apartmentType ?? undefined,
      floor: floor ?? undefined,
      status,
      salesType,
      sqm: sqm ?? undefined,
      priceSqm: priceSqm ?? undefined,
      totalPrice: totalPrice ?? undefined,
      totalPaid,
      dealDate: dealDateVal,
      ownershipName,
      email,
      passportTaxNo,
      phone,
      dealDescription,
      matterLink,
      floorplanDistribution,
      exteriorLink,
      exteriorLink2,
    };

    await prisma.apartment.upsert({
      where: { buildingId_apartmentNo: { buildingId: building.id, apartmentNo } },
      create: data,
      update: {
        apartmentType: data.apartmentType,
        floor: data.floor,
        status: data.status,
        salesType: data.salesType,
        sqm: data.sqm,
        priceSqm: data.priceSqm,
        totalPrice: data.totalPrice,
        totalPaid: data.totalPaid,
        dealDate: data.dealDate ?? undefined,
        ownershipName: data.ownershipName,
        email: data.email,
        passportTaxNo: data.passportTaxNo,
        phone: data.phone,
        dealDescription: data.dealDescription,
        matterLink: data.matterLink,
        floorplanDistribution: data.floorplanDistribution,
        exteriorLink: data.exteriorLink,
        exteriorLink2: data.exteriorLink2,
      },
    });
  }

  console.log('✅ Import from Excel done.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
