'use client';

import { FileText } from 'lucide-react';
import { useState } from 'react';
import ImageLightbox from '@/components/ui/ImageLightbox';

type Attachment = {
  id: number;
  fileType: string;
  fileUrl: string;
  fileName: string | null;
  fileSize: number | null;
  createdAt: string;
};

type FileUploadProps = {
  apartmentId: number;
  attachments: {
    agreement_files: Attachment[];
    floorplans_files: Attachment[];
    images_files: Attachment[];
    progress_images_files: Attachment[];
  };
  onUploadSuccess: () => void;
  fileTypeOnly?: string; // Если указан, показываем только этот тип файла
};

export default function FileUpload({
  apartmentId,
  attachments,
  onUploadSuccess,
  fileTypeOnly,
}: FileUploadProps) {
  const [uploading, setUploading] = useState<{ [key: string]: boolean }>({});
  const [uploadError, setUploadError] = useState<{ [key: string]: string }>({});
  const [lightbox, setLightbox] = useState<{ urls: string[]; index: number } | null>(null);

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    fileType: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading((prev) => ({ ...prev, [fileType]: true }));
    setUploadError((prev) => ({ ...prev, [fileType]: '' }));

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileType', fileType);

      const response = await fetch(
        `/api/apartments/${apartmentId}/attachments`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload file');
      }

      const uploadedFile = await response.json();
      
      // Сбрасываем input сразу после успешной загрузки
      e.target.value = '';
      
      // Обновляем данные с сервера (без кэша для получения свежих данных)
      await onUploadSuccess();
    } catch (err) {
      setUploadError((prev) => ({
        ...prev,
        [fileType]: err instanceof Error ? err.message : 'Failed to upload file',
      }));
    } finally {
      setUploading((prev) => ({ ...prev, [fileType]: false }));
    }
  };

  const handleDelete = async (attachmentId: number) => {
    if (!confirm('Delete this file?')) return;

    try {
      const response = await fetch(
        `/api/apartments/${apartmentId}/attachments/${attachmentId}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        throw new Error('Ошибка удаления файла');
      }

      onUploadSuccess();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ошибка удаления файла');
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileTypeLabel = (type: string) => {
    switch (type) {
      case 'AGREEMENT':
        return 'Agreement';
      case 'FLOORPLAN':
        return 'Floorplan';
      case 'IMAGE':
        return 'Image';
      case 'PROGRESS_IMAGE':
        return 'Progress Image';
      default:
        return type;
    }
  };

  const isImageType = (type: string) =>
    type === 'IMAGE' || type === 'PROGRESS_IMAGE';

  const isDocumentType = (type: string) =>
    type === 'AGREEMENT' || type === 'FLOORPLAN';

  const isImageFileName = (fileName: string | null): boolean => {
    if (!fileName) return false;
    const ext = fileName.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '');
  };

  const renderDocumentGrid = (files: Attachment[], _type: string) => {
    if (!files || files.length === 0) {
      return <p className="text-sm text-gray-500">No files</p>;
    }
    const imageFiles = files.filter((f) => isImageFileName(f.fileName));
    return (
      <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {files.map((file) => {
          const isImage = isImageFileName(file.fileName);
          if (isImage) {
            const imgIndex = imageFiles.findIndex((f) => f.id === file.id);
            return (
              <div
                key={file.id}
                className="group overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                <button
                  type="button"
                  onClick={() => imgIndex >= 0 && setLightbox({ urls: imageFiles.map((f) => f.fileUrl), index: imgIndex })}
                  className="block w-full aspect-square overflow-hidden bg-gray-100 text-left"
                >
                  <img
                    src={file.fileUrl}
                    alt={file.fileName || 'Preview'}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                </button>
                <div className="flex items-center justify-between gap-2 border-t border-gray-100 px-3 py-2">
                  <span
                    className="min-w-0 flex-1 truncate text-xs text-gray-600"
                    title={file.fileName || undefined}
                  >
                    {file.fileName || 'Image'}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDelete(file.id)}
                    className="shrink-0 rounded-md bg-red-50 px-2 py-1 text-xs text-red-600 transition-colors hover:bg-red-100"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          }
          return (
            <div
              key={file.id}
              className="group flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
            >
              <a
                href={file.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex aspect-square flex-col items-center justify-center gap-2 bg-gray-50 p-4 transition-colors hover:bg-gray-100"
              >
                <FileText className="h-16 w-16 shrink-0 text-red-500" strokeWidth={1.5} />
                <span className="text-center text-xs font-medium text-gray-600">
                  PDF / Doc
                </span>
              </a>
              <div className="flex items-center justify-between gap-2 border-t border-gray-100 px-3 py-2">
                <span
                  className="min-w-0 flex-1 truncate text-xs text-gray-600"
                  title={file.fileName || undefined}
                >
                  {file.fileName || 'File'}
                </span>
                <div className="flex shrink-0 gap-1">
                  <a
                    href={file.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-md bg-blue-50 px-2 py-1 text-xs text-blue-600 transition-colors hover:bg-blue-100"
                  >
                    Open
                  </a>
                  <button
                    type="button"
                    onClick={() => handleDelete(file.id)}
                    className="rounded-md bg-red-50 px-2 py-1 text-xs text-red-600 transition-colors hover:bg-red-100"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderImageGrid = (files: Attachment[], _type: string) => {
    if (!files || files.length === 0) {
      return <p className="text-sm text-gray-500">No images</p>;
    }
    return (
      <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {files.map((file, idx) => (
          <div
            key={file.id}
            className="group overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
          >
            <button
              type="button"
              onClick={() => setLightbox({ urls: files.map((f) => f.fileUrl), index: idx })}
              className="block w-full aspect-square overflow-hidden bg-gray-100 text-left"
            >
              <img
                src={file.fileUrl}
                alt={file.fileName || 'Image'}
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
              />
            </button>
            <div className="flex items-center justify-between gap-2 border-t border-gray-100 px-3 py-2">
              <span
                className="min-w-0 flex-1 truncate text-xs text-gray-600"
                title={file.fileName || undefined}
              >
                {file.fileName || 'Image'}
              </span>
              <button
                type="button"
                onClick={() => handleDelete(file.id)}
                className="shrink-0 rounded-md bg-red-50 px-2 py-1 text-xs text-red-600 transition-colors hover:bg-red-100"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderFileList = (
    files: Attachment[],
    fileType: string,
    label?: string
  ) => {
    if (isImageType(fileType)) {
      return renderImageGrid(files, fileType);
    }
    if (isDocumentType(fileType)) {
      return renderDocumentGrid(files, fileType);
    }
    return (
      <div className="mt-2">
        {label && <h4 className="mb-2 text-sm font-medium text-gray-700">{label}</h4>}
        {!files || files.length === 0 ? (
          <p className="text-sm text-gray-500">No files</p>
        ) : (
          <div className="space-y-2">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between rounded-md border border-gray-200 bg-gray-50 p-2"
              >
                <div className="flex-1">
                  <a
                    href={file.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {file.fileName || 'File'}
                  </a>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(file.fileSize)} •{' '}
                    {new Date(file.createdAt).toLocaleDateString('en-US')}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(file.id)}
                  className="ml-2 rounded-md bg-red-100 px-2 py-1 text-xs text-red-700 hover:bg-red-200"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const fileTypes = [
    { type: 'IMAGE', label: 'Images', accept: 'image/*' },
    { type: 'PROGRESS_IMAGE', label: 'Progress Images', accept: 'image/*' },
    {
      type: 'FLOORPLAN',
      label: 'Floorplans',
      accept: '.pdf,.doc,.docx,image/*',
    },
    {
      type: 'AGREEMENT',
      label: 'Agreement',
      accept: '.pdf,.doc,.docx,image/*',
    },
  ];

  const getFileList = (type: string) => {
    if (!attachments) return [];
    switch (type) {
      case 'IMAGE':
        return attachments.images_files ?? [];
      case 'PROGRESS_IMAGE':
        return attachments.progress_images_files ?? [];
      case 'FLOORPLAN':
        return attachments.floorplans_files ?? [];
      case 'AGREEMENT':
        return attachments.agreement_files ?? [];
      default:
        return [];
    }
  };

  // Если указан fileTypeOnly, показываем только этот тип
  const filteredFileTypes = fileTypeOnly
    ? fileTypes.filter((ft) => ft.type === fileTypeOnly)
    : fileTypes.filter((ft) => ft.type !== 'AGREEMENT'); // Agreement убираем из основного списка

  return (
    <div className="space-y-6">
      {/* File Upload Sections - отдельная кнопка для каждого типа */}
      {filteredFileTypes.map((fileType) => {
        const files = getFileList(fileType.type);
        const isUploading = uploading[fileType.type] || false;
        const error = uploadError[fileType.type];

        const isImageSection = isImageType(fileType.type);
        const isDocumentSection = isDocumentType(fileType.type);
        const useCardStyle = isImageSection || isDocumentSection;
        return (
          <div
            key={fileType.type}
            className={
              useCardStyle
                ? 'rounded-xl border border-gray-100 bg-gray-50/50 p-4 shadow-sm'
                : 'space-y-3'
            }
          >
            <div className="flex items-center justify-between">
              {!fileTypeOnly && (
                <h4 className="text-sm font-medium text-gray-700">
                  {fileType.label}
                </h4>
              )}
              <label className="btn-secondary cursor-pointer">
                <input
                  type="file"
                  onChange={(e) => handleFileUpload(e, fileType.type)}
                  disabled={isUploading}
                  accept={fileType.accept}
                  className="hidden"
                />
                {isUploading ? 'Uploading...' : 'Select File'}
              </label>
            </div>
            {error && (
              <div className="mt-2 rounded-md bg-red-50 p-2">
                <p className="text-xs text-red-800">{error}</p>
              </div>
            )}
            <div className={useCardStyle ? 'mt-3' : ''}>
              {renderFileList(files, fileType.type)}
            </div>
          </div>
        );
      })}
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
