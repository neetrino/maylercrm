'use client';

import { useState, useEffect } from 'react';
import ImageLightbox from '@/components/ui/ImageLightbox';
import { formatAmd } from '@/lib/formatAmd';
import { getIframeSrc } from '@/lib/getEmbedPreviewUrl';

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

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const infoRows = [
    apartment.ownershipName && { icon: 'person', label: 'Owner', value: apartment.ownershipName },
    { icon: 'area', label: 'Area', value: apartment.sqm ? `${apartment.sqm} sq/m` : '—' },
    { icon: 'floor', label: 'Floor', value: apartment.floor != null ? String(apartment.floor) : '—' },
    { icon: 'price', label: 'Total price', value: apartment.total_price ? formatAmd(apartment.total_price) : '—' },
    { icon: 'price2', label: 'Price per m²', value: apartment.price_sqm ? formatAmd(apartment.price_sqm) : '—' },
  ].filter(Boolean) as { icon: string; label: string; value: string }[];

  return (
    <div className="min-h-screen bg-[#f8f9fc]">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Hero — modern strip */}
        <header className="relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 via-slate-800 to-slate-900 px-6 py-10 shadow-xl sm:px-10 lg:py-12">
          <div className="relative z-10">
            <p className="text-sm font-medium uppercase tracking-widest text-slate-300">
              {apartment.district_name} · {apartment.building_name}
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
              Apartment {apartment.apartmentNo}
            </h1>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <span
                className={`inline-flex rounded-full px-4 py-2 text-sm font-semibold ${getStatusColor(apartment.status)}`}
              >
                {getStatusLabel(apartment.status)}
              </span>
              {apartment.total_price && (
                <span className="text-lg font-semibold text-white">
                  {formatAmd(apartment.total_price)}
                </span>
              )}
            </div>
          </div>
          <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-white/5 to-transparent" />
        </header>

        {/* Section nav — horizontal anchor links */}
        <nav className="mb-8 flex flex-wrap gap-2 border-b border-slate-200/80 bg-white/80 py-3 px-4 rounded-xl backdrop-blur sm:gap-3 sm:px-5">
          <button type="button" onClick={() => scrollTo('information')} className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900">
            Information
          </button>
          {agreementFiles.length > 0 && (
            <button type="button" onClick={() => scrollTo('legal')} className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900">
              Legal Documents
            </button>
          )}
          {floorplans.length > 0 && (
            <button type="button" onClick={() => scrollTo('floor-plans')} className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900">
              2D Floor Plans
            </button>
          )}
          {threeDSections.length > 0 && (
            <button type="button" onClick={() => scrollTo('3d')} className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900">
              3D Tours
            </button>
          )}
          {progressImages.length > 0 && (
            <button type="button" onClick={() => scrollTo('stages')} className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900">
              Stages
            </button>
          )}
          {images.length > 0 && (
            <button type="button" onClick={() => scrollTo('photos')} className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900">
              Photos
            </button>
          )}
        </nav>

        {/* Information — dark panel with icons (pro style) */}
        <section id="information" className="mb-12 scroll-mt-6">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="rounded-2xl bg-slate-800 px-6 py-6 shadow-xl lg:w-[340px] lg:shrink-0">
              <h2 className="border-b border-slate-600/80 pb-4 text-xl font-bold text-white">Information</h2>
              <ul className="mt-4 space-y-4">
                {infoRows.map((row) => (
                  <li key={row.label} className="flex items-start gap-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-700/80 text-slate-300">
                      {row.icon === 'person' && (
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                      )}
                      {row.icon === 'area' && (
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
                      )}
                      {row.icon === 'floor' && (
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                      )}
                      {(row.icon === 'price' || row.icon === 'price2') && (
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      )}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-medium uppercase tracking-wider text-slate-400">{row.label}</p>
                      <p className="mt-0.5 font-medium text-white">{row.value}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="min-w-0 flex-1 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm lg:p-8">
              {apartment.floorplanDistribution && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Floor plan description</h3>
                  <p className="mt-2 whitespace-pre-wrap text-slate-800">{apartment.floorplanDistribution}</p>
                </div>
              )}
              {apartment.notes && (
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Notes</h3>
                  <p className="mt-2 whitespace-pre-wrap text-slate-800">{apartment.notes}</p>
                </div>
              )}
              {!apartment.floorplanDistribution && !apartment.notes && (
                <p className="text-slate-500">No additional description.</p>
              )}
            </div>
          </div>
        </section>

        {/* Legal / PDF documents — icon + Download like CRM */}
        {agreementFiles.length > 0 && (
          <section id="legal" className="mb-12 scroll-mt-6 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8 lg:p-10">
            <h2 className="mb-6 border-l-4 border-slate-800 pl-4 text-xl font-bold text-slate-900">Legal Documents</h2>
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
          <section id="floor-plans" className="mb-12 scroll-mt-6 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8 lg:p-10">
            <h2 className="mb-6 border-l-4 border-slate-800 pl-4 text-xl font-bold text-slate-900">2D Floor plans</h2>
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
                        className="h-auto max-h-[28rem] w-full cursor-pointer object-contain"
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
        {threeDSections.map(({ label, url }, threeIdx) => {
          const iframeSrc = url ? getIframeSrc(url) : '';
          return (
            <section key={label} id={threeIdx === 0 ? '3d' : undefined} className={threeIdx === 0 ? 'mb-12 scroll-mt-6' : 'mb-12'}>
              <h2 className="mb-3 border-l-4 border-slate-800 pl-4 text-xl font-bold text-slate-900">{label}</h2>
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="relative min-h-[70vh] w-full bg-slate-100">
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
          <section id="stages" className="mb-12 scroll-mt-6 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8 lg:p-10">
            <h2 className="mb-6 border-l-4 border-slate-800 pl-4 text-xl font-bold text-slate-900">Stages / Construction progress</h2>
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
          <section id="photos" className="mb-12 scroll-mt-6 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8 lg:p-10">
            <h2 className="mb-6 border-l-4 border-slate-800 pl-4 text-xl font-bold text-slate-900">Photos</h2>
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
