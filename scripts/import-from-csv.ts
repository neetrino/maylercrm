/**
 * Импорт данных из CSV (заполненных заказчиком) в БД.
 * Запуск: npx tsx scripts/import-from-csv.ts
 * Файлы: data/import/districts.csv, buildings.csv, apartments.csv
 * (или *_template.csv — шаблоны с примерами)
 */

import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';
import { prisma } from '../lib/prisma';

const IMPORT_DIR = path.join(process.cwd(), 'data', 'import');

function normalizeSlug(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

function readCsv(name: string): string {
  const primary = path.join(IMPORT_DIR, `${name}.csv`);
  const template = path.join(IMPORT_DIR, `${name}_template.csv`);
  if (fs.existsSync(primary)) return fs.readFileSync(primary, 'utf-8');
  if (fs.existsSync(template)) return fs.readFileSync(template, 'utf-8');
  throw new Error(`Файл не найден: ${name}.csv или ${name}_template.csv в data/import/`);
}

function parseCsv(content: string): Record<string, string>[] {
  const rows = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
    bom: true,
  });
  return rows as Record<string, string>[];
}

function empty(s: string | undefined): boolean {
  return s === undefined || s === null || String(s).trim() === '';
}

function num(s: string | undefined): number | null {
  if (empty(s)) return null;
  const n = Number(String(s).replace(/\s/g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

function dateStr(s: string | undefined): string | null {
  if (empty(s)) return null;
  const d = String(s).trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : null;
}

const STATUSES = ['UPCOMING', 'AVAILABLE', 'RESERVED', 'SOLD'] as const;
const SALES_TYPES = ['UNSOLD', 'MORTGAGE', 'CASH', 'TIMEBASED'] as const;

async function main() {
  console.log('📂 Чтение CSV из', IMPORT_DIR);

  // 1. Районы
  const districtsContent = readCsv('districts');
  const districtRows = parseCsv(districtsContent);
  console.log(`\n📍 Районы: ${districtRows.length} строк(и)`);

  for (const row of districtRows) {
    const name = row.name?.trim();
    const slug = normalizeSlug(row.slug ?? '');
    if (!name || !slug) {
      console.warn('  Пропуск строки (нет name или slug):', row);
      continue;
    }
    await prisma.district.upsert({
      where: { slug },
      create: { name, slug },
      update: { name },
    });
    console.log('  ', slug, '—', name);
  }

  // 2. Здания
  const buildingsContent = readCsv('buildings');
  const buildingRows = parseCsv(buildingsContent);
  console.log(`\n🏢 Здания: ${buildingRows.length} строк(и)`);

  for (const row of buildingRows) {
    const districtSlug = normalizeSlug(row.district_slug ?? '');
    const name = row.name?.trim();
    const slug = normalizeSlug(row.slug ?? '');
    if (!districtSlug || !name || !slug) {
      console.warn('  Пропуск строки (нет district_slug, name или slug):', row);
      continue;
    }
    const district = await prisma.district.findUnique({ where: { slug: districtSlug } });
    if (!district) {
      console.warn('  Район не найден:', districtSlug, '— пропуск здания', name);
      continue;
    }
    await prisma.building.upsert({
      where: {
        districtId_slug: { districtId: district.id, slug },
      },
      create: { districtId: district.id, name, slug },
      update: { name },
    });
    console.log('  ', districtSlug + '/' + slug, '—', name);
  }

  // 3. Квартиры
  const apartmentsContent = readCsv('apartments');
  const apartmentRows = parseCsv(apartmentsContent);
  console.log(`\n🏠 Квартиры: ${apartmentRows.length} строк(и)`);

  for (const row of apartmentRows) {
    const districtSlug = normalizeSlug(row.district_slug ?? '');
    const buildingSlug = normalizeSlug(row.building_slug ?? '');
    const apartmentNo = row.apartment_no?.trim();
    if (!districtSlug || !buildingSlug || !apartmentNo) {
      console.warn('  Пропуск строки (нет district_slug, building_slug или apartment_no):', row);
      continue;
    }

    const district = await prisma.district.findUnique({ where: { slug: districtSlug } });
    if (!district) {
      console.warn('  Район не найден:', districtSlug, '— пропуск квартиры', apartmentNo);
      continue;
    }
    const building = await prisma.building.findUnique({
      where: { districtId_slug: { districtId: district.id, slug: buildingSlug } },
    });
    if (!building) {
      console.warn('  Здание не найдено:', buildingSlug, '— пропуск квартиры', apartmentNo);
      continue;
    }

    const statusRaw = (row.status ?? '').toUpperCase().trim();
    const status = STATUSES.includes(statusRaw as (typeof STATUSES)[number])
      ? (statusRaw as (typeof STATUSES)[number])
      : 'UPCOMING';

    const salesTypeRaw = (row.sales_type ?? '').toUpperCase().trim();
    const salesType = SALES_TYPES.includes(salesTypeRaw as (typeof SALES_TYPES)[number])
      ? (salesTypeRaw as (typeof SALES_TYPES)[number])
      : 'UNSOLD';

    const sqm = num(row.sqm);
    const priceSqm = num(row.price_sqm);
    const totalPrice = num(row.total_price);
    const totalPaid = num(row.total_paid) ?? 0;

    const data = {
      buildingId: building.id,
      apartmentNo,
      apartmentType: num(row.apartment_type),
      status,
      salesType,
      sqm: sqm ?? undefined,
      priceSqm: priceSqm ?? undefined,
      totalPrice: totalPrice ?? undefined,
      totalPaid,
      dealDate: dateStr(row.deal_date),
      ownershipName: empty(row.ownership_name) ? null : row.ownership_name!.trim(),
      email: empty(row.email) ? null : row.email!.trim(),
      passportTaxNo: empty(row.passport_tax_no) ? null : row.passport_tax_no!.trim(),
      phone: empty(row.phone) ? null : row.phone!.trim(),
      dealDescription: empty(row.deal_description) ? null : row.deal_description!.trim(),
      matterLink: empty(row.matter_link) ? null : row.matter_link!.trim(),
      floorplanDistribution: empty(row.floorplan_distribution)
        ? null
        : row.floorplan_distribution!.trim(),
      exteriorLink: empty(row.exterior_link) ? null : row.exterior_link!.trim(),
      exteriorLink2: empty(row.exterior_link2) ? null : row.exterior_link2!.trim(),
    };

    await prisma.apartment.upsert({
      where: {
        buildingId_apartmentNo: { buildingId: building.id, apartmentNo },
      },
      create: data,
      update: {
        apartmentType: data.apartmentType,
        status: data.status,
        salesType: data.salesType,
        sqm: data.sqm,
        priceSqm: data.priceSqm,
        totalPrice: data.totalPrice,
        totalPaid: data.totalPaid,
        dealDate: data.dealDate,
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
    console.log('  ', districtSlug + '/' + buildingSlug + '/' + apartmentNo);
  }

  console.log('\n✅ Импорт завершён.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
