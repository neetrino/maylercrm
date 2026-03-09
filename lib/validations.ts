import { z } from 'zod';

// Slug validation: lowercase, kebab-case, no special chars
const slugSchema = z
  .string()
  .min(1, 'Slug не может быть пустым')
  .max(255, 'Slug слишком длинный')
  .regex(
    /^[a-z0-9-]+$/,
    'Slug может содержать только строчные буквы, цифры и дефисы'
  )
  .transform((val) => val.toLowerCase().trim().replace(/\s+/g, '-'));

export const createDistrictSchema = z.object({
  name: z.string().min(1, 'Название обязательно').max(255),
  slug: slugSchema,
});

export const updateDistrictSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  slug: slugSchema.optional(),
});

export const createBuildingSchema = z.object({
  districtId: z.number().int().positive('ID района должен быть положительным'),
  name: z.string().min(1, 'Название обязательно').max(255),
  slug: slugSchema,
});

export const updateBuildingSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  slug: slugSchema.optional(),
  districtId: z.number().int().positive().optional(),
  floorsCount: z.number().int().min(0).optional().nullable(),
});

// Apartment schemas
const apartmentStatusSchema = z.enum([
  'UPCOMING',
  'AVAILABLE',
  'RESERVED',
  'SOLD',
]);

const salesTypeSchema = z.enum(['UNSOLD', 'MORTGAGE', 'CASH', 'TIMEBASED']);

export const createApartmentSchema = z.object({
  buildingId: z.number().int().positive('ID здания должен быть положительным'),
  apartmentNo: z.string().min(1, 'Номер квартиры обязателен').max(50),
  apartmentType: z.number().int().optional(),
  floor: z.number().int().optional(),
  sqm: z.number().positive().optional(),
  priceSqm: z.number().positive().optional(),
  status: apartmentStatusSchema.optional(),
});

export const updateApartmentSchema = z.object({
  buildingId: z.number().int().positive().optional(),
  apartmentNo: z.string().min(1).max(50).optional(),
  apartmentType: z.number().int().optional(),
  floor: z.number().int().optional().nullable(),
  status: apartmentStatusSchema.optional(),
  dealDate: z.string().date().optional().nullable().or(z.literal('').transform(() => null)),
  ownershipName: z.string().max(500).optional().nullable().or(z.literal('').transform(() => null)),
  email: z.string().email('Invalid email').optional().nullable().or(z.literal('').transform(() => null)),
  passportTaxNo: z.string().max(100).optional().nullable().or(z.literal('').transform(() => null)),
  phone: z.string().max(50).optional().nullable().or(z.literal('').transform(() => null)),
  sqm: z.union([z.number().positive(), z.null()]).optional(),
  priceSqm: z.union([z.number().positive(), z.null()]).optional(),
  salesType: salesTypeSchema.optional(),
  totalPaid: z.number().min(0).optional().nullable(),
  dealDescription: z.string().max(500).optional().nullable().or(z.literal('').transform(() => null)),
  matterLink: z.string().url('Invalid URL').optional().nullable().or(z.literal('').transform(() => null)),
  floorplanDistribution: z.string().max(500).optional().nullable().or(z.literal('').transform(() => null)),
  exteriorLink: z.string().url('Invalid URL').optional().nullable().or(z.literal('').transform(() => null)),
  exteriorLink2: z.string().url('Invalid URL').optional().nullable().or(z.literal('').transform(() => null)),
  notes: z.string().max(2000).optional().nullable().or(z.literal('').transform(() => null)),
});

export const updateApartmentStatusSchema = z.object({
  status: apartmentStatusSchema.or(
    z.enum(['upcoming', 'available', 'reserved', 'sold']).transform((val) =>
      val.toUpperCase() as 'UPCOMING' | 'AVAILABLE' | 'RESERVED' | 'SOLD'
    )
  ),
  deal_date: z.string().date().optional().nullable().or(z.literal('').transform(() => null)),
  ownership_name: z.string().max(500).optional().nullable().or(z.literal('').transform(() => null)),
  email: z.string().email('Invalid email').optional().nullable().or(z.literal('').transform(() => null)),
  passport_tax_no: z.string().max(100).optional().nullable().or(z.literal('').transform(() => null)),
  phone: z.string().max(50).optional().nullable().or(z.literal('').transform(() => null)),
});
