'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { Building, District } from '@prisma/client';

type BuildingWithDistrict = Building & {
  district: District;
};

export default function BuildingsList() {
  const [buildings, setBuildings] = useState<BuildingWithDistrict[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState<number | null>(null);

  const fetchDistricts = async () => {
    try {
      const response = await fetch('/api/districts');
      if (!response.ok) throw new Error('Failed to load districts');
      const data = await response.json();
      setDistricts(data);
    } catch {
      // ignore
    }
  };

  const fetchBuildings = async () => {
    try {
      setLoading(true);
      const url = selectedDistrict
        ? `/api/buildings?districtId=${selectedDistrict}`
        : '/api/buildings';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to load');
      const data = await response.json();
      setBuildings(data);
    } catch {
      setError('Failed to load buildings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDistricts();
  }, []);

  useEffect(() => {
    fetchBuildings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDistrict]);

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this building?')) {
      return;
    }

    try {
      const response = await fetch(`/api/buildings/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete');
      }

      fetchBuildings();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div>
      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">
            Filter by District:
          </label>
          <select
            value={selectedDistrict || ''}
            onChange={(e) =>
              setSelectedDistrict(
                e.target.value ? parseInt(e.target.value) : null
              )
            }
            className="rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          >
            <option value="">All Districts</option>
            {districts.map((district) => (
              <option key={district.id} value={district.id}>
                {district.name}
              </option>
            ))}
          </select>
        </div>
        <Link
          href="/admin/buildings/new"
          className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          + Create Building
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                District
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Slug
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {buildings.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  No buildings. Create the first building.
                </td>
              </tr>
            ) : (
              buildings.map((building) => (
                <tr key={building.id}>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    {building.id}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    {building.district.name}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                    {building.name}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {building.slug}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                    <Link
                      href={`/admin/buildings/${building.id}`}
                      className="mr-2 text-blue-600 hover:text-blue-900"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(building.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
