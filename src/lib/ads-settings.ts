import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { db } from "./firebase";

export interface AdSlotConfig {
  id: "leaderboard" | "sidebar" | "in-article" | "billboard";
  name: string;
  enabled: boolean;
  imageUrl: string;
  linkUrl: string;
  sponsorName: string;
  title: string;
  description?: string;
  ctaText?: string;
  displayStyle?: "card" | "banner";
  openInNewTab: boolean;
  recommendedSize: string;
}

export interface AdsSettings {
  slots: Record<string, AdSlotConfig>;
  adSenseClientId?: string;
  enableAdSense?: boolean;
}

export const DEFAULT_ADS_SETTINGS: AdsSettings = {
  slots: {
    leaderboard: {
      id: "leaderboard",
      name: "Top Leaderboard Banner",
      enabled: true,
      imageUrl: "",
      linkUrl: "",
      sponsorName: "",
      title: "",
      description: "",
      ctaText: "Visit Sponsor",
      displayStyle: "card",
      openInNewTab: true,
      recommendedSize: "728 × 90 px (or responsive banner)",
    },
    sidebar: {
      id: "sidebar",
      name: "Sidebar Rectangle Ad",
      enabled: true,
      imageUrl: "",
      linkUrl: "",
      sponsorName: "",
      title: "",
      description: "",
      ctaText: "Learn More",
      displayStyle: "card",
      openInNewTab: true,
      recommendedSize: "300 × 250 px",
    },
    "in-article": {
      id: "in-article",
      name: "In-Article Interstitial Ad",
      enabled: true,
      imageUrl: "",
      linkUrl: "",
      sponsorName: "",
      title: "",
      description: "",
      ctaText: "Explore More",
      displayStyle: "card",
      openInNewTab: true,
      recommendedSize: "600 × 200 px (or responsive banner)",
    },
    billboard: {
      id: "billboard",
      name: "Bottom Billboard Banner",
      enabled: true,
      imageUrl: "",
      linkUrl: "",
      sponsorName: "",
      title: "",
      description: "",
      ctaText: "Visit Sponsor",
      displayStyle: "card",
      openInNewTab: true,
      recommendedSize: "970 × 250 px (or wide banner)",
    },
  },
  adSenseClientId: "",
  enableAdSense: false,
};

const STORAGE_KEY = "site_ads_settings";

export function getLocalAdsSettings(): AdsSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_ADS_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_ADS_SETTINGS,
      ...parsed,
      slots: {
        ...DEFAULT_ADS_SETTINGS.slots,
        ...(parsed.slots || {}),
      },
    };
  } catch {
    return DEFAULT_ADS_SETTINGS;
  }
}

export function saveLocalAdsSettings(settings: AdsSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

export async function fetchAdsSettingsFromFirestore(): Promise<AdsSettings> {
  try {
    const ref = doc(db, "settings", "advertisements");
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data() as Partial<AdsSettings>;
      const merged: AdsSettings = {
        ...DEFAULT_ADS_SETTINGS,
        ...data,
        slots: {
          ...DEFAULT_ADS_SETTINGS.slots,
          ...(data.slots || {}),
        },
      };
      saveLocalAdsSettings(merged);
      return merged;
    }
  } catch (err) {
    console.warn("Could not fetch ads from Firestore, reading local fallback:", err);
  }
  return getLocalAdsSettings();
}

export async function saveAdsSettingsToFirestore(settings: AdsSettings): Promise<void> {
  saveLocalAdsSettings(settings);
  try {
    const ref = doc(db, "settings", "advertisements");
    await setDoc(ref, settings, { merge: true });
  } catch (err) {
    console.error("Failed to persist ads settings in Firestore:", err);
    throw err;
  }
}
