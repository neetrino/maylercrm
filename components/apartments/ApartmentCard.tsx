'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import FileUpload from './FileUpload';

/** Converts 3D link (Matterport, Sketchfab) to iframe embed URL for preview */
function getEmbedPreviewUrl(url: string): string {
  try {
    const u = url.trim();
    // Matterport: embed?m=ID
    if (u.includes('matterport.com')) {
      const match = u.match(/[?&]m=([^&]+)/);
      if (match) return `https://my.matterport.com/embed?m=${match[1]}`;
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
  building_name: string;
  building_slug: string;
  district_name: string;
  district_slug: string;
  updatedAt: string;
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

      console.log('Sending data to API:', JSON.stringify(apiData, null, 2));
      
      const response = await fetch(`/api/apartments/${apartmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        if (errorData.details && Array.isArray(errorData.details)) {
          console.error('Validation details:', errorData.details);
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
      console.error('Save error:', err);
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
          <div className="flex items-center gap-3">
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
              {/* Read-only fields at the top */}
              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
                  Apartment No
                </label>
                <p className="text-base font-medium text-gray-900">{apartment.apartmentNo}</p>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
                  Apartment Type
                </label>
                <p className="text-base font-medium text-gray-900">{apartment.apartmentType || '-'}</p>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
                  Total Price
                </label>
                <p className="text-lg font-semibold text-gray-900">
                  {apartment.total_price
                    ? `${(apartment.total_price / 1000000).toFixed(1)}M AMD`
                    : '-'}
                </p>
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

          {/* Financial Information Section */}
          <div className="card p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Financial Information</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
                  Total Paid
                </label>
                {editing ? (
                  <input
                    type="number"
                    value={formData.total_paid || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        total_paid: e.target.value ? parseFloat(e.target.value) : null,
                      })
                    }
                    className="input-field mt-2"
                  />
                ) : (
                  <p className="text-2xl font-bold text-gray-900">
                    {apartment.total_paid
                      ? `${(apartment.total_paid / 1000000).toFixed(1)}M AMD`
                      : '-'}
                  </p>
                )}
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
                  Balance
                </label>
                <p className="text-2xl font-bold text-gray-900">
                  {apartment.balance
                    ? `${(apartment.balance / 1000000).toFixed(1)}M AMD`
                    : '-'}
                </p>
              </div>
            </div>
          </div>

          {/* Deal Information Section */}
          <div className="card p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Deal Information</h2>
            {editing ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Deal Date</label>
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
                  <label className="mb-1 block text-sm font-medium text-gray-700">Ownership Name</label>
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
                  <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
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
                  <label className="mb-1 block text-sm font-medium text-gray-700">Phone</label>
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
                  <label className="mb-1 block text-sm font-medium text-gray-700">Passport/Tax No</label>
                  <input
                    type="text"
                    value={formData.passportTaxNo || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, passportTaxNo: e.target.value || null })
                    }
                    className="input-field"
                  />
                </div>
                <div className="col-span-2">
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Deal Description (max 500 characters)
                  </label>
                  <textarea
                    value={formData.dealDescription || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, dealDescription: e.target.value || null })
                    }
                    maxLength={500}
                    rows={4}
                    className="input-field"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    {formData.dealDescription?.length || 0}/500
                  </p>
                </div>
                {/* Agreement Files Section */}
                <div className="col-span-2">
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Agreement (Media Attachment)
                  </label>
                  <FileUpload
                    apartmentId={apartmentId}
                    attachments={normalizeAttachmentsForUpload(apartment.attachments)}
                    onUploadSuccess={refreshAfterUpload}
                    fileTypeOnly="AGREEMENT"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
                    Deal Date
                  </label>
                  <p className="text-base font-medium text-gray-900">
                    {apartment.dealDate
                      ? new Date(apartment.dealDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })
                      : '-'}
                  </p>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
                    Ownership Name
                  </label>
                  <p className="text-base font-medium text-gray-900">
                    {apartment.ownershipName || '-'}
                  </p>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
                    Email
                  </label>
                  <p className="text-base font-medium text-gray-900">
                    {apartment.email ? (
                      <a
                        href={`mailto:${apartment.email}`}
                        className="text-blue-600 hover:underline"
                      >
                        {apartment.email}
                      </a>
                    ) : (
                      '-'
                    )}
                  </p>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
                    Phone
                  </label>
                  <p className="text-base font-medium text-gray-900">
                    {apartment.phone ? (
                      <a
                        href={`tel:${apartment.phone}`}
                        className="text-blue-600 hover:underline"
                      >
                        {apartment.phone}
                      </a>
                    ) : (
                      '-'
                    )}
                  </p>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
                    Passport/Tax No
                  </label>
                  <p className="text-base font-medium text-gray-900">
                    {apartment.passportTaxNo || '-'}
                  </p>
                </div>
                <div className="col-span-2">
                  <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
                    Deal Description
                  </label>
                  <p className="text-base text-gray-900 whitespace-pre-wrap">
                    {apartment.dealDescription || '-'}
                  </p>
                </div>
                {/* Agreement Files Section */}
                <div className="col-span-2">
                  <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
                    Agreement (Media Attachment)
                  </label>
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
                    className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-gray-200 bg-gradient-to-r from-gray-50 to-white p-4 shadow-sm transition-shadow hover:shadow-md"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="block text-xs font-medium uppercase tracking-wide text-gray-500 mb-0.5">
                        {label}
                      </span>
                      {url ? (
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-blue-600 hover:text-blue-800 truncate block"
                          title={url}
                        >
                          {truncateUrl(url, 56)}
                        </a>
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </div>
                    <div className="flex shrink-0 gap-2">
                      {url && (
                        <>
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-gray-800"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            Open
                          </a>
                          <button
                            type="button"
                            onClick={() => setPreviewUrl(getEmbedPreviewUrl(url))}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            Preview
                          </button>
                        </>
                      )}
                    </div>
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
          onClick={() => setPreviewUrl(null)}
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
                onClick={() => setPreviewUrl(null)}
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
                allow="autoplay; fullscreen; xr-spatial-tracking"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
