import { uploadToCloudinary } from "./cloudinary-service";
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "./firebase";

/**
 * Upload an article image:
 * Primary provider: Cloudinary (global CDN, auto WebP/AVIF, auto quality).
 * Fallback provider: Firebase Storage.
 *
 * Best practice: Store only the public secure download URL in Firestore.
 */
export async function uploadArticleImage(
  file: File,
  onProgress?: (pct: number) => void,
): Promise<string> {
  const cloudName =
    (import.meta.env["VITE_CLOUDINARY_CLOUD_NAME"] as string) ||
    localStorage.getItem("cloudinary_cloud_name");

  // If Cloudinary is configured, use Cloudinary
  if (cloudName && cloudName !== "demo") {
    try {
      return await uploadToCloudinary(file, onProgress);
    } catch (cloudinaryErr) {
      console.warn(
        "Cloudinary upload failed, attempting Firebase Storage fallback:",
        cloudinaryErr,
      );
    }
  } else {
    // Try Cloudinary first
    try {
      return await uploadToCloudinary(file, onProgress);
    } catch {
      // Fall through to Firebase Storage
    }
  }

  // Fallback to Firebase Storage
  const ext = file.name.split(".").pop() ?? "jpg";
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
  const path = `article-images/${Date.now()}-${sanitizedName}`;
  const storageRef = ref(storage, path);

  return new Promise((resolve, reject) => {
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
}

/**
 * Delete an image from storage (Firebase Storage if Firebase URL).
 */
export async function deleteArticleImage(url: string): Promise<void> {
  if (!url) return;

  // Cloudinary client delete requires signature/admin API on backend,
  // so client-side we simply clear the URL reference in Firestore.
  if (url.includes("cloudinary.com")) {
    return;
  }

  // If it's a Firebase Storage URL
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
