'use client';

import { useState, useEffect } from 'react';
import ImageLightbox from '@/components/ui/ImageLightbox';

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

/** Prefer embed URL for known 3D hosts; otherwise use original URL so iframe still tries to show content. */
function getIframeSrc(url: string): string {
  const u = url.trim();
  if (u.includes('matterport.com') || u.includes('sketchfab.com')) return getEmbedPreviewUrl(u);
  return u;
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
  const [lightbox, setLightbox] = useState<{ urls: string[]; index: number } | null>(null);

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
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mb-4 inline-block h-10 w-10 animate-spin rounded-full border-4 border-slate-300 border-t-slate-600" />
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !apartment) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
          <p className="font-medium text-red-800">{error || 'Not found'}</p>
          <p className="mt-2 text-sm text-red-600">This link may be invalid or expired.</p>
        </div>
      </div>
    );
  }

  const attachments = apartment.attachments || [];
  const agreementFiles = attachments.filter((a) => a.fileType === 'AGREEMENT');
  const progressImages = attachments.filter((a) => a.fileType === 'PROGRESS_IMAGE');
  const floorplans = attachments.filter((a) => a.fileType === 'FLOORPLAN');
  const images = attachments.filter((a) => a.fileType === 'IMAGE');

  const threeDSections = [
    { label: '3D Tour', url: apartment.matterLink },
    { label: 'Exterior', url: apartment.exteriorLink },
    { label: 'Exterior 2', url: apartment.exteriorLink2 },
  ].filter((x) => x.url);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Wide container: use most of viewport */}
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Hero / Header — full width */}
        <header className="mb-10 rounded-2xl border border-slate-200 bg-white px-6 py-8 shadow-sm sm:px-8 lg:px-10">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Apartment {apartment.apartmentNo}
          </h1>
          <p className="mt-2 text-lg text-slate-600">
            {apartment.district_name} — {apartment.building_name}
          </p>
          <div className="mt-4">
            <span
              className={`inline-flex rounded-full border px-4 py-1.5 text-sm font-medium ${getStatusColor(apartment.status)}`}
            >
              {getStatusLabel(apartment.status)}
            </span>
          </div>
        </header>

        {/* Information block — grid, wide */}
        <section className="mb-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 lg:p-10">
          <h2 className="mb-6 text-xl font-semibold text-slate-900">Information</h2>
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
            {apartment.ownershipName && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Owner</p>
                <p className="mt-1 font-medium text-slate-900">{apartment.ownershipName}</p>
              </div>
            )}
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Area</p>
              <p className="mt-1 font-medium text-slate-900">{apartment.sqm ? `${apartment.sqm} sq/m` : '—'}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Floor</p>
              <p className="mt-1 font-medium text-slate-900">{apartment.floor != null ? apartment.floor : '—'}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Total price</p>
              <p className="mt-1 font-semibold text-slate-900">
                {apartment.total_price ? `${(apartment.total_price / 1_000_000).toFixed(1)}M AMD` : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Price per m²</p>
              <p className="mt-1 font-medium text-slate-900">
                {apartment.price_sqm ? `${(apartment.price_sqm / 1000).toFixed(0)}K AMD` : '—'}
              </p>
            </div>
          </div>
          {apartment.floorplanDistribution && (
            <div className="mt-6 border-t border-slate-100 pt-6">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Floor plan description</p>
              <p className="mt-2 whitespace-pre-wrap text-slate-900">{apartment.floorplanDistribution}</p>
            </div>
          )}
          {apartment.notes && (
            <div className="mt-4 border-t border-slate-100 pt-4">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Notes</p>
              <p className="mt-2 whitespace-pre-wrap text-slate-900">{apartment.notes}</p>
            </div>
          )}
        </section>

        {/* Legal / PDF documents — icon + Download like CRM */}
        {agreementFiles.length > 0 && (
          <section className="mb-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 lg:p-10">
            <h2 className="mb-6 text-xl font-semibold text-slate-900">Legal Documents</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {agreementFiles.map((file) => (
                <a
                  key={file.id}
                  href={file.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50 p-6 transition-colors hover:bg-slate-100"
                >
                  <svg className="h-14 w-14 shrink-0 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                  <span className="mt-2 text-center text-xs font-medium text-slate-600">PDF / Doc</span>
                  <span className="mt-1 max-w-full truncate px-2 text-center text-xs text-slate-500" title={file.fileName || undefined}>
                    {file.fileName || 'Document'}
                  </span>
                  <span className="mt-2 rounded-lg bg-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700">Download</span>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* 2D Floor plans — PDF: icon like CRM; image: thumbnail */}
        {floorplans.length > 0 && (
          <section className="mb-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 lg:p-10">
            <h2 className="mb-6 text-xl font-semibold text-slate-900">2D Floor plans</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {floorplans.map((att) => {
                const isPdf = (att.fileUrl?.toLowerCase().endsWith('.pdf') || att.fileName?.toLowerCase().endsWith('.pdf')) ?? false;
                if (isPdf) {
                  return (
                    <a
                      key={att.id}
                      href={att.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50 p-6 transition-colors hover:bg-slate-100"
                    >
                      <svg className="h-14 w-14 shrink-0 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                      </svg>
                      <span className="mt-2 text-center text-xs font-medium text-slate-600">PDF</span>
                      <span className="mt-1 max-w-full truncate px-2 text-center text-xs text-slate-500" title={att.fileName || undefined}>
                        {att.fileName || 'Floor plan'}
                      </span>
                      <span className="mt-2 rounded-lg bg-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700">Download</span>
                    </a>
                  );
                }
                return (
                  <div key={att.id} className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                    <button
                      type="button"
                      onClick={() => setLightbox({
                        urls: floorplans.filter((a) => !(a.fileUrl?.toLowerCase().endsWith('.pdf') || a.fileName?.toLowerCase().endsWith('.pdf'))).map((a) => a.fileUrl),
                        index: floorplans.filter((a) => !(a.fileUrl?.toLowerCase().endsWith('.pdf') || a.fileName?.toLowerCase().endsWith('.pdf'))).findIndex((a) => a.id === att.id),
                      })}
                      className="block w-full text-left"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={att.fileUrl}
                        alt={att.fileName || 'Floor plan'}
                        className="h-auto w-full cursor-pointer object-contain"
                        style={{ maxHeight: '28rem' }}
                      />
                    </button>
                    <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
                      <span className="text-sm font-medium text-slate-700">{att.fileName || 'Floor plan'}</span>
                      <a href={att.fileUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-slate-500 hover:underline">Download</a>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* 3D — always full preview block: iframe with 3D content visible immediately (no "External link" fallback) */}
        {threeDSections.map(({ label, url }) => {
          const iframeSrc = url ? getIframeSrc(url) : '';
          return (
            <section key={label} className="mb-10">
              <h2 className="mb-3 text-xl font-semibold text-slate-900">{label}</h2>
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div
                  className="relative w-full bg-slate-100"
                  style={{ minHeight: '70vh' }}
                >
                  <iframe
                    src={iframeSrc}
                    title={label}
                    className="absolute inset-0 h-full w-full border-0"
                    allowFullScreen
                    allow="autoplay; fullscreen; web-share; xr-spatial-tracking"
                  />
                </div>
                <div className="flex items-center justify-between border-t border-slate-200 bg-white px-4 py-2 text-sm text-slate-500">
                  <span>Interactive 3D</span>
                  <a
                    href={url!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-600 underline hover:text-slate-900"
                  >
                    Open in new tab
                  </a>
                </div>
              </div>
            </section>
          );
        })}

        {/* Progress Images / Stages — open in lightbox on site */}
        {progressImages.length > 0 && (
          <section className="mb-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 lg:p-10">
            <h2 className="mb-6 text-xl font-semibold text-slate-900">Stages / Construction progress</h2>
            <p className="mb-6 text-sm text-slate-600">Photo report of the construction progress.</p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {progressImages.map((att, idx) => (
                <button
                  key={att.id}
                  type="button"
                  onClick={() => setLightbox({ urls: progressImages.map((a) => a.fileUrl), index: idx })}
                  className="group block w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-50 text-left"
                >
                  <div className="aspect-square overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={att.fileUrl}
                      alt={att.fileName || 'Progress'}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  </div>
                  {att.fileName && (
                    <div className="border-t border-slate-100 px-3 py-2">
                      <span className="line-clamp-2 text-xs text-slate-600">{att.fileName}</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Other photos — open in lightbox on site */}
        {images.length > 0 && (
          <section className="mb-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 lg:p-10">
            <h2 className="mb-6 text-xl font-semibold text-slate-900">Photos</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {images.map((att, idx) => (
                <button
                  key={att.id}
                  type="button"
                  onClick={() => setLightbox({ urls: images.map((a) => a.fileUrl), index: idx })}
                  className="group block w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-50 text-left"
                >
                  <div className="aspect-square overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={att.fileUrl}
                      alt={att.fileName || 'Photo'}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}
      </div>

      {lightbox && (
        <ImageLightbox
          urls={lightbox.urls}
          currentIndex={lightbox.index}
          onClose={() => setLightbox(null)}
          onPrev={lightbox.index > 0 ? () => setLightbox((p) => p && { ...p, index: p.index - 1 }) : undefined}
          onNext={lightbox.index < lightbox.urls.length - 1 ? () => setLightbox((p) => p && { ...p, index: p.index + 1 }) : undefined}
        />
      )}
    </div>
  );
}
