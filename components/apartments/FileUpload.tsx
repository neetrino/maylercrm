'use client';

import { useState } from 'react';

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

  const renderFileList = (
    files: Attachment[],
    _type: string,
    label?: string
  ) => {
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
    { type: 'FLOORPLAN', label: 'Floorplans', accept: '.pdf,.doc,.docx' },
    { type: 'AGREEMENT', label: 'Agreement', accept: '.pdf,.doc,.docx' },
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

        return (
          <div key={fileType.type} className="space-y-3">
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
              <div className="rounded-md bg-red-50 p-2">
                <p className="text-xs text-red-800">{error}</p>
              </div>
            )}
            {renderFileList(files, fileType.type)}
          </div>
        );
      })}
    </div>
  );
}
