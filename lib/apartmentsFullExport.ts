import * as XLSX from 'xlsx';
import type { Apartment, Building, District } from '@prisma/client';
import type { Decimal } from '@prisma/client/runtime/library';

type ApartmentWithBuilding = Apartment & {
  building: Building & { district: District };
};

/** Column order aligned with DB / JSON export (snake_case), plus district/building names at end. */
export const APARTMENT_EXPORT_HEADERS = [
  'id',
  'building_id',
  'apartment_no',
  'apartment_type',
  'status',
  'deal_date',
  'ownership_name',
  'email',
  'passport_tax_no',
  'phone',
  'sqm',
  'price_sqm',
  'total_price',
  'sales_type',
  'total_paid',
  'deal_description',
  'matter_link',
  'floorplan_distribution',
  'exterior_link',
  'exterior_link2',
  'created_at',
  'updated_at',
  'floor',
  'landing_token',
  'notes',
  'balance_remaining',
  'buyer_address',
  'other_buyers',
  'payment_schedule',
  'district_name',
  'building_name',
] as const;

function formatDateOnly(d: Date | null): string {
  if (!d) return '';
  return d.toISOString().slice(0, 10);
}

function formatDateTime(d: Date): string {
  return d.toISOString().replace('T', ' ').replace('Z', '');
}

function dec(v: Decimal | null | undefined): string {
  if (v === null || v === undefined) return '';
  return v.toString();
}

function str(v: string | null | undefined): string {
  return v ?? '';
}

function mapRow(apt: ApartmentWithBuilding): string[] {
  return [
    String(apt.id),
    String(apt.buildingId),
    apt.apartmentNo,
    apt.apartmentType === null || apt.apartmentType === undefined ? '' : String(apt.apartmentType),
    apt.status,
    formatDateOnly(apt.dealDate),
    str(apt.ownershipName),
    str(apt.email),
    str(apt.passportTaxNo),
    str(apt.phone),
    dec(apt.sqm),
    dec(apt.priceSqm),
    dec(apt.totalPrice),
    apt.salesType,
    dec(apt.totalPaid),
    str(apt.dealDescription),
    str(apt.matterLink),
    str(apt.floorplanDistribution),
    str(apt.exteriorLink),
    str(apt.exteriorLink2),
    formatDateTime(apt.createdAt),
    formatDateTime(apt.updatedAt),
    apt.floor === null || apt.floor === undefined ? '' : String(apt.floor),
    str(apt.landingToken),
    str(apt.notes),
    dec(apt.balanceRemaining),
    str(apt.buyerAddress),
    str(apt.otherBuyers),
    str(apt.paymentSchedule),
    apt.building.district.name,
    apt.building.name,
  ];
}

/**
 * Builds .xlsx buffer: one sheet "apartments", header row + one row per apartment.
 */
export function buildApartmentsExportXlsxBuffer(apartments: ApartmentWithBuilding[]): Buffer {
  const headerRow = [...APARTMENT_EXPORT_HEADERS];
  const dataRows = apartments.map(mapRow);
  const aoa = [headerRow, ...dataRows];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'apartments');
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
}
