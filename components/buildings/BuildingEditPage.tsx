'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import BuildingForm from './BuildingForm';
import type { Building, District } from '@prisma/client';

type BuildingWithDistrict = Building & {
  district: District;
  floorPlans?: { id: number; floor: number; fileUrl: string; fileName: string | null }[];
  floorsCount?: number | null;
};

export default function BuildingEditPage({ buildingId }: { buildingId: number }) {
  const [building, setBuilding] = useState<BuildingWithDistrict | null>(null);
  const [districts, setDistricts] = useState<District[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      fetch(`/api/buildings/${buildingId}`).then((r) => (r.ok ? r.json() : null)),
      fetch('/api/districts').then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([b, d]) => {
        setBuilding(b);
        setDistricts(Array.isArray(d) ? d : []);
        if (!b) setError('Building not found');
      })
      .catch(() => setError('Failed to load'))
      .finally(() => setLoading(false));
  }, [buildingId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (error || !building) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-red-800">{error || 'Building not found'}</p>
        <Link href="/admin/buildings" className="mt-2 inline-block text-sm text-blue-600 hover:underline">
          ← Back to Buildings
        </Link>
      </div>
    );
  }

  return (
    <BuildingForm
      building={building}
      districts={districts}
      standalone
    />
  );
}
