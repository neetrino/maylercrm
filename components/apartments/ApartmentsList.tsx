'use client';

import { useState, useEffect, useCallback, memo } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import type { Building, District } from '@prisma/client';
import ApartmentForm from './ApartmentForm';

type Attachment = {
  id: number;
  fileType: string;
  fileUrl: string;
  fileName?: string | null;
};

type Apartment = {
  id: number;
  apartmentNo: string;
  status: string;
  sqm: number | null;
  total_price: number | null;
  total_paid: number | null;
  balance: number | null;
  floor?: number | null;
  building: Building & { district: District };
  updatedAt: string;
  attachments?: Attachment[];
};

// Мемоизированный компонент карточки квартиры для оптимизации рендеринга
const ApartmentCardItem = memo(({ 
  apt, 
  onStatusChange, 
  getStatusColor 
}: { 
  apt: Apartment; 
  onStatusChange: (id: number, status: string) => void;
  getStatusColor: (status: string) => string;
}) => {
  return (
    <div className="card card-hover p-5">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {apt.apartmentNo}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {apt.building.district.name} - {apt.building.name}
          </p>
        </div>
        <select
          value={apt.status}
          onChange={(e) => onStatusChange(apt.id, e.target.value)}
          className={`badge border ${getStatusColor(apt.status)} cursor-pointer text-xs appearance-none bg-right bg-no-repeat pr-8 pl-3 py-1.5 font-medium transition-colors`}
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12' fill='none'%3E%3Cpath d='M2 4L6 8L10 4' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
            backgroundPosition: 'right 0.75rem center',
            paddingRight: '2rem',
          }}
        >
          <option value="UPCOMING">Upcoming</option>
          <option value="AVAILABLE">Available</option>
          <option value="RESERVED">Reserved</option>
          <option value="SOLD">Sold</option>
        </select>
      </div>

      <div className="space-y-3 border-t border-gray-100 pt-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Area</span>
          <span className="font-medium text-gray-900">
            {apt.sqm ? `${apt.sqm} m²` : '-'}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Price</span>
          <span className="font-semibold text-gray-900">
            {apt.total_price
              ? `${(apt.total_price / 1000000).toFixed(1)}M AMD`
              : '-'}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Paid</span>
          <span className="font-medium text-gray-900">
            {apt.total_paid
              ? `${(apt.total_paid / 1000000).toFixed(1)}M AMD`
              : '-'}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Balance</span>
          <span className="font-medium text-gray-900">
            {apt.balance
              ? `${(apt.balance / 1000000).toFixed(1)}M AMD`
              : '-'}
          </span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100">
        <Link
          href={`/apartments/${apt.id}`}
          className="block w-full rounded-lg bg-gray-50 px-4 py-2 text-center text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
        >
          View Details
        </Link>
      </div>
    </div>
  );
});

ApartmentCardItem.displayName = 'ApartmentCardItem';

