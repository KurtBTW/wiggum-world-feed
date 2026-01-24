'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, X, Loader2, FileText, Image as ImageIcon, AlertCircle } from 'lucide-react';

interface FileUploadProps {
  type: 'logo' | 'attachment';
  value?: string;
  onChange: (url: string | null) => void;
  accept?: string;
  maxSizeBytes?: number;
  className?: string;
  disabled?: boolean;
}

interface UploadState {
  isUploading: boolean;
  progress: number;
  error: string | null;
}

export function FileUpload({
  type,
  value,
  onChange,
  accept,
  maxSizeBytes,
  className = '',
  disabled = false,
}: FileUploadProps) {
  const [state, setState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    error: null,
  });
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const defaultAccept = type === 'logo' 
    ? 'image/jpeg,image/png,image/gif,image/webp,image/svg+xml'
    : 'image/jpeg,image/png,image/gif,image/webp,application/pdf';
  
  const defaultMaxSize = type === 'logo' ? 5 * 1024 * 1024 : 10 * 1024 * 1024;

  const uploadFile = useCallback(async (file: File) => {
    const actualMaxSize = maxSizeBytes || defaultMaxSize;

    if (file.size > actualMaxSize) {
      setState(prev => ({
        ...prev,
        error: `File too large. Maximum size: ${actualMaxSize / (1024 * 1024)}MB`,
      }));
      return;
    }

    setState({ isUploading: true, progress: 0, error: null });

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setState({ isUploading: false, progress: 100, error: null });
      onChange(data.url);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Upload failed';
      setState({ isUploading: false, progress: 0, error: message });
    }
  }, [type, maxSizeBytes, defaultMaxSize, onChange]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadFile(file);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      uploadFile(file);
    }
  }, [uploadFile]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const clearFile = () => {
    onChange(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const isImage = value?.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i);

  return (
    <div className={className}>
      {value ? (
        <div className="relative group">
          {isImage ? (
            <div className="relative w-full h-32 bg-white/[0.03] rounded-lg overflow-hidden border border-white/[0.08]">
              <img
                src={value}
                alt="Uploaded"
                className="w-full h-full object-contain"
              />
            </div>
          ) : (
            <div className="flex items-center gap-3 p-3 bg-white/[0.03] rounded-lg border border-white/[0.08]">
              <FileText className="w-8 h-8 text-zinc-400" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-zinc-300 truncate">
                  {value.split('/').pop()}
                </p>
                <p className="text-xs text-zinc-500">Document uploaded</p>
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={clearFile}
            disabled={disabled}
            className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => !disabled && inputRef.current?.click()}
          className={`
            relative flex flex-col items-center justify-center p-6 
            border-2 border-dashed rounded-lg cursor-pointer
            transition-colors
            ${isDragging 
              ? 'border-[#50e2c3] bg-[#50e2c3]/10' 
              : 'border-white/[0.12] hover:border-white/[0.25] bg-white/[0.02] hover:bg-white/[0.04]'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            ${state.error ? 'border-red-500/50' : ''}
          `}
        >
          <input
            ref={inputRef}
            type="file"
            accept={accept || defaultAccept}
            onChange={handleFileChange}
            disabled={disabled || state.isUploading}
            className="hidden"
          />
          
          {state.isUploading ? (
            <>
              <Loader2 className="w-8 h-8 text-[#50e2c3] animate-spin mb-2" />
              <p className="text-sm text-zinc-400">Uploading...</p>
            </>
          ) : (
            <>
              {type === 'logo' ? (
                <ImageIcon className="w-8 h-8 text-zinc-500 mb-2" />
              ) : (
                <Upload className="w-8 h-8 text-zinc-500 mb-2" />
              )}
              <p className="text-sm text-zinc-400 text-center">
                {type === 'logo' 
                  ? 'Drop your logo here or click to upload'
                  : 'Drop files here or click to upload'
                }
              </p>
              <p className="text-xs text-zinc-600 mt-1">
                {type === 'logo' 
                  ? 'PNG, JPG, GIF, WebP, SVG (max 5MB)'
                  : 'Images or PDF (max 10MB)'
                }
              </p>
            </>
          )}
        </div>
      )}

      {state.error && (
        <div className="flex items-center gap-2 mt-2 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{state.error}</span>
        </div>
      )}
    </div>
  );
}
