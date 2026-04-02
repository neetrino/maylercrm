import type { Building, District } from '@prisma/client';

export type ApartmentListAttachment = {
  id: number;
  fileType: string;
  fileUrl: string;
  fileName?: string | null;
};

/** Row shape for apartments list (grid / table / floor views) */
export type ApartmentListRow = {
  id: number;
  apartmentNo: string;
  apartmentName: string | null;
  status: string;
  sqm: number | null;
  total_price: number | null;
  total_paid: number | null;
  balance: number | null;
  floor?: number | null;
  building: Building & { district: District };
  updatedAt: string;
  attachments?: ApartmentListAttachment[];
  matter_link?: string | null;
  matterLink?: string | null;
  landingToken?: string | null;
};
