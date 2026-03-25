'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import FileUpload from './FileUpload';

/** Converts 3D link (Matterport, Sketchfab) to iframe embed URL for preview */
function getEmbedPreviewUrl(url: string): string {
  try {
    const u = url.trim();
    // Matterport: use /show/?m=ID (same as embed but sometimes different embed policy)
    if (u.includes('matterport.com')) {
      const mMatch = u.match(/[?&]m=([^&]+)/);
      if (mMatch) return `https://my.matterport.com/show/?m=${mMatch[1]}`;
      const spaceMatch = u.match(/\/space\/([A-Za-z0-9_-]+)/);
      if (spaceMatch) return `https://my.matterport.com/show/?m=${spaceMatch[1]}`;
      return u;
    }
    // Sketchfab: 3d-models/ID → models/ID/embed
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

function truncateUrl(url: string, maxLen = 50): string {
  if (url.length <= maxLen) return url;
  return url.slice(0, maxLen - 3) + '...';
}

type Attachment = {
  id: number;
  fileType: string;
  fileUrl: string;
  fileName: string | null;
  fileSize: number | null;
  createdAt: string;
};

type AttachmentsGrouped = {
  agreement_files: Attachment[];
  floorplans_files: Attachment[];
  images_files: Attachment[];
  progress_images_files: Attachment[];
};

/** Преобразует attachments из формата API (массив) в формат для FileUpload (объект с группами) */
function normalizeAttachmentsForUpload(
  attachments: Attachment[] | AttachmentsGrouped | undefined
): AttachmentsGrouped {
  const empty = {
    agreement_files: [],
    floorplans_files: [],
    images_files: [],
    progress_images_files: [],
  };
  if (!attachments) return empty;
  if (Array.isArray(attachments)) {
    return {
      agreement_files: attachments.filter((a) => a.fileType === 'AGREEMENT'),
      floorplans_files: attachments.filter((a) => a.fileType === 'FLOORPLAN'),
      images_files: attachments.filter((a) => a.fileType === 'IMAGE'),
      progress_images_files: attachments.filter((a) => a.fileType === 'PROGRESS_IMAGE'),
    };
  }
  return attachments;
}

type Apartment = {
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
  email: string | null;
  passportTaxNo: string | null;
  phone: string | null;
  salesType: string;
  dealDescription: string | null;
  matterLink: string | null;
  floorplanDistribution: string | null;
  exteriorLink: string | null;
  exteriorLink2: string | null;
  buyerAddress?: string | null;
  otherBuyers?: string | null;
  paymentSchedule?: string | null;
  balanceRemaining?: number | null;
  building_name: string;
  building_slug: string;
  district_name: string;
  district_slug: string;
  updatedAt: string;
  landingToken?: string | null;
  notes?: string | null;
  attachments?: Attachment[] | AttachmentsGrouped;
};

interface ApartmentCardProps {
  apartmentId: number;
}

export default function ApartmentCard({ apartmentId }: ApartmentCardProps) {
  const router = useRouter();
  const [apartment, setApartment] = useState<Apartment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'links'>('overview');
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Apartment>>({});
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewOriginalUrl, setPreviewOriginalUrl] = useState<string | null>(null);
  const [landingCopied, setLandingCopied] = useState(false);

  useEffect(() => {
    // При загрузке страницы всегда обновляем без кэша для получения актуальных данных
    fetchApartment(true, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apartmentId]);

  const fetchApartment = async (skipCache = false, showLoading = true) => {
    try {
      // При обновлении после загрузки файла не используем кэш
      // Добавляем timestamp к URL для обхода кэша
      const url = skipCache 
        ? `/api/apartments/${apartmentId}?t=${Date.now()}`
        : `/api/apartments/${apartmentId}`;
      
      if (showLoading) {
        setLoading(true);
      }
      const response = await fetch(url, {
        cache: skipCache ? 'no-store' : 'default',
      });
      if (!response.ok) {
        if (response.status === 404) {
          router.push('/apartments');
          return;
        }
        throw new Error('Failed to load apartment');
      }
      const data = await response.json();
      setApartment(data);
      setFormData(data);
    } catch (err) {
      setError('Failed to load apartment');
      console.error(err);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  // Функция для обновления после загрузки файла (без кэша)
  const refreshAfterUpload = async () => {
    await fetchApartment(true);
  };

  const handleSave = async () => {
    try {
      const apiData: any = {};
      
      // Вспомогательная функция для преобразования числа
      const parseNumber = (value: any): number | null => {
        if (value === null || value === undefined || value === '') return null;
        const num = typeof value === 'string' ? parseFloat(value) : value;
        return isNaN(num) ? null : num;
      };
      
      // Вспомогательная функция для преобразования строки
      const parseString = (value: any): string | null => {
        if (value === null || value === undefined) return null;
        const str = String(value).trim();
        return str === '' ? null : str;
      };
      
      // Числовые поля - преобразуем в число или null (0 тоже становится null для sqm и priceSqm)
      if (formData.sqm !== undefined) {
        const sqmNum = parseNumber(formData.sqm);
        // Для sqm и priceSqm: отправляем null если значение 0, null или пустое, иначе положительное число
        apiData.sqm = (sqmNum === null || sqmNum === 0) ? null : sqmNum;
      }
      if (formData.price_sqm !== undefined) {
        const priceSqmNum = parseNumber(formData.price_sqm);
        apiData.priceSqm = (priceSqmNum === null || priceSqmNum === 0) ? null : priceSqmNum;
      }
      if (formData.total_paid !== undefined) {
        const totalPaidNum = parseNumber(formData.total_paid);
        apiData.totalPaid = totalPaidNum;
      }
      if (formData.floor !== undefined) {
        const floorNum = parseNumber(formData.floor);
        apiData.floor = (floorNum === null || floorNum === 0) ? null : floorNum;
      }
      if (formData.apartmentNo !== undefined) {
        apiData.apartmentNo = String(formData.apartmentNo).trim();
      }
      if (formData.apartmentType !== undefined) {
        const raw = formData.apartmentType;
        const typeNum = raw == null ? null : Number(raw);
        apiData.apartmentType = typeNum !== null && !isNaN(typeNum) ? typeNum : null;
      }

      // Дата - преобразуем в формат YYYY-MM-DD (без времени)
      if (formData.dealDate !== undefined) {
        if (formData.dealDate === null || formData.dealDate === '') {
          apiData.dealDate = null;
        } else {
          // Если это ISO строка (с T и Z), извлекаем только дату
          // Если это уже YYYY-MM-DD, оставляем как есть
          let dateStr = String(formData.dealDate);
          if (dateStr.includes('T')) {
            // ISO формат: "2026-01-08T00:00:00.000Z" -> "2026-01-08"
            dateStr = dateStr.split('T')[0];
          }
          // Проверяем, что это валидный формат YYYY-MM-DD
          if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
            apiData.dealDate = dateStr;
          } else {
            // Пытаемся преобразовать через Date
            try {
              const date = new Date(dateStr);
              if (!isNaN(date.getTime())) {
                apiData.dealDate = date.toISOString().split('T')[0];
              } else {
                apiData.dealDate = null;
              }
            } catch {
              apiData.dealDate = null;
            }
          }
        }
      }
      
      // Текстовые поля - преобразуем пустые строки в null
      if (formData.ownershipName !== undefined) {
        apiData.ownershipName = parseString(formData.ownershipName);
      }
      if (formData.email !== undefined) {
        apiData.email = parseString(formData.email);
      }
      if (formData.phone !== undefined) {
        apiData.phone = parseString(formData.phone);
      }
      if (formData.passportTaxNo !== undefined) {
        apiData.passportTaxNo = parseString(formData.passportTaxNo);
      }
      if (formData.salesType !== undefined) {
        apiData.salesType = formData.salesType;
      }
      if (formData.dealDescription !== undefined) {
        apiData.dealDescription = parseString(formData.dealDescription);
      }
      if (formData.matterLink !== undefined) {
        apiData.matterLink = parseString(formData.matterLink);
      }
      if (formData.exteriorLink !== undefined) {
        apiData.exteriorLink = parseString(formData.exteriorLink);
      }
      if (formData.exteriorLink2 !== undefined) {
        apiData.exteriorLink2 = parseString(formData.exteriorLink2);
      }
      if (formData.floorplanDistribution !== undefined) {
        apiData.floorplanDistribution = parseString(formData.floorplanDistribution);
      }
      if (formData.notes !== undefined) {
        apiData.notes = parseString(formData.notes);
      }
      if (formData.buyerAddress !== undefined) {
        apiData.buyerAddress = parseString(formData.buyerAddress);
      }
      if (formData.otherBuyers !== undefined) {
        apiData.otherBuyers = parseString(formData.otherBuyers);
      }
      if (formData.paymentSchedule !== undefined) {
        apiData.paymentSchedule = parseString(formData.paymentSchedule);
      }
      // balanceRemaining is calculated in UI (Total Price − Total Paid), not sent from form

      const response = await fetch(`/api/apartments/${apartmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.details && Array.isArray(errorData.details)) {
          const errorMessages = errorData.details.map((err: any) =>
            `${err.path.join('.')}: ${err.message}`
          ).join(', ');
          throw new Error(`Validation error: ${errorMessages}`);
        }
        throw new Error(errorData.error || 'Failed to save');
      }

      const updated = await response.json();
      setApartment(updated);
      setFormData(updated);
      setEditing(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save changes');
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    // Оптимистичное обновление UI - сразу обновляем статус
    const previousStatus = apartment?.status;
    setApartment((prev) => (prev ? { ...prev, status: newStatus } : prev));

    // Делаем запрос асинхронно без блокировки UI
    setTimeout(async () => {
      try {
        const response = await fetch(`/api/apartments/${apartmentId}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        });

        if (!response.ok) throw new Error('Failed to update status');

        const updated = await response.json();
        // Обновляем статус из ответа сервера
        setApartment((prev) => (prev ? { ...prev, status: updated.status.toUpperCase() } : prev));
        
        // Обновляем данные с сервера в фоне (не блокируя UI)
        if ('requestIdleCallback' in window) {
          requestIdleCallback(async () => {
            try {
              const url = `/api/apartments/${apartmentId}?t=${Date.now()}`;
              const refreshResponse = await fetch(url, {
                cache: 'no-store',
              });
              if (refreshResponse.ok) {
                const refreshedData = await refreshResponse.json();
                setApartment(refreshedData);
                setFormData(refreshedData);
              }
            } catch (refreshErr) {
              console.error('Refresh error:', refreshErr);
            }
          });
        } else {
          setTimeout(async () => {
            try {
              const url = `/api/apartments/${apartmentId}?t=${Date.now()}`;
              const refreshResponse = await fetch(url, {
                cache: 'no-store',
              });
              if (refreshResponse.ok) {
                const refreshedData = await refreshResponse.json();
                setApartment(refreshedData);
                setFormData(refreshedData);
              }
            } catch (refreshErr) {
              console.error('Refresh error:', refreshErr);
            }
          }, 100);
        }
      } catch (err) {
        console.error('Status update error:', err);
        // Откатываем оптимистичное обновление при ошибке
        setApartment((prev) => (prev ? { ...prev, status: previousStatus || 'UPCOMING' } : prev));
        alert('Failed to update status');
      }
    }, 0);
  };

  const getSalesTypeLabel = (type: string) => {
    switch (type?.toUpperCase()) {
      case 'UNSOLD':
        return 'Unsold';
      case 'MORTGAGE':
        return 'Mortgage';
      case 'CASH':
        return 'Cash';
      case 'TIMEBASED':
        return 'Time-based';
      default:
        return type || '-';
    }
  };

  const getSalesTypeValue = (label: string) => {
    switch (label) {
      case 'Unsold':
        return 'UNSOLD';
      case 'Mortgage':
        return 'MORTGAGE';
      case 'Cash':
        return 'CASH';
      case 'Time-based':
        return 'TIMEBASED';
      default:
        return 'UNSOLD';
    }
  };

  const handleCopyLandingLink = async () => {
    try {
      const res = await fetch(`/api/apartments/${apartmentId}/landing`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed');
      const { url } = await res.json();
      await navigator.clipboard.writeText(url);
      setLandingCopied(true);
      setTimeout(() => setLandingCopied(false), 2000);
    } catch {
      alert('Failed to copy landing link');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'UPCOMING':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'AVAILABLE':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'RESERVED':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'SOLD':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="text-sm text-gray-600">Loading apartment...</p>
        </div>
      </div>
    );
  }

  if (error || !apartment) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-800">{error || 'Apartment not found'}</p>
        <Link href="/apartments" className="mt-2 text-sm text-blue-600 hover:underline">
          ← Back to list
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/apartments"
          className="mb-4 inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          ← Back to list
        </Link>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Apartment {apartment.apartmentNo}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {apartment.district_name} - {apartment.building_name}
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={handleCopyLandingLink}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              title="Copy landing link for buyer"
            >
              {landingCopied ? (
                <>Copied</>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.172-1.172m4.828-4.828a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.172 1.172" />
                  </svg>
                  Landing link
                </>
              )}
            </button>
            <select
              value={apartment.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className={`badge border-2 ${getStatusColor(apartment.status)} cursor-pointer text-lg font-bold appearance-none bg-right bg-no-repeat transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 14 14' fill='none'%3E%3Cpath d='M3.5 5L7 8.5L10.5 5' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                backgroundPosition: 'right 0.875rem center',
                paddingTop: '0.625rem',
                paddingBottom: '0.625rem',
                paddingLeft: '0.875rem',
                paddingRight: '2rem',
                minWidth: '130px',
                borderRadius: '0.5rem',
              }}
            >
              <option value="UPCOMING">Upcoming</option>
              <option value="AVAILABLE">Available</option>
              <option value="RESERVED">Reserved</option>
              <option value="SOLD">Sold</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabs and Edit Button */}
      <div className="mb-6 flex items-center justify-between border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
              activeTab === 'overview'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('links')}
            className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
              activeTab === 'links'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            Links & Files
          </button>
        </nav>
        <div className="flex items-center gap-3">
          {editing ? (
            <>
              <button onClick={handleSave} className="btn-primary">
                Save
              </button>
              <button
                onClick={() => {
                  setEditing(false);
                  setFormData(apartment);
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
            </>
          ) : (
            <button onClick={() => setEditing(true)} className="btn-primary">
              Edit
            </button>
          )}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Basic Information Section */}
          <div className="card p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Basic Information</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
                  Apartment No
                </label>
                {editing ? (
                  <input
                    type="text"
                    value={formData.apartmentNo ?? ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        apartmentNo: e.target.value,
                      })
                    }
                    className="input-field"
                    placeholder="e.g. 12-05"
                    maxLength={50}
                    required
                  />
                ) : (
                  <p className="text-base font-medium text-gray-900">{apartment.apartmentNo}</p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
                  Apartment Type
                </label>
                {editing ? (
                  <input
                    type="number"
                    min={1}
                    value={formData.apartmentType ?? ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        apartmentType: e.target.value === '' ? null : parseInt(e.target.value, 10),
                      })
                    }
                    className="input-field"
                    placeholder="Type number"
                  />
                ) : (
                  <p className="text-base font-medium text-gray-900">{apartment.apartmentType ?? '-'}</p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
                  Floor
                </label>
                {editing ? (
                  <input
                    type="number"
                    value={formData.floor ?? ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        floor: e.target.value ? parseInt(e.target.value, 10) : null,
                      })
                    }
                    className="input-field"
                  />
                ) : (
                  <p className="text-base font-medium text-gray-900">{apartment.floor ?? '-'}</p>
                )}
              </div>

              {/* Editable fields below */}
              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
                  Sq/m
                </label>
                {editing ? (
                  <input
                    type="number"
                    step="0.01"
                    value={formData.sqm || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        sqm: e.target.value ? parseFloat(e.target.value) : null,
                      })
                    }
                    className="input-field"
                  />
                ) : (
                  <p className="text-base font-medium text-gray-900">
                    {apartment.sqm ? `${apartment.sqm} m²` : '-'}
                  </p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
                  Price Sq/m
                </label>
                {editing ? (
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price_sqm || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        price_sqm: e.target.value ? parseFloat(e.target.value) : null,
                      })
                    }
                    className="input-field"
                  />
                ) : (
                  <p className="text-base font-medium text-gray-900">
                    {apartment.price_sqm
                      ? `${(apartment.price_sqm / 1000).toFixed(0)}K AMD`
                      : '-'}
                  </p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
                  Sales Type
                </label>
                {editing ? (
                  <select
                    value={getSalesTypeLabel(apartment.salesType)}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        salesType: getSalesTypeValue(e.target.value),
                      })
                    }
                    className="input-field"
                  >
                    <option>Unsold</option>
                    <option>Mortgage</option>
                    <option>Cash</option>
                    <option>Time-based</option>
                  </select>
                ) : (
                  <p className="text-base font-medium text-gray-900">
                    {getSalesTypeLabel(apartment.salesType)}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Financial Information Section: Total Price, Total Paid, Balance Remaining (auto) */}
          {(() => {
            const totalPrice = apartment.total_price ?? 0;
            const totalPaid = editing
              ? (typeof formData.total_paid === 'number' ? formData.total_paid : (apartment.total_paid ?? 0))
              : (apartment.total_paid ?? 0);
            const balanceRemaining = totalPrice - totalPaid;
            const showBalanceRemaining =
              apartment.status === 'SOLD' || apartment.status === 'RESERVED' || totalPaid > 0;
            return (
              <div className="card p-6">
                <h2 className="mb-4 text-lg font-semibold text-gray-900">Financial Information</h2>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
                      Total Price (cost)
                    </label>
                    <p className="text-2xl font-bold text-gray-900">
                      {totalPrice > 0 ? `${(totalPrice / 1000000).toFixed(1)}M AMD` : '–'}
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
                      Total Paid
                    </label>
                    {editing ? (
                      <input
                        type="number"
                        min={0}
                        value={formData.total_paid ?? ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            total_paid: e.target.value === '' ? null : parseFloat(e.target.value),
                          })
                        }
                        className="input-field mt-2"
                        placeholder="AMD"
                      />
                    ) : (
                      <p className="text-2xl font-bold text-gray-900">
                        {totalPaid > 0 ? `${(totalPaid / 1000000).toFixed(1)}M AMD` : '–'}
                      </p>
                    )}
                  </div>
                  {showBalanceRemaining && (
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                      <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
                        Balance Remaining (to pay)
                      </label>
                      <p className="text-2xl font-bold text-gray-900">
                        {balanceRemaining >= 0
                          ? `${(balanceRemaining / 1000000).toFixed(1)}M AMD`
                          : '–'}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">Total Price − Total Paid</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Deal Information Section */}
          <div className="card p-6">
            <h2 className="mb-5 text-lg font-semibold text-gray-900">Deal Information</h2>

            {editing ? (
              <div className="space-y-6">
                {/* Top row: Deal Date, Ownership Name | Email, Phone | Passport/Tax No */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-500">Deal Date</label>
                    <input
                      type="date"
                      value={
                        formData.dealDate
                          ? new Date(formData.dealDate).toISOString().split('T')[0]
                          : ''
                      }
                      onChange={(e) =>
                        setFormData({ ...formData, dealDate: e.target.value || null })
                      }
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-500">Ownership Name</label>
                    <input
                      type="text"
                      value={formData.ownershipName || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, ownershipName: e.target.value || null })
                      }
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-500">Email</label>
                    <input
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value || null })
                      }
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-500">Phone</label>
                    <input
                      type="text"
                      value={formData.phone || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value || null })
                      }
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-500">Passport/Tax No</label>
                    <input
                      type="text"
                      value={formData.passportTaxNo || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, passportTaxNo: e.target.value || null })
                      }
                      className="input-field"
                    />
                  </div>
                </div>

                {/* Middle: full-width fields */}
                <div className="space-y-4 border-t border-gray-100 pt-6">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-500">Deal Description (max 500)</label>
                    <textarea
                      value={formData.dealDescription || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, dealDescription: e.target.value || null })
                      }
                      maxLength={500}
                      rows={3}
                      className="input-field"
                      placeholder="Brief description of the deal"
                    />
                    <p className="mt-1 text-xs text-gray-500">{formData.dealDescription?.length || 0}/500</p>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-500">Buyer Address</label>
                    <input
                      type="text"
                      value={formData.buyerAddress || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, buyerAddress: e.target.value || null })
                      }
                      className="input-field"
                      placeholder="Address of the buyer"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-500">Other Buyers</label>
                    <input
                      type="text"
                      value={formData.otherBuyers || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, otherBuyers: e.target.value || null })
                      }
                      className="input-field"
                      placeholder="Names of co-buyers"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-500">Payment Schedule</label>
                    <textarea
                      value={formData.paymentSchedule || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, paymentSchedule: e.target.value || null })
                      }
                      rows={2}
                      className="input-field"
                      placeholder="Payment dates and amounts"
                    />
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-6">
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-500">Notes (max 2000)</label>
                  <textarea
                    value={formData.notes || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value || null })
                    }
                    maxLength={2000}
                    rows={3}
                    className="input-field"
                    placeholder="Internal notes for this apartment"
                  />
                  <p className="mt-1 text-xs text-gray-500">{formData.notes?.length || 0}/2000</p>
                </div>

                <div className="border-t border-gray-100 pt-6">
                  <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-gray-500">Agreement (Media Attachment)</label>
                  <FileUpload
                    apartmentId={apartmentId}
                    attachments={normalizeAttachmentsForUpload(apartment.attachments)}
                    onUploadSuccess={refreshAfterUpload}
                    fileTypeOnly="AGREEMENT"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Top row: two columns like the reference */}
                <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
                  <div className="space-y-5">
                    <div>
                      <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">Deal Date</label>
                      <p className="text-base font-medium text-gray-900">
                        {apartment.dealDate
                          ? new Date(apartment.dealDate).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })
                          : '–'}
                      </p>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">Email</label>
                      <p className="text-base font-medium text-gray-900">
                        {apartment.email ? (
                          <a href={`mailto:${apartment.email}`} className="text-blue-600 hover:underline">
                            {apartment.email}
                          </a>
                        ) : (
                          '–'
                        )}
                      </p>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">Passport/Tax No</label>
                      <p className="text-base font-medium text-gray-900">{apartment.passportTaxNo || '–'}</p>
                    </div>
                  </div>
                  <div className="space-y-5">
                    <div>
                      <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">Ownership Name</label>
                      <p className="text-base font-medium text-gray-900">{apartment.ownershipName || '–'}</p>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">Phone</label>
                      <p className="text-base font-medium text-gray-900">
                        {apartment.phone ? (
                          <a href={`tel:${apartment.phone}`} className="text-blue-600 hover:underline">
                            {apartment.phone}
                          </a>
                        ) : (
                          '–'
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Middle: single column for description and new fields */}
                <div className="space-y-4 border-t border-gray-100 pt-6">
                  <div>
                    <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">Deal Description</label>
                    <p className="text-base text-gray-900 whitespace-pre-wrap">{apartment.dealDescription || '–'}</p>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">Buyer Address</label>
                    <p className="text-base text-gray-900">{apartment.buyerAddress || '–'}</p>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">Other Buyers</label>
                    <p className="text-base text-gray-900">{apartment.otherBuyers || '–'}</p>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">Payment Schedule</label>
                    <p className="text-base text-gray-900 whitespace-pre-wrap">{apartment.paymentSchedule || '–'}</p>
                  </div>
                </div>

                {apartment.notes && (
                  <div className="border-t border-gray-100 pt-6">
                    <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">Notes</label>
                    <p className="text-base text-gray-900 whitespace-pre-wrap">{apartment.notes}</p>
                  </div>
                )}

                <div className="border-t border-gray-100 pt-6">
                  <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-gray-500">Agreement (Media Attachment)</label>
                  <FileUpload
                    apartmentId={apartmentId}
                    attachments={normalizeAttachmentsForUpload(apartment.attachments)}
                    onUploadSuccess={refreshAfterUpload}
                    fileTypeOnly="AGREEMENT"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'links' && (
        <div className="space-y-6">
          {/* Links Section */}
          <div className="card p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Links</h2>

            {editing ? (
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Matter Link</label>
                  <input
                    type="url"
                    value={formData.matterLink || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, matterLink: e.target.value || null })
                    }
                    className="input-field"
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Exterior Link</label>
                  <input
                    type="url"
                    value={formData.exteriorLink || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, exteriorLink: e.target.value || null })
                    }
                    className="input-field"
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Exterior Link 2</label>
                  <input
                    type="url"
                    value={formData.exteriorLink2 || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, exteriorLink2: e.target.value || null })
                    }
                    className="input-field"
                    placeholder="https://..."
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {[
                  { key: 'matter', label: 'Matter Link', url: apartment.matterLink },
                  { key: 'exterior', label: 'Exterior Link', url: apartment.exteriorLink },
                  { key: 'exterior2', label: 'Exterior Link 2', url: apartment.exteriorLink2 },
                ].map(({ key, label, url }) => (
                  <div
                    key={key}
                    className="flex flex-col sm:flex-row gap-0 overflow-hidden rounded-xl border border-gray-200 shadow-sm"
                  >
                    {/* Single unified Preview zone: label + URL + Preview — one block, one action */}
                    <button
                      type="button"
                      onClick={() => {
                        if (url) {
                          setPreviewUrl(getEmbedPreviewUrl(url));
                          setPreviewOriginalUrl(url);
                        }
                      }}
                      disabled={!url}
                      className="flex min-h-[80px] flex-1 cursor-pointer items-center gap-4 rounded-xl rounded-r-none border-0 bg-gradient-to-r from-blue-50 to-blue-100/80 p-4 text-left transition hover:from-blue-100 hover:to-blue-100 disabled:cursor-default disabled:opacity-50 sm:min-h-0"
                      title={url ? 'Preview 3D' : undefined}
                    >
                      <div className="min-w-0 flex-1">
                        <span className="block text-xs font-medium uppercase tracking-wide text-blue-700/90">
                          {label}
                        </span>
                        {url ? (
                          <span className="mt-0.5 block text-sm font-medium text-gray-900 truncate">
                            {truncateUrl(url, 52)}
                          </span>
                        ) : (
                          <span className="mt-0.5 text-sm text-gray-500">—</span>
                        )}
                      </div>
                      {url && (
                        <span className="hidden shrink-0 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white sm:inline-block">
                          Preview
                        </span>
                      )}
                    </button>
                    {url && (
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex shrink-0 items-center justify-center gap-2 border-l border-gray-200 bg-gray-50 px-5 py-4 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        Open
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Floorplan Distribution */}
            <div className="mt-8 rounded-2xl border-2 border-blue-200/80 bg-gradient-to-br from-blue-50/90 to-blue-50/70 p-5 shadow-sm">
              <div className="mb-3 flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H9a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-gray-900">
                  Floor plan description
                </h3>
              </div>
              {editing ? (
                <>
                  <textarea
                    value={formData.floorplanDistribution || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        floorplanDistribution: e.target.value || null,
                      })
                    }
                    maxLength={500}
                    rows={5}
                    placeholder="e.g. living room 24 m², kitchen 12 m², 2 bedrooms..."
                    className="w-full rounded-xl border border-blue-200 bg-white px-4 py-3 text-gray-900 shadow-inner placeholder:text-gray-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30"
                  />
                  <p className="mt-2 text-right text-sm font-medium text-blue-700/80">
                    {formData.floorplanDistribution?.length || 0} / 500
                  </p>
                </>
              ) : (
                <div className="rounded-xl border border-blue-100 bg-white/80 px-4 py-3">
                  <p className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">
                    {apartment.floorplanDistribution || (
                      <span className="text-gray-400">No description</span>
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Files Section */}
          <div className="card p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Files</h2>
            <FileUpload
              apartmentId={apartmentId}
              attachments={normalizeAttachmentsForUpload(apartment.attachments)}
              onUploadSuccess={refreshAfterUpload}
            />
          </div>
        </div>
      )}

      {/* 3D preview modal (iframe) */}
      {previewUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => { setPreviewUrl(null); setPreviewOriginalUrl(null); }}
          role="dialog"
          aria-modal="true"
          aria-label="Preview"
        >
          <div
            className="relative flex max-h-[85vh] w-full max-w-4xl flex-col rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
              <span className="text-sm font-medium text-gray-700">3D Preview</span>
              <button
                type="button"
                onClick={() => { setPreviewUrl(null); setPreviewOriginalUrl(null); }}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                aria-label="Close"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="relative min-h-[400px] flex-1 overflow-hidden rounded-b-2xl">
              <iframe
                src={previewUrl}
                title="3D Preview"
                className="absolute inset-0 h-full w-full border-0"
                allowFullScreen
                allow="autoplay; fullscreen; web-share; xr-spatial-tracking"
              />
            </div>
            {previewOriginalUrl && (
              <div className="border-t border-gray-200 bg-gray-50 px-4 py-3">
                <p className="mb-2 text-xs text-gray-500">
                  If the preview is blocked (Matterport allows embedding only from certain sites), open the 3D tour in a new tab:
                </p>
                <a
                  href={previewOriginalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Open 3D tour in new tab
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
