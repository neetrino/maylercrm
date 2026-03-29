/**
 * Экспорт продаж за последние 3 дня + остаток в Excel.
 * Лист 1: "Продажи (3 дня)"  — SOLD/RESERVED с dealDate или updatedAt за последние 3 дня
 * Лист 2: "Остаток"          — все AVAILABLE апартаменты
 *
 * Запуск: npx tsx scripts/export-sales-3days.ts
 * Файл сохраняется в: exports/sales-report-YYYY-MM-DD.xlsx
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

const STATUS_LABELS: Record<string, string> = {
  UPCOMING: 'Скоро',
  AVAILABLE: 'Доступно',
  RESERVED: 'Бронь',
  SOLD: 'Продано',
};

const SALES_TYPE_LABELS: Record<string, string> = {
  UNSOLD: '—',
  MORTGAGE: 'Ипотека',
  CASH: 'Наличные',
  TIMEBASED: 'Рассрочка',
};

function fmt(val: unknown): string | number {
  if (val === null || val === undefined) return '';
  if (val instanceof Date) return val.toLocaleDateString('ru-RU');
  return String(val);
}

function fmtNum(val: unknown): number | string {
  if (val === null || val === undefined) return '';
  const n = Number(val);
  return isNaN(n) ? '' : n;
}

async function main() {
  const now = new Date();
  const threeDaysAgo = new Date(now);
  threeDaysAgo.setDate(now.getDate() - 3);
  threeDaysAgo.setHours(0, 0, 0, 0);

  console.log(`Период: с ${threeDaysAgo.toLocaleDateString('ru-RU')} по ${now.toLocaleDateString('ru-RU')}`);

  // --- Лист 1: Продажи за 3 дня ---
  const soldApartments = await prisma.apartment.findMany({
    where: {
      status: { in: ['SOLD', 'RESERVED'] },
      OR: [
        { dealDate: { gte: threeDaysAgo } },
        { updatedAt: { gte: threeDaysAgo } },
      ],
    },
    include: {
      building: {
        include: { district: true },
      },
    },
    orderBy: [{ dealDate: 'desc' }, { updatedAt: 'desc' }],
  });

  // --- Лист 2: Остаток (AVAILABLE) ---
  const availableApartments = await prisma.apartment.findMany({
    where: { status: 'AVAILABLE' },
    include: {
      building: {
        include: { district: true },
      },
    },
    orderBy: [{ building: { name: 'asc' } }, { apartmentNo: 'asc' }],
  });

  console.log(`Продано/забронировано за 3 дня: ${soldApartments.length}`);
  console.log(`Доступно: ${availableApartments.length}`);

  const salesHeaders = [
    'Район', 'Корпус', 'Квартира №', 'Этаж', 'Статус', 'Тип сделки',
    'Дата сделки', 'Покупатель', 'Телефон', 'Email',
    'Паспорт/ИНН', 'Площадь (м²)', 'Цена/м²', 'Общая сумма',
    'Оплачено', 'Остаток', 'Адрес покупателя', 'Другие покупатели',
    'График платежей', 'Описание', 'Заметки', 'Обновлено',
  ];

  const salesRows = soldApartments.map((a) => [
    fmt(a.building.district.name),
    fmt(a.building.name),
    fmt(a.apartmentNo),
    fmt(a.floor),
    STATUS_LABELS[a.status] ?? a.status,
    SALES_TYPE_LABELS[a.salesType] ?? a.salesType,
    a.dealDate ? new Date(a.dealDate).toLocaleDateString('ru-RU') : '',
    fmt(a.ownershipName),
    fmt(a.phone),
    fmt(a.email),
    fmt(a.passportTaxNo),
    fmtNum(a.sqm),
    fmtNum(a.priceSqm),
    fmtNum(a.totalPrice),
    fmtNum(a.totalPaid),
    fmtNum(a.balanceRemaining),
    fmt(a.buyerAddress),
    fmt(a.otherBuyers),
    fmt(a.paymentSchedule),
    fmt(a.dealDescription),
    fmt(a.notes),
    a.updatedAt ? new Date(a.updatedAt).toLocaleDateString('ru-RU') : '',
  ]);

  const availableHeaders = [
    'Район', 'Корпус', 'Квартира №', 'Этаж', 'Тип', 'Площадь (м²)', 'Цена/м²', 'Общая сумма', 'Заметки',
  ];

  const availableRows = availableApartments.map((a) => [
    fmt(a.building.district.name),
    fmt(a.building.name),
    fmt(a.apartmentNo),
    fmt(a.floor),
    fmt(a.apartmentType),
    fmtNum(a.sqm),
    fmtNum(a.priceSqm),
    fmtNum(a.totalPrice),
    fmt(a.notes),
  ]);

  // --- Создаём Excel ---
  const wb = XLSX.utils.book_new();

  const wsSales = XLSX.utils.aoa_to_sheet([salesHeaders, ...salesRows]);
  // Ширина колонок
  wsSales['!cols'] = [
    { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 6 }, { wch: 10 }, { wch: 12 },
    { wch: 12 }, { wch: 25 }, { wch: 15 }, { wch: 22 },
    { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 15 },
    { wch: 12 }, { wch: 12 }, { wch: 25 }, { wch: 25 },
    { wch: 30 }, { wch: 30 }, { wch: 25 }, { wch: 12 },
  ];
  XLSX.utils.book_append_sheet(wb, wsSales, 'Продажи (3 дня)');

  const wsAvail = XLSX.utils.aoa_to_sheet([availableHeaders, ...availableRows]);
  wsAvail['!cols'] = [
    { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 6 }, { wch: 8 },
    { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 25 },
  ];
  XLSX.utils.book_append_sheet(wb, wsAvail, 'Остаток');

  // --- Сохраняем файл ---
  const exportsDir = path.join(process.cwd(), 'exports');
  if (!fs.existsSync(exportsDir)) fs.mkdirSync(exportsDir);

  const dateStr = now.toISOString().split('T')[0];
  const outPath = path.join(exportsDir, `sales-report-${dateStr}.xlsx`);
  XLSX.writeFile(wb, outPath);

  console.log(`\nФайл сохранён: ${outPath}`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
