import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";

export interface CloudinarySettings {
  cloudName: string;
  uploadPreset: string;
  folder?: string;
}

export const DEFAULT_CLOUDINARY_SETTINGS: CloudinarySettings = {
  cloudName: (import.meta.env["VITE_CLOUDINARY_CLOUD_NAME"] as string) || "obsapersonal",
  uploadPreset: (import.meta.env["VITE_CLOUDINARY_UPLOAD_PRESET"] as string) || "sisay_mengiste",
  folder: "sisay_mengiste_news",
};

const SETTINGS_COLLECTION = "settings";
const CLOUDINARY_DOC_ID = "cloudinary";
const LOCAL_STORAGE_KEY = "sisay_cloudinary_settings";

export function getLocalCloudinarySettings(): CloudinarySettings {
  if (typeof window === "undefined") return DEFAULT_CLOUDINARY_SETTINGS;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.cloudName === "string") {
        return { ...DEFAULT_CLOUDINARY_SETTINGS, ...parsed };
      }
    }
    const legacyCloud = localStorage.getItem("cloudinary_cloud_name");
    const legacyPreset = localStorage.getItem("cloudinary_upload_preset");
    if (legacyCloud || legacyPreset) {
      return {
        ...DEFAULT_CLOUDINARY_SETTINGS,
        cloudName: legacyCloud || DEFAULT_CLOUDINARY_SETTINGS.cloudName,
        uploadPreset: legacyPreset || DEFAULT_CLOUDINARY_SETTINGS.uploadPreset,
      };
    }
  } catch (err) {
    console.warn("Failed to read Cloudinary settings from localStorage:", err);
  }
  return DEFAULT_CLOUDINARY_SETTINGS;
}

export function setLocalCloudinarySettings(settings: CloudinarySettings): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(settings));
    localStorage.setItem("cloudinary_cloud_name", settings.cloudName);
    localStorage.setItem("cloudinary_upload_preset", settings.uploadPreset);
  } catch (err) {
    console.warn("Failed to write Cloudinary settings to localStorage:", err);
  }
}

export async function fetchCloudinarySettingsFromFirestore(): Promise<CloudinarySettings> {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, CLOUDINARY_DOC_ID);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as CloudinarySettings;
      const merged = { ...DEFAULT_CLOUDINARY_SETTINGS, ...data };
      setLocalCloudinarySettings(merged);
      return merged;
    }
  } catch (err) {
    console.warn("Failed to fetch Cloudinary settings from Firestore, using local fallback:", err);
  }
  return getLocalCloudinarySettings();
}

export async function saveCloudinarySettingsToFirestore(
  settings: CloudinarySettings,
): Promise<void> {
  setLocalCloudinarySettings(settings);
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, CLOUDINARY_DOC_ID);
    await setDoc(docRef, { ...settings, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (err) {
    console.error("Failed to save Cloudinary settings to Firestore:", err);
    throw err;
  }
}
