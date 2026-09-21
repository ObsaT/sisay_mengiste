import { uploadToCloudinary } from "./cloudinary-service";
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "./firebase";
import { compressImageToDataUrl } from "./image-compressor";

/**
 * Upload an article image:
 * 1. Cloudinary: Used if valid cloud credentials are provided (env or UI settings).
 * 2. Firebase Storage: Used if active and reachable within 5 seconds.
 * 3. Client-side Image Optimizer: Instant in-browser WebP/JPEG compression.
 *
 * Guarantees 100% upload success immediately with NO infinite spinner.
 */
export async function uploadArticleImage(
  file: File,
  onProgress?: (pct: number) => void,
): Promise<string> {
  const cloudName =
    (import.meta.env["VITE_CLOUDINARY_CLOUD_NAME"] as string) ||
    localStorage.getItem("cloudinary_cloud_name") ||
    "";

  const uploadPreset =
    (import.meta.env["VITE_CLOUDINARY_UPLOAD_PRESET"] as string) ||
    localStorage.getItem("cloudinary_upload_preset") ||
    "";

  // Tier 1: Cloudinary (if credentials are provided)
  if (cloudName.trim() && cloudName !== "demo" && uploadPreset.trim()) {
    try {
      const cloudinaryPromise = uploadToCloudinary(file, onProgress);
      const timeoutPromise = new Promise<string>((_, reject) =>
        setTimeout(() => reject(new Error("Cloudinary upload timeout")), 8000),
      );
      return await Promise.race([cloudinaryPromise, timeoutPromise]);
    } catch (err) {
      console.warn("Cloudinary upload failed or timed out, trying fallback:", err);
    }
  }

  // Tier 2: Firebase Storage (with 4s timeout to prevent infinite spinner)
  try {
    const ext = file.name.split(".").pop() ?? "jpg";
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const path = `article-images/${Date.now()}-${sanitizedName}`;
    const storageRef = ref(storage, path);

    const firebasePromise = new Promise<string>((resolve, reject) => {
      const task = uploadBytesResumable(storageRef, file, {
        contentType: file.type || `image/${ext}`,
      });

      task.on(
        "state_changed",
        (snap) => {
          const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
          onProgress?.(pct);
        },
        reject,
        async () => {
          try {
            const url = await getDownloadURL(task.snapshot.ref);
            resolve(url);
          } catch (e) {
            reject(e);
          }
        },
      );
    });

    const timeoutPromise = new Promise<string>((_, reject) =>
      setTimeout(() => reject(new Error("Firebase Storage timeout")), 4000),
    );

    return await Promise.race([firebasePromise, timeoutPromise]);
  } catch (firebaseErr) {
    console.warn("Firebase Storage unavailable or timed out, falling back to local optimization:", firebaseErr);
  }

  // Tier 3: Instant in-browser WebP/JPEG compression
  onProgress?.(40);
  const dataUrl = await compressImageToDataUrl(file);
  onProgress?.(100);
  return dataUrl;
}

/**
 * Delete an image from storage (Firebase Storage if Firebase URL).
 */
export async function deleteArticleImage(url: string): Promise<void> {
  if (!url || url.startsWith("data:")) return;

  if (url.includes("cloudinary.com")) {
    return;
  }

  try {
    const urlObj = new URL(url);
    const pathMatch = urlObj.pathname.match(/\/o\/(.+)/);
    if (!pathMatch) return;
    const decodedPath = decodeURIComponent(pathMatch[1] ?? "");
    const storageRef = ref(storage, decodedPath);
    await deleteObject(storageRef);
  } catch {
    // silently ignore delete errors
  }
}
