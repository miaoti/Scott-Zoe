import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, Camera, Image, CheckCircle, AlertCircle, Plus } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import api from '../utils/api';

interface PhotoUploadProps {
  onUploadComplete: () => void;
  onClose: () => void;
}

interface UploadFile {
  file: File;
  id: string;
  preview: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
}

const PhotoUpload: React.FC<PhotoUploadProps> = ({ onUploadComplete, onClose }) => {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStats, setUploadStats] = useState({ success: 0, total: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showPhotoSuccess } = useToast();

  // Debug logging
  console.log('PhotoUpload rendered', { files: files.length, isUploading, uploadStats });

  const createUploadFile = (file: File): UploadFile => ({
    file,
    id: Math.random().toString(36).substr(2, 9),
    preview: URL.createObjectURL(file),
    status: 'pending',
    progress: 0,
  });

  const handleFileSelect = useCallback((selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const newFiles = Array.from(selectedFiles)
      .filter(file => file.type.startsWith('image/'))
      .map(createUploadFile);

    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const removeFile = (id: string) => {
    setFiles(prev => {
      const file = prev.find(f => f.id === id);
      if (file) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter(f => f.id !== id);
    });
  };

  const uploadFiles = async () => {
    if (files.length === 0) return;

    console.log('Starting upload for', files.length, 'files');
    setIsUploading(true);
    setUploadStats({ success: 0, total: files.length });

    // Update all files to uploading status
    setFiles(prev => prev.map(f => ({ ...f, status: 'uploading' as const })));

    try {
      const formData = new FormData();
      files.forEach(({ file }) => {
        formData.append('photos', file);
        console.log('Added file to FormData:', file.name, file.size);
      });

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setFiles(prev => prev.map(f => ({
          ...f,
          progress: f.status === 'uploading' ? Math.min(f.progress + Math.random() * 20, 90) : f.progress
        })));
      }, 200);

      console.log('Sending upload request...');
      const response = await api.post('/api/photos/upload-multiple', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      clearInterval(progressInterval);
      console.log('Upload response:', response.status, response.data);

      if (response.status === 200) {
        // Mark all as success
        setFiles(prev => prev.map(f => ({ ...f, status: 'success' as const, progress: 100 })));
        setUploadStats({ success: files.length, total: files.length });

        // Show success toast
        showPhotoSuccess(files.length);

        // Show success animation
        setTimeout(() => {
          onUploadComplete();
          // Keep modal open for 2 more seconds to show success message
          setTimeout(() => {
            onClose();
          }, 2000);
        }, 1000);
      } else {
        throw new Error(`Upload failed with status: ${response.status}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      setFiles(prev => prev.map(f => ({ ...f, status: 'error' as const })));

      // Show error message
      alert(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUploading(false);
    }
  };

  const getStatusIcon = (status: UploadFile['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'uploading':
        return (
          <div className="w-5 h-5 border-2 border-apple-blue-light border-t-transparent rounded-full animate-spin" />
        );
      default:
        return <Image className="w-5 h-5 text-apple-secondary-label" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl apple-shadow max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-apple-separator">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-apple-blue-light/10 rounded-full flex items-center justify-center">
              <Camera className="w-5 h-5 text-apple-blue-light" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-apple-label">Upload Photos</h2>
              <p className="text-sm text-apple-secondary-label">
                Share your beautiful memories
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-apple-gray-6/10 hover:bg-apple-gray-6/20 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-apple-secondary-label" />
          </button>
        </div>

        {/* Upload Area */}
        <div className="p-6">
          {files.length === 0 ? (
            <div
              className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-200 ${
                isDragOver
                  ? 'border-apple-blue-light bg-apple-blue-light/5'
                  : 'border-apple-separator hover:border-apple-blue-light/50 hover:bg-apple-gray-6/5'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <div className="w-16 h-16 bg-apple-blue-light/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Upload className="w-8 h-8 text-apple-blue-light" />
              </div>
              <h3 className="text-lg font-medium text-apple-label mb-2">
                Drop photos here or click to browse
              </h3>
              <p className="text-apple-secondary-label mb-6">
                Support for JPEG, PNG, HEIC and more. Upload as many as you want!
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-8 py-4 bg-white border-2 border-gray-300 hover:border-gray-400 text-gray-800 rounded-xl font-semibold transition-all duration-200 hover:bg-gray-50 shadow-sm"
              >
                Choose Photos
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleFileSelect(e.target.files)}
                className="hidden"
              />
            </div>
          ) : (
            <div className="space-y-4">
              {/* File List */}
              <div className="max-h-60 overflow-y-auto space-y-2">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center space-x-4 p-3 bg-apple-gray-6/5 rounded-xl"
                  >
                    <img
                      src={file.preview}
                      alt={file.file.name}
                      className="w-12 h-12 object-cover rounded-lg"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-apple-label truncate">
                        {file.file.name}
                      </p>
                      <p className="text-xs text-apple-secondary-label">
                        {(file.file.size / 1024 / 1024).toFixed(1)} MB
                      </p>
                      {file.status === 'uploading' && (
                        <div className="w-full bg-apple-gray-6/20 rounded-full h-1.5 mt-1">
                          <div
                            className="bg-apple-blue-light h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${file.progress}%` }}
                          />
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(file.status)}
                      {file.status === 'pending' && (
                        <button
                          onClick={() => removeFile(file.id)}
                          className="w-6 h-6 rounded-full bg-apple-gray-6/10 hover:bg-red-500/10 flex items-center justify-center transition-colors"
                        >
                          <X className="w-3 h-3 text-apple-secondary-label hover:text-red-500" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Add More Button */}
              {!isUploading && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full p-3 border border-dashed border-apple-separator rounded-xl text-apple-blue-light hover:bg-apple-blue-light/5 transition-colors flex items-center justify-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add More Photos</span>
                </button>
              )}

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleFileSelect(e.target.files)}
                className="hidden"
              />
            </div>
          )}
        </div>

        {/* Success Message */}
        {uploadStats.success > 0 && uploadStats.success === uploadStats.total && !isUploading && (
          <div className="p-6 border-t border-apple-separator bg-gradient-to-r from-green-50 to-emerald-50">
            <div className="text-center animate-bounce-in">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-green-700 mb-2">
                Upload Successful! 🎉
              </h3>
              <p className="text-green-600 mb-4">
                {uploadStats.success} photo{uploadStats.success !== 1 ? 's' : ''} uploaded successfully
              </p>
              <div className="flex justify-center space-x-2">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="w-2 h-2 bg-green-500 rounded-full animate-sparkle"
                    style={{ animationDelay: `${i * 0.2}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        {files.length > 0 && !isUploading && uploadStats.success === 0 && (
          <div className="flex items-center justify-between p-6 border-t border-apple-separator bg-apple-gray-6/5">
            <div className="text-sm text-apple-secondary-label">
              {isUploading ? (
                <span>Uploading {uploadStats.success}/{uploadStats.total} photos...</span>
              ) : (
                <span>{files.length} photo{files.length !== 1 ? 's' : ''} selected</span>
              )}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                disabled={isUploading}
                className="px-4 py-2 text-apple-secondary-label hover:text-apple-label transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={uploadFiles}
                disabled={isUploading || files.length === 0}
                className="apple-button-primary px-6 py-2 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? 'Uploading...' : `Upload ${files.length} Photo${files.length !== 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PhotoUpload;
