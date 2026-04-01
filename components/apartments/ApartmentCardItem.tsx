'use client';

import { memo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, Link2, Box } from 'lucide-react';
import { formatAmd } from '@/lib/formatAmd';
import { getEmbedPreviewUrl } from '@/lib/getEmbedPreviewUrl';
import type { ApartmentListRow } from './apartmentListTypes';

export type ApartmentCardItemProps = {
  apt: ApartmentListRow;
  onStatusChange: (id: number, status: string) => void;
  getStatusColor: (status: string) => string;
  onOpenPreview: (url: string) => void;
  onLandingCopied?: () => void;
};

export const ApartmentCardItem = memo(
  ({
    apt,
    onStatusChange,
    getStatusColor,
    onOpenPreview,
    onLandingCopied,
  }: ApartmentCardItemProps) => {
    const router = useRouter();
    const [landingCopying, setLandingCopying] = useState(false);
    const [landingJustCopied, setLandingJustCopied] = useState(false);
    const matterUrl = apt.matter_link ?? apt.matterLink ?? null;
    const embedUrl = matterUrl ? getEmbedPreviewUrl(matterUrl) : null;

    const handleCardClick = (e: React.MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('[data-no-nav]')) return;
      router.push(`/apartments/${apt.id}`);
    };

    const handleLandingCopy = async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (landingCopying) return;
      setLandingCopying(true);
      try {
        const res = await fetch(`/api/apartments/${apt.id}/landing`, {
          method: 'POST',
        });
        if (!res.ok) throw new Error('Failed');
        const { url } = await res.json();
        await navigator.clipboard.writeText(url);
        setLandingJustCopied(true);
        onLandingCopied?.();
        setTimeout(() => setLandingJustCopied(false), 2000);
      } catch {
        alert('Failed to copy landing link');
      } finally {
        setLandingCopying(false);
      }
    };

    const handlePreviewClick = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (embedUrl) onOpenPreview(embedUrl);
    };

    return (
      <article
        role="button"
        tabIndex={0}
        onClick={handleCardClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            router.push(`/apartments/${apt.id}`);
          }
        }}
        className="group relative cursor-pointer overflow-hidden rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-lg"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-lg font-bold text-gray-900">
              {apt.apartmentNo}
            </h3>
            <p className="mt-0.5 truncate text-sm text-gray-500">
              {apt.building.district.name} — {apt.building.name}
            </p>
          </div>
          <select
            data-no-nav
            value={apt.status}
            onChange={(e) => {
              e.stopPropagation();
              onStatusChange(apt.id, e.target.value);
            }}
            className={`select-chevron-grid shrink-0 cursor-pointer appearance-none rounded-full border px-2.5 py-1 pr-6 text-xs font-medium transition-colors ${getStatusColor(apt.status)}`}
          >
            <option value="UPCOMING">Upcoming</option>
            <option value="AVAILABLE">Available</option>
            <option value="RESERVED">Reserved</option>
            <option value="SOLD">Sold</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-2 border-t border-gray-100 pt-4 text-sm">
          <div className="flex justify-between gap-2">
            <span className="text-gray-500">Area</span>
            <span className="tabular-nums font-medium text-gray-900">
              {apt.sqm ? `${apt.sqm} m²` : '—'}
            </span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-gray-500">Price</span>
            <span className="tabular-nums font-semibold text-gray-900">
              {apt.total_price ? formatAmd(apt.total_price) : '—'}
            </span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-gray-500">Paid</span>
            <span className="tabular-nums font-medium text-gray-900">
              {apt.total_paid ? formatAmd(apt.total_paid) : '—'}
            </span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-gray-500">Balance</span>
            <span className="tabular-nums font-medium text-gray-900">
              {apt.balance ? formatAmd(apt.balance) : '—'}
            </span>
          </div>
        </div>

        <div
          className="mt-4 flex items-stretch gap-3 border-t border-gray-100 pt-4"
          data-no-nav
        >
          <Link
            href={`/apartments/${apt.id}`}
            onClick={(e) => e.stopPropagation()}
            className="flex min-w-0 flex-1 items-center justify-center gap-2 rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
          >
            <Eye className="h-4 w-4 shrink-0" />
            <span className="truncate">View Details</span>
          </Link>
          <button
            type="button"
            onClick={handleLandingCopy}
            disabled={landingCopying}
            className="flex min-w-0 flex-1 items-center justify-center gap-2 rounded-xl bg-blue-50 px-4 py-2.5 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100 disabled:opacity-60"
            title="Copy landing link"
          >
            <Link2 className="h-4 w-4 shrink-0" />
            <span className="truncate">
              {landingCopying ? '…' : landingJustCopied ? 'Copied!' : 'Landing'}
            </span>
          </button>
          {embedUrl && (
            <button
              type="button"
              onClick={handlePreviewClick}
              className="flex min-w-0 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-100"
              title="Open 3D preview"
            >
              <Box className="h-4 w-4 shrink-0" />
              <span className="truncate">3D Preview</span>
            </button>
          )}
        </div>
      </article>
    );
  }
);

ApartmentCardItem.displayName = 'ApartmentCardItem';
