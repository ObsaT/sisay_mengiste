/**
 * Cloudinary Image Storage Service
 *
 * Direct unauthenticated client uploads using Cloudinary's unsigned upload preset.
 * Offers automatic image optimization (WebP/AVIF format, auto quality, CDN delivery).
 */

const DEFAULT_CLOUD_NAME = (import.meta.env["VITE_CLOUDINARY_CLOUD_NAME"] as string) || "demo";
const DEFAULT_UPLOAD_PRESET =
  (import.meta.env["VITE_CLOUDINARY_UPLOAD_PRESET"] as string) || "docs_upload_example_preset";

export interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
  created_at: string;
}

/**
 * Upload an image file directly to Cloudinary.
 * Reports real-time upload progress (0-100%).
 * Returns the optimized secure CDN URL.
 */
export function uploadToCloudinary(
  file: File,
  onProgress?: (pct: number) => void,
): Promise<string> {
  const cloudName =
    (import.meta.env["VITE_CLOUDINARY_CLOUD_NAME"] as string) ||
    localStorage.getItem("cloudinary_cloud_name") ||
    DEFAULT_CLOUD_NAME;

  const uploadPreset =
    (import.meta.env["VITE_CLOUDINARY_UPLOAD_PRESET"] as string) ||
    localStorage.getItem("cloudinary_upload_preset") ||
    DEFAULT_UPLOAD_PRESET;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

    xhr.open("POST", url, true);

    // Track upload progress
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const pct = Math.round((e.loaded / e.total) * 100);
        onProgress?.(pct);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response: CloudinaryUploadResponse = JSON.parse(xhr.responseText);
          // Return optimized secure URL with f_auto,q_auto for next-gen performance
          const optimizedUrl = response.secure_url.replace("/upload/", "/upload/f_auto,q_auto/");
          resolve(optimizedUrl);
        } catch {
          reject(new Error("Failed to parse Cloudinary response."));
        }
      } else {
        let errorMsg = `Upload failed with status ${xhr.status}`;
        try {
          const errData = JSON.parse(xhr.responseText);
          if (errData?.error?.message) {
            errorMsg = errData.error.message;
          }
        } catch {
          // ignore
        }
        reject(new Error(errorMsg));
      }
    };

    xhr.onerror = () => {
      reject(new Error("Network error during Cloudinary upload."));
    };

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);
    formData.append("folder", "sisay_mengiste_news");

    xhr.send(formData);
  });
}

/**
 * Format a Cloudinary URL with responsive transformations (width, height, crop).
 */
export function getOptimizedImageUrl(url: string, width: number = 800, height?: number): string {
  if (!url || !url.includes("cloudinary.com")) return url;

  const transformation = height
    ? `c_fill,w_${width},h_${height},f_auto,q_auto`
    : `w_${width},f_auto,q_auto`;

  return url.replace("/upload/", `/upload/${transformation}/`);
}
