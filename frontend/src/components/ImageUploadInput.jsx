import React, { useState, useRef } from 'react';
import { UploadCloud, Image as ImageIcon, X, Check, Loader2, Link as LinkIcon } from 'lucide-react';
import { uploadApi } from '../services/api';

/**
 * Reusable Image Upload & Browse Component
 * Supports both:
 * 1. Attaching/Browsing local file with automatic upload
 * 2. Typing or pasting external image URL
 * Shows instant live preview and clear options.
 */
export const ImageUploadInput = ({
  label = 'Image',
  value = '',
  onChange,
  placeholder = 'https://example.com/image.jpg or browse file',
  required = false,
  helperText,
  onToast,
  style,
  previewHeight = 44,
}) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      onToast?.('Please select a valid image file (JPG, PNG, WEBP, GIF, SVG)', 'error');
      return;
    }

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      onToast?.('Image size must be less than 5MB', 'error');
      return;
    }

    try {
      setUploading(true);
      const res = await uploadApi.uploadImage(file);
      const uploadedUrl = res?.data?.url || res?.data?.relativeUrl;

      if (uploadedUrl) {
        onChange?.(uploadedUrl);
        onToast?.('Image uploaded successfully!', 'success');
      } else {
        throw new Error('Upload succeeded but no URL was returned');
      }
    } catch (err) {
      console.error('File upload error:', err);
      onToast?.(err.message || 'Failed to upload image. Please try again.', 'error');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleClear = () => {
    onChange?.('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div style={{ marginBottom: '14px', ...style }}>
      {label && (
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.82rem',
            fontWeight: 700,
            marginBottom: '6px',
            color: 'var(--text-primary, #334155)',
          }}
        >
          <span>
            {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
          </span>
          {helperText && (
            <span style={{ fontSize: '0.72rem', fontWeight: 500, color: '#94a3b8' }}>
              {helperText}
            </span>
          )}
        </label>
      )}

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
        style={{ display: 'none' }}
      />

      <div
        style={{
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
          flexWrap: 'nowrap',
        }}
      >
        {/* Thumbnail Preview if value exists */}
        {value ? (
          <div
            style={{
              position: 'relative',
              width: previewHeight,
              height: previewHeight,
              minWidth: previewHeight,
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              overflow: 'hidden',
              background: '#f8fafc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <img
              src={value}
              alt="Preview"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
            <button
              type="button"
              onClick={handleClear}
              title="Remove image"
              style={{
                position: 'absolute',
                top: 2,
                right: 2,
                background: 'rgba(15, 23, 42, 0.75)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '50%',
                width: '16px',
                height: '16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
              }}
            >
              <X size={10} />
            </button>
          </div>
        ) : (
          <div
            style={{
              width: previewHeight,
              height: previewHeight,
              minWidth: previewHeight,
              borderRadius: '8px',
              border: '1px dashed #cbd5e1',
              background: '#f8fafc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#94a3b8',
            }}
          >
            <ImageIcon size={18} />
          </div>
        )}

        {/* Text Input for direct URL or display */}
        <input
          type="text"
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          required={required}
          style={{
            flex: 1,
            padding: '8px 12px',
            borderRadius: '8px',
            border: '1px solid #cbd5e1',
            fontSize: '0.84rem',
            background: 'var(--bg-input, #ffffff)',
            color: 'var(--text-primary, #0f172a)',
            outline: 'none',
          }}
        />

        {/* Browse & Upload Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          style={{
            padding: '8px 14px',
            borderRadius: '8px',
            border: '1px solid #3b82f6',
            background: uploading ? '#eff6ff' : '#3b82f6',
            color: uploading ? '#3b82f6' : '#ffffff',
            fontWeight: 600,
            fontSize: '0.82rem',
            cursor: uploading ? 'not-allowed' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            whiteSpace: 'nowrap',
            transition: 'all 0.15s ease',
          }}
        >
          {uploading ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              <span>Uploading...</span>
            </>
          ) : (
            <>
              <UploadCloud size={14} />
              <span>Browse File</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ImageUploadInput;
