'use client';

import { useState, useEffect } from 'react';

function getEmbedPreviewUrl(url: string): string {
  try {
    const u = url.trim();
    if (u.includes('matterport.com')) {
      const mMatch = u.match(/[?&]m=([^&]+)/);
      if (mMatch) return `https://my.matterport.com/show/?m=${mMatch[1]}`;
      const spaceMatch = u.match(/\/space\/([A-Za-z0-9_-]+)/);
      if (spaceMatch) return `https://my.matterport.com/show/?m=${spaceMatch[1]}`;
      return u;
    }
    if (u.includes('sketchfab.com')) {
      const match = u.match(/3d-models\/([a-f0-9]+)/i) || u.match(/models\/([a-f0-9]+)/i);
      if (match) return `https://sketchfab.com/models/${match[1]}/embed`;
      return u;
    }
    return u;
  } catch {
    return url;
  }
}

type Attachment = {
  id: number;
  fileType: string;
  fileUrl: string;
  fileName: string | null;
  fileSize: number | null;
  createdAt: string;
};

type LandingApartment = {
  id: number;
  apartmentNo: string;
  apartmentType: number | null;
  floor: number | null;
  status: string;
  sqm: number | null;
  price_sqm: number | null;
  total_price: number | null;
  total_paid: number | null;
  balance: number | null;
  dealDate: string | null;
  ownershipName: string | null;
  matterLink: string | null;
  floorplanDistribution: string | null;
  exteriorLink: string | null;
  exteriorLink2: string | null;
  building_name: string;
  district_name: string;
  notes: string | null;
  attachments: Attachment[];
};

export default function LandingView({ token }: { token: string }) {
  const [apartment, setApartment] = useState<LandingApartment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [active3dUrl, setActive3dUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`/api/landing/${encodeURIComponent(token)}`, {
          cache: 'no-store',
        });
        if (!res.ok) {
          if (res.status === 404) setError('Not found');
          else setError('Failed to load');
          return;
        }
        const data = await res.json();
        if (!cancelled) setApartment(data);
      } catch {
        if (!cancelled) setError('Failed to load');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [token]);

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'UPCOMING': return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'AVAILABLE': return 'bg-green-50 text-green-700 border-green-200';
      case 'RESERVED': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'SOLD': return 'bg-blue-50 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'UPCOMING': return 'Upcoming';
      case 'AVAILABLE': return 'Available';
      case 'RESERVED': return 'Reserved';
      case 'SOLD': return 'Sold';
      default: return status || '-';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !apartment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center max-w-md">
          <p className="text-red-800 font-medium">{error || 'Not found'}</p>
          <p className="mt-2 text-sm text-red-600">This link may be invalid or expired.</p>
        </div>
      </div>
    );
  }

  const attachments = apartment.attachments || [];
  const progressImages = attachments.filter((a) => a.fileType === 'PROGRESS_IMAGE');
  const floorplans = attachments.filter((a) => a.fileType === 'FLOORPLAN');
  const images = attachments.filter((a) => a.fileType === 'IMAGE');
  const threeDLinks = [
    { label: '3D Tour', url: apartment.matterLink },
    { label: 'Exterior', url: apartment.exteriorLink },
    { label: 'Exterior 2', url: apartment.exteriorLink2 },
  ].filter((x) => x.url);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Apartment {apartment.apartmentNo}
          </h1>
          <p className="mt-1 text-gray-500">
            {apartment.district_name} — {apartment.building_name}
          </p>
          <div className="mt-3">
            <span
              className={`inline-flex rounded-full border px-3 py-1 text-sm font-medium ${getStatusColor(apartment.status)}`}
            >
              {getStatusLabel(apartment.status)}
            </span>
          </div>
        </div>

        {/* 3D previews */}
        {threeDLinks.length > 0 && (
          <section className="card p-6 mb-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">3D Preview</h2>
            <div className="space-y-3">
              {threeDLinks.map(({ label, url }) => (
                <div
                  key={label}
                  className="flex flex-col sm:flex-row gap-2 items-start rounded-xl border border-gray-200 bg-gray-50 p-4"
                >
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-medium uppercase text-gray-500">{label}</span>
                    <p className="text-sm text-gray-900 truncate">{url}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setActive3dUrl(getEmbedPreviewUrl(url!))}
                      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                    >
                      Preview
                    </button>
                    <a
                      href={url!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Open
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Key info */}
        <section className="card p-6 mb-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Details</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <p className="text-xs font-medium uppercase text-gray-500">Area</p>
              <p className="font-medium text-gray-900">{apartment.sqm ? `${apartment.sqm} m²` : '-'}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-gray-500">Floor</p>
              <p className="font-medium text-gray-900">{apartment.floor ?? '-'}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-gray-500">Total price</p>
              <p className="font-semibold text-gray-900">
                {apartment.total_price ? `${(apartment.total_price / 1000000).toFixed(1)}M AMD` : '-'}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-gray-500">Price per m²</p>
              <p className="font-medium text-gray-900">
                {apartment.price_sqm ? `${(apartment.price_sqm / 1000).toFixed(0)}K AMD` : '-'}
              </p>
            </div>
          </div>
          {apartment.floorplanDistribution && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs font-medium uppercase text-gray-500 mb-1">Floor plan</p>
              <p className="text-sm text-gray-900 whitespace-pre-wrap">{apartment.floorplanDistribution}</p>
            </div>
          )}
          {apartment.notes && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs font-medium uppercase text-gray-500 mb-1">Notes</p>
              <p className="text-sm text-gray-900 whitespace-pre-wrap">{apartment.notes}</p>
            </div>
          )}
        </section>

        {/* Progress images */}
        {progressImages.length > 0 && (
          <section className="card p-6 mb-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Construction progress</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {progressImages.map((att) => (
                <a
                  key={att.id}
                  href={att.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-lg overflow-hidden border border-gray-200 aspect-square"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={att.fileUrl}
                    alt={att.fileName || 'Progress'}
                    className="h-full w-full object-cover"
                  />
                </a>
              ))}
            </div>
          </section>
        )}

        {/* Floor plans */}
        {floorplans.length > 0 && (
          <section className="card p-6 mb-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Floor plans</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {floorplans.map((att) => (
                <a
                  key={att.id}
                  href={att.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-lg overflow-hidden border border-gray-200"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={att.fileUrl}
                    alt={att.fileName || 'Floor plan'}
                    className="w-full h-auto object-contain max-h-96"
                  />
                </a>
              ))}
            </div>
          </section>
        )}

        {/* Other images */}
        {images.length > 0 && (
          <section className="card p-6 mb-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Photos</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {images.map((att) => (
                <a
                  key={att.id}
                  href={att.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-lg overflow-hidden border border-gray-200 aspect-square"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={att.fileUrl}
                    alt={att.fileName || 'Photo'}
                    className="h-full w-full object-cover"
                  />
                </a>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* 3D modal */}
      {active3dUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setActive3dUrl(null)}
          role="dialog"
          aria-modal="true"
          aria-label="3D Preview"
        >
          <div
            className="relative flex max-h-[85vh] w-full max-w-4xl flex-col rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
              <span className="text-sm font-medium text-gray-700">3D Preview</span>
              <button
                type="button"
                onClick={() => setActive3dUrl(null)}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                aria-label="Close"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="relative min-h-[400px] flex-1 overflow-hidden rounded-b-2xl">
              <iframe
                src={active3dUrl}
                title="3D Preview"
                className="absolute inset-0 h-full w-full border-0"
                allowFullScreen
                allow="autoplay; fullscreen; web-share; xr-spatial-tracking"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
