'use client';

import { useEffect } from 'react';

type ImageLightboxProps = {
  urls: string[];
  currentIndex: number;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
};

export default function ImageLightbox({
  urls,
  currentIndex,
  onClose,
  onPrev,
  onNext,
}: ImageLightboxProps) {
  const url = urls[currentIndex];
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < urls.length - 1;

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && hasPrev) onPrev?.();
      if (e.key === 'ArrowRight' && hasNext) onNext?.();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose, onPrev, onNext, hasPrev, hasNext]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Image viewer"
    >
      <div
        className="relative flex max-h-full max-w-full items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {urls.length > 1 && hasPrev && (
          <button
            type="button"
            onClick={onPrev}
            className="absolute left-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/20 p-3 text-white hover:bg-white/30"
            aria-label="Previous"
          >
            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt=""
          className="max-h-[90vh] max-w-full object-contain"
          onClick={(e) => e.stopPropagation()}
        />
        {urls.length > 1 && hasNext && (
          <button
            type="button"
            onClick={onNext}
            className="absolute right-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/20 p-3 text-white hover:bg-white/30"
            aria-label="Next"
          >
            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 rounded-full bg-white/20 p-2 text-white hover:bg-white/30"
        aria-label="Close"
      >
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      {urls.length > 1 && (
        <span className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded bg-black/50 px-3 py-1 text-sm text-white">
          {currentIndex + 1} / {urls.length}
        </span>
      )}
    </div>
  );
}
