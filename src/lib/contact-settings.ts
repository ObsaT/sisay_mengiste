import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";

export interface ContactSettings {
  email: string;
  advertisingEmail?: string;
  phone?: string;
  location?: string;
  telegramSupport?: string;
}

export const DEFAULT_CONTACT_SETTINGS: ContactSettings = {
  email: "otemesgen@gmail.com",
  advertisingEmail: "otemesgen@gmail.com",
  phone: "",
  location: "Addis Ababa, Ethiopia",
  telegramSupport: "",
};

const SETTINGS_COLLECTION = "settings";
const CONTACT_DOC_ID = "contact";
const LOCAL_STORAGE_KEY = "sisay_contact_settings";

export function getLocalContactSettings(): ContactSettings {
  if (typeof window === "undefined") return DEFAULT_CONTACT_SETTINGS;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.email === "string") {
        return { ...DEFAULT_CONTACT_SETTINGS, ...parsed };
      }
    }
  } catch (err) {
    console.warn("Failed to read contact settings from localStorage:", err);
  }
  return DEFAULT_CONTACT_SETTINGS;
}

export function setLocalContactSettings(settings: ContactSettings): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(settings));
  } catch (err) {
    console.warn("Failed to write contact settings to localStorage:", err);
  }
}

export async function fetchContactSettingsFromFirestore(): Promise<ContactSettings> {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, CONTACT_DOC_ID);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as ContactSettings;
      const merged = { ...DEFAULT_CONTACT_SETTINGS, ...data };
      setLocalContactSettings(merged);
      return merged;
    }
  } catch (err) {
    console.warn("Failed to fetch contact settings from Firestore, using local fallback:", err);
  }
  return getLocalContactSettings();
}

export async function saveContactSettingsToFirestore(settings: ContactSettings): Promise<void> {
  setLocalContactSettings(settings);
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, CONTACT_DOC_ID);
    await setDoc(docRef, { ...settings, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (err) {
    console.error("Failed to save contact settings to Firestore:", err);
    throw err;
  }
}