export default function ApartmentsList() {
  const { data: session } = useSession();
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [buildings, setBuildings] = useState<(Building & { district: District })[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedBuilding, setSelectedBuilding] = useState<number | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState(''); // для отображения в инпуте (с debounce)
  const [showForm, setShowForm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'floor'>('grid');
  const [sortBy, setSortBy] = useState<string>('apartmentNo');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 21,
    total: 0,
    total_pages: 0,
  });
  const isAdmin = session?.user?.role === 'ADMIN';

  const fetchDistricts = async () => {
    try {
      const response = await fetch('/api/districts');
      if (response.ok) {
        const data = await response.json();
        setDistricts(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchBuildings = async () => {
    try {
      const response = await fetch('/api/buildings');
      if (response.ok) {
        const data = await response.json();
        setBuildings(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchApartments = useCallback(async (page: number = 1) => {
    try {
      setLoading(true);
      let url = `/api/apartments?page=${page}&limit=21&sortBy=${sortBy}&sortOrder=${sortOrder}`;
      if (selectedBuilding) {
        url += `&buildingId=${selectedBuilding}`;
      }
      if (selectedStatus) {
        url += `&status=${selectedStatus}`;
      }
      if (searchQuery.trim()) {
        url += `&search=${encodeURIComponent(searchQuery.trim())}`;
      }
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to load');
      const data = await response.json();
      setApartments(data.items || []);
      setPagination(data.pagination || { page: 1, limit: 21, total: 0, total_pages: 0 });
    } catch (err) {
      setError('Failed to load apartments');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [sortBy, sortOrder, selectedBuilding, selectedStatus, searchQuery]);

  useEffect(() => {
    fetchDistricts();
    fetchBuildings();
  }, []);

  // Debounce поиска: обновляем searchQuery через 300ms после последнего ввода
  useEffect(() => {
    const t = setTimeout(() => {
      setSearchQuery(searchInput);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  // При смене фильтров сбрасываем на первую страницу
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedBuilding, selectedStatus, searchQuery, sortBy, sortOrder]);

  // Один запрос списка: при загрузке и при смене страницы/фильтров (без двойного вызова при монтировании)
  useEffect(() => {
    fetchApartments(currentPage);
  }, [currentPage, selectedBuilding, selectedStatus, searchQuery, sortBy, sortOrder, fetchApartments]);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      // Переключаем порядок сортировки
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Устанавливаем новое поле сортировки
      setSortBy(field);
      setSortOrder('asc');
    }
    setCurrentPage(1); // Сбрасываем на первую страницу при изменении сортировки
  };

  const SortableHeader = ({ field, label, align = 'left' }: { field: string; label: string; align?: 'left' | 'right' }) => {
    const isActive = sortBy === field;
    return (
      <th
        className={`px-6 py-3 text-${align} text-xs font-medium uppercase tracking-wider text-gray-500 cursor-pointer select-none hover:bg-gray-100 transition-colors`}
        onClick={() => handleSort(field)}
      >
        <div className="flex items-center gap-1">
          <span>{label}</span>
          <span className="text-gray-400">
            {isActive ? (
              sortOrder === 'asc' ? '↑' : '↓'
            ) : (
              <span className="text-gray-300">⇅</span>
            )}
          </span>
        </div>
      </th>
    );
  };

  const handleStatusChange = useCallback(async (id: number, newStatus: string) => {
    // Оптимистичное обновление UI - сразу обновляем статус в списке
    setApartments((prevApartments) =>
      prevApartments.map((apt) =>
        apt.id === id ? { ...apt, status: newStatus } : apt
      )
    );

    // Делаем запрос асинхронно без блокировки UI
    // Используем setTimeout для неблокирующего выполнения
    setTimeout(async () => {
      try {
        const response = await fetch(`/api/apartments/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        });

        if (!response.ok) {
          throw new Error('Failed to update status');
        }

        // Обновляем только текущую страницу в фоне (не блокируя UI)
        // Используем requestIdleCallback если доступен, иначе setTimeout
        if ('requestIdleCallback' in window) {
          requestIdleCallback(() => {
            fetchApartments(currentPage);
          });
        } else {
          setTimeout(() => {
            fetchApartments(currentPage);
          }, 100);
        }
      } catch (err) {
        // Откатываем оптимистичное обновление при ошибке
        setApartments((prevApartments) =>
          prevApartments.map((apt) =>
            apt.id === id ? { ...apt, status: apt.status } : apt
          )
        );
        alert('Failed to update status');
        console.error(err);
      }
    }, 0);
  }, [currentPage, fetchApartments]);

  const getStatusColor = useCallback((status: string) => {
    switch (status.toLowerCase()) {
      case 'upcoming':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'available':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'reserved':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'sold':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  }, []);

  const getStatusLabel = (status: string) => {
    switch (status.toLowerCase()) {
      case 'upcoming':
        return 'Upcoming';
      case 'available':
        return 'Available';
      case 'reserved':
        return 'Reserved';
      case 'sold':
        return 'Sold';
      default:
        return status;
    }
  };

  if (loading && apartments.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="text-sm text-gray-600">Loading apartments...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Apartments</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage and view all apartments
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* View mode toggle */}
            <div className="flex rounded-lg border border-gray-300 bg-white p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                title="Grid view"
              >
                <span className="text-base">⊞</span>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  viewMode === 'list'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                title="List view"
              >
                <span className="text-base">☰</span>
              </button>
              <button
                onClick={() => setViewMode('floor')}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  viewMode === 'floor'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                title="Floor view"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="4" y="2" width="16" height="20" rx="1" />
                  <line x1="4" y1="8" x2="20" y2="8" />
                  <line x1="4" y1="14" x2="20" y2="14" />
                </svg>
              </button>
            </div>
            {isAdmin && (
              <button
                onClick={() => setShowForm(true)}
                className="btn-primary"
              >
                + Create Apartment
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="card flex flex-wrap items-end gap-4 p-4">
          <div className="w-full min-w-[200px] max-w-md">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Search
            </label>
            <input
              type="search"
              placeholder="No., building, district, owner..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="input-field"
              aria-label="Search apartments"
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Building
            </label>
            <select
              value={selectedBuilding || ''}
              onChange={(e) =>
                setSelectedBuilding(e.target.value ? parseInt(e.target.value) : null)
              }
              className="input-field"
            >
              <option value="">All Buildings</option>
              {buildings.map((building) => (
                <option key={building.id} value={building.id}>
                  {building.district.name} - {building.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="input-field"
            >
              <option value="">All Statuses</option>
              <option value="UPCOMING">Upcoming</option>
              <option value="AVAILABLE">Available</option>
              <option value="RESERVED">Reserved</option>
              <option value="SOLD">Sold</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {showForm && (
        <ApartmentForm
          buildings={buildings}
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false);
            fetchApartments(currentPage);
          }}
        />
      )}

      {/* Stats */}
      <div className="mb-4 text-sm text-gray-600">
        Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
        {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
        {pagination.total} apartments
      </div>

      {/* Empty state */}
      {apartments.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-gray-500">
            {searchQuery.trim()
              ? 'No apartments match your search. Try different keywords or clear the search.'
              : 'No apartments found. Create the first apartment.'}
          </p>
          {searchQuery.trim() && (
            <button
              type="button"
              onClick={() => { setSearchInput(''); setSearchQuery(''); }}
              className="mt-3 text-sm text-blue-600 hover:underline"
            >
              Clear search
            </button>
          )}
        </div>
      ) : viewMode === 'floor' ? (
        /* Floor view: group by building, then by floor; show floor plan + apartments per floor */
        (() => {
          type GroupKey = string;
          const byBuilding: Record<GroupKey, Apartment[]> = {};
          apartments.forEach((apt) => {
            const key = `${apt.building.id}-${apt.building.district.name}-${apt.building.name}`;
            if (!byBuilding[key]) byBuilding[key] = [];
            byBuilding[key].push(apt);
          });
          const buildingEntries = Object.entries(byBuilding);
          return (
            <div className="space-y-10">
              {buildingEntries.map(([key, buildingApts]) => {
                const byFloor: Record<number | string, Apartment[]> = {};
                buildingApts.forEach((apt) => {
                  const f = apt.floor ?? '—';
                  const k = typeof f === 'number' ? f : '—';
                  if (!byFloor[k]) byFloor[k] = [];
                  byFloor[k].push(apt);
                });
                const floorNumbers = Object.keys(byFloor)
                  .map((k) => (k === '—' ? -Infinity : Number(k)))
                  .filter((n) => Number.isFinite(n))
                  .sort((a, b) => a - b);
                const unknownFloor = byFloor['—'];
                const sortedFloors = floorNumbers.filter((n) => n !== -Infinity);
                if (unknownFloor?.length) sortedFloors.push(-Infinity);
                const firstApt = buildingApts[0];
                const buildingLabel = firstApt
                  ? `${firstApt.building.district.name} — ${firstApt.building.name}`
                  : key;
                return (
                  <div key={key} className="card overflow-hidden">
                    <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
                      <h2 className="text-lg font-semibold text-gray-900">{buildingLabel}</h2>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {sortedFloors.map((floorNum) => {
                        const floorApts = byFloor[floorNum === -Infinity ? '—' : floorNum] ?? [];
                        const floorLabel = floorNum === -Infinity ? '—' : `Floor ${floorNum}`;
                        const buildingMeta = buildings.find((b) => b.id === firstApt.building.id) as (Building & { district: District; floorPlans?: { floor: number; fileUrl: string; fileName: string | null }[] }) | undefined;
                        const buildingFloorPlan = floorNum !== -Infinity ? buildingMeta?.floorPlans?.find((fp) => fp.floor === floorNum) : undefined;
                        const apartmentFloorPlan = floorApts
                          .flatMap((a) => (a.attachments ?? []).filter((at) => at.fileType === 'FLOORPLAN'))
                          .find(Boolean);
                        const floorPlanUrl = buildingFloorPlan?.fileUrl ?? apartmentFloorPlan?.fileUrl;
                        const isPdf = floorPlanUrl?.toLowerCase().endsWith('.pdf');
                        return (
                          <div key={floorLabel} className="p-6">
                            <h3 className="mb-3 text-base font-medium text-gray-800">{floorLabel}</h3>
                            {floorPlanUrl && (
                              <div className="mb-4 flex flex-col items-center rounded-xl border border-gray-200 bg-gray-50 p-2">
                                <p className="mb-2 w-full text-xs font-medium uppercase text-gray-500">Floor plan</p>
                                <a
                                  href={floorPlanUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block max-h-[70vh] max-w-[70vw] rounded-lg"
                                >
                                  {isPdf ? (
                                    <div className="flex h-40 items-center justify-center gap-2 text-gray-600">
                                      <svg className="h-12 w-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                      </svg>
                                      <span className="text-sm">PDF — open</span>
                                    </div>
                                  ) : (
                                    /* eslint-disable-next-line @next/next/no-img-element */
                                    <img
                                      src={floorPlanUrl}
                                      alt="Floor plan"
                                      className="max-h-[70vh] max-w-full w-auto object-contain"
                                    />
                                  )}
                                </a>
                              </div>
                            )}
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                              {floorApts.map((apt) => (
                                <ApartmentCardItem
                                  key={apt.id}
                                  apt={apt}
                                  onStatusChange={handleStatusChange}
                                  getStatusColor={getStatusColor}
                                />
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()
      ) : viewMode === 'grid' ? (
        /* Cards Grid View */
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {apartments.map((apt) => (
            <ApartmentCardItem
              key={apt.id}
              apt={apt}
              onStatusChange={handleStatusChange}
              getStatusColor={getStatusColor}
            />
          ))}
        </div>
      ) : (
        /* List/Table View */
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <SortableHeader field="apartmentNo" label="No" />
                  <SortableHeader field="building" label="Building" />
                  <SortableHeader field="status" label="Status" />
                  <SortableHeader field="sqm" label="Area (m²)" />
                  <SortableHeader field="total_price" label="Price" align="right" />
                  <SortableHeader field="total_paid" label="Paid" align="right" />
                  <SortableHeader field="balance" label="Balance" align="right" />
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {apartments.map((apt) => (
                  <tr key={apt.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                      {apt.apartmentNo}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {apt.building.district.name} - {apt.building.name}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <select
                        value={apt.status}
                        onChange={(e) => handleStatusChange(apt.id, e.target.value)}
                        className={`badge border ${getStatusColor(apt.status)} cursor-pointer text-xs appearance-none bg-right bg-no-repeat pr-8 pl-3 py-1.5 font-medium transition-colors`}
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12' fill='none'%3E%3Cpath d='M2 4L6 8L10 4' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                          backgroundPosition: 'right 0.75rem center',
                          paddingRight: '2rem',
                        }}
                      >
                        <option value="UPCOMING">Upcoming</option>
                        <option value="AVAILABLE">Available</option>
                        <option value="RESERVED">Reserved</option>
                        <option value="SOLD">Sold</option>
                      </select>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                      {apt.sqm ? `${apt.sqm} m²` : '-'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-semibold text-gray-900">
                      {apt.total_price
                        ? `${(apt.total_price / 1000000).toFixed(1)}M AMD`
                        : '-'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-900">
                      {apt.total_paid
                        ? `${(apt.total_paid / 1000000).toFixed(1)}M AMD`
                        : '-'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-900">
                      {apt.balance
                        ? `${(apt.balance / 1000000).toFixed(1)}M AMD`
                        : '-'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                      <Link
                        href={`/apartments/${apt.id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {pagination.total_pages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Page {pagination.page} of {pagination.total_pages}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            <div className="flex space-x-1">
              {(() => {
                const pages = [];
                const totalPages = pagination.total_pages;
                const current = pagination.page;
                
                let startPage = Math.max(1, current - 3);
                let endPage = Math.min(totalPages, current + 3);
                
                if (current <= 4) {
                  startPage = 1;
                  endPage = Math.min(7, totalPages);
                }
                
                if (current >= totalPages - 3) {
                  startPage = Math.max(1, totalPages - 6);
                  endPage = totalPages;
                }
                
                if (startPage > 1) {
                  pages.push(
                    <button
                      key={1}
                      onClick={() => setCurrentPage(1)}
                      className="btn-secondary"
                    >
                      1
                    </button>
                  );
                  if (startPage > 2) {
                    pages.push(
                      <span key="ellipsis-start" className="px-2 text-gray-500">
                        ...
                      </span>
                    );
                  }
                }
                
                for (let i = startPage; i <= endPage; i++) {
                  pages.push(
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i)}
                      className={
                        i === current
                          ? 'rounded-lg border border-blue-600 bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                          : 'btn-secondary'
                      }
                    >
                      {i}
                    </button>
                  );
                }
                
                if (endPage < totalPages) {
                  if (endPage < totalPages - 1) {
                    pages.push(
                      <span key="ellipsis-end" className="px-2 text-gray-500">
                        ...
                      </span>
                    );
                  }
                  pages.push(
                    <button
                      key={totalPages}
                      onClick={() => setCurrentPage(totalPages)}
                      className="btn-secondary"
                    >
                      {totalPages}
                    </button>
                  );
                }
                
                return pages;
              })()}
            </div>

            <button
              onClick={() => setCurrentPage(Math.min(pagination.total_pages, currentPage + 1))}
              disabled={currentPage === pagination.total_pages}
              className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
