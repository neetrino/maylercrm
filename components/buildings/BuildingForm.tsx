'use client';

import { useState, useEffect, useRef } from 'react';
import type { Building, District } from '@prisma/client';

type FloorPlan = { id: number; floor: number; fileUrl: string; fileName: string | null };

type BuildingWithDistrict = Building & {
  district: District;
  floorPlans?: FloorPlan[];
  floorsCount?: number | null;
};

interface BuildingFormProps {
  building: BuildingWithDistrict | null;
  districts: District[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function BuildingForm({
  building,
  districts,
  onClose,
  onSuccess,
}: BuildingFormProps) {
  const [districtId, setDistrictId] = useState<number>(districts[0]?.id || 0);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [floorsCount, setFloorsCount] = useState<number | ''>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fullBuilding, setFullBuilding] = useState<BuildingWithDistrict | null>(null);
  const [uploadingFloor, setUploadingFloor] = useState<number | null>(null);
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  useEffect(() => {
    if (building) {
      setDistrictId(building.districtId);
      setName(building.name);
      setSlug(building.slug);
      setFloorsCount(building.floorsCount ?? '');
      setFullBuilding(building);
      if (building.id) {
        fetch(`/api/buildings/${building.id}`)
          .then((r) => r.ok ? r.json() : null)
          .then((data) => {
            if (data) {
              setFullBuilding(data);
              if (data.floorsCount != null) setFloorsCount(data.floorsCount);
            }
          })
          .catch(() => {});
      }
    } else if (districts.length > 0) {
      setDistrictId(districts[0].id);
      setFloorsCount('');
      setFullBuilding(null);
    }
  }, [building, districts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const url = building ? `/api/buildings/${building.id}` : '/api/buildings';
      const method = building ? 'PUT' : 'POST';
      const body: Record<string, unknown> = { districtId, name, slug };
      if (building) {
        body.floorsCount = floorsCount === '' ? null : Number(floorsCount);
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save');
      }

      const updated = await response.json();
      if (building && updated.floorPlans) setFullBuilding(updated);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  const handleFloorPlanUpload = async (floor: number, file: File) => {
    if (!building?.id) return;
    setUploadingFloor(floor);
    try {
      const form = new FormData();
      form.append('floor', String(floor));
      form.append('file', file);
      const res = await fetch(`/api/buildings/${building.id}/floor-plans`, {
        method: 'POST',
        body: form,
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Upload failed');
      }
      const data = await fetch(`/api/buildings/${building.id}`).then((r) => r.json());
      setFullBuilding(data);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploadingFloor(null);
    }
  };

  const handleRemoveFloorPlan = async (floor: number) => {
    if (!building?.id || !confirm('Remove this floor plan?')) return;
    try {
      const res = await fetch(`/api/buildings/${building.id}/floor-plans/${floor}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Delete failed');
      const data = await fetch(`/api/buildings/${building.id}`).then((r) => r.json());
      setFullBuilding(data);
    } catch {
      alert('Failed to remove');
    }
  };

  const floorPlans = fullBuilding?.floorPlans ?? [];
  const floorsNum = floorsCount === '' ? 0 : Math.max(0, Number(floorsCount));
  const getPlanForFloor = (f: number) => floorPlans.find((p) => p.floor === f);

  const handleNameChange = (value: string) => {
    setName(value);
    if (!building) {
      const autoSlug = value
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
      setSlug(autoSlug);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="card w-full max-w-md p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {building ? 'Edit Building' : 'Create Building'}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {building ? 'Update building information' : 'Add a new building'}
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              District *
            </label>
            <select
              value={districtId}
              onChange={(e) => setDistrictId(parseInt(e.target.value))}
              required
              disabled={!!building}
              className="input-field disabled:bg-gray-100"
            >
              {districts.map((district) => (
                <option key={district.id} value={district.id}>
                  {district.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              required
              className="input-field"
              placeholder="Building 1"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Slug *
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
              pattern="[a-z0-9-]+"
              className="input-field"
              placeholder="tower-1"
            />
            <p className="mt-1 text-xs text-gray-500">
              Lowercase letters, numbers, and hyphens only
            </p>
          </div>

          {building && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Number of floors
              </label>
              <input
                type="number"
                min={0}
                value={floorsCount}
                onChange={(e) =>
                  setFloorsCount(e.target.value === '' ? '' : parseInt(e.target.value, 10) || 0)
                }
                className="input-field"
                placeholder="e.g. 8"
              />
              <p className="mt-1 text-xs text-gray-500">
                Used for Floor plan view: attach one plan image per floor below.
              </p>
            </div>
          )}

          {building && floorsNum > 0 && (
            <div className="border-t border-gray-200 pt-4">
              <h3 className="mb-3 text-sm font-semibold text-gray-900">Floor plans (for Floor view)</h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {Array.from({ length: floorsNum }, (_, i) => i + 1).map((f) => {
                  const plan = getPlanForFloor(f);
                  return (
                    <div
                      key={f}
                      className="flex flex-col items-center rounded-lg border border-gray-200 bg-gray-50 p-3"
                    >
                      <span className="mb-2 text-xs font-medium text-gray-600">Floor {f}</span>
                      {plan ? (
                        <div className="relative w-full">
                          <a
                            href={plan.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block aspect-[4/3] overflow-hidden rounded border border-gray-200 bg-white"
                          >
                            {plan.fileUrl.toLowerCase().match(/\.(pdf)$/) ? (
                              <div className="flex h-full items-center justify-center">
                                <span className="text-xs text-gray-500">PDF</span>
                              </div>
                            ) : (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img
                                src={plan.fileUrl}
                                alt={`Floor ${f}`}
                                className="h-full w-full object-cover"
                              />
                            )}
                          </a>
                          <div className="mt-1 flex justify-between gap-1">
                            <button
                              type="button"
                              onClick={() => handleRemoveFloorPlan(f)}
                              className="text-xs text-red-600 hover:underline"
                            >
                              Remove
                            </button>
                            <label className="cursor-pointer text-xs text-blue-600 hover:underline">
                              Replace
                              <input
                                ref={(el) => { fileInputRefs.current[f] = el; }}
                                type="file"
                                accept="image/*,.pdf"
                                className="sr-only"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleFloorPlanUpload(f, file);
                                  e.target.value = '';
                                }}
                              />
                            </label>
                          </div>
                        </div>
                      ) : (
                        <label className="flex w-full cursor-pointer flex-col items-center justify-center rounded border-2 border-dashed border-gray-300 py-4 transition hover:border-blue-400 hover:bg-gray-100">
                          <input
                            ref={(el) => { fileInputRefs.current[f] = el; }}
                            type="file"
                            accept="image/*,.pdf"
                            className="sr-only"
                            disabled={uploadingFloor === f}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFloorPlanUpload(f, file);
                              e.target.value = '';
                            }}
                          />
                          {uploadingFloor === f ? (
                            <span className="text-xs text-gray-500">Uploading...</span>
                          ) : (
                            <span className="text-xs text-gray-500">Upload plan</span>
                          )}
                        </label>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
            >
              {loading ? 'Saving...' : building ? 'Save' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
