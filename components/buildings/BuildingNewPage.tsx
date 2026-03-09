'use client';

import { useState, useEffect } from 'react';
import BuildingForm from './BuildingForm';
import type { District } from '@prisma/client';

export default function BuildingNewPage() {
  const [districts, setDistricts] = useState<District[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/districts')
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setDistricts(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <BuildingForm
      building={null}
      districts={districts}
      standalone
    />
  );
}
