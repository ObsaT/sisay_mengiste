import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";

export interface SocialLinkItem {
  id: string;
  label: string;
  href: string;
  enabled: boolean;
  order?: number;
  icon?: string;
}

export const DEFAULT_SOCIAL_LINKS: SocialLinkItem[] = [
  {
    id: "facebook",
    label: "Facebook",
    href: "https://www.facebook.com/EThReporter",
    enabled: true,
    order: 1,
    icon: "Facebook",
  },
  {
    id: "telegram",
    label: "Telegram",
    href: "https://t.me/EthiopianReporterAmharic",
    enabled: true,
    order: 2,
    icon: "Telegram",
  },
  {
    id: "x",
    label: "X (Twitter)",
    href: "https://twitter.com/ethioreporter",
    enabled: true,
    order: 3,
    icon: "X",
  },
  {
    id: "youtube",
    label: "YouTube",
    href: "https://www.youtube.com/@ethiopiareporter",
    enabled: true,
    order: 4,
    icon: "YouTube",
  },
  {
    id: "tiktok",
    label: "TikTok",
    href: "https://www.tiktok.com/@ethiopianreporter",
    enabled: true,
    order: 5,
    icon: "TikTok",
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    href: "https://www.linkedin.com/company/107230554",
    enabled: true,
    order: 6,
    icon: "LinkedIn",
  },
  {
    id: "instagram",
    label: "Instagram",
    href: "https://www.instagram.com/ethiopianreporter",
    enabled: false,
    order: 7,
    icon: "Instagram",
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    href: "https://whatsapp.com/channel/0029Vaexample",
    enabled: false,
    order: 8,
    icon: "WhatsApp",
  },
];

const SETTINGS_COLLECTION = "settings";
const SOCIAL_DOC_ID = "social";
const LOCAL_STORAGE_KEY = "sisay_social_links";

/** Load cached links from localStorage */
export function getLocalSocialLinks(): SocialLinkItem[] {
  if (typeof window === "undefined") return DEFAULT_SOCIAL_LINKS;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn("Failed to read social links from localStorage:", err);
  }
  return DEFAULT_SOCIAL_LINKS;
}

/** Cache links in localStorage */
export function setLocalSocialLinks(links: SocialLinkItem[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(links));
  } catch (err) {
    console.warn("Failed to save social links to localStorage:", err);
  }
}

/** Fetch social links from Firestore document `settings/social` */
export async function fetchSocialLinksFromFirestore(): Promise<SocialLinkItem[]> {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, SOCIAL_DOC_ID);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      if (Array.isArray(data["links"]) && data["links"].length > 0) {
        const links = data["links"] as SocialLinkItem[];
        setLocalSocialLinks(links);
        return links;
      }
    }
  } catch (err) {
    console.warn("Could not fetch social links from Firestore, using local fallback:", err);
  }
  return getLocalSocialLinks();
}

/** Save social links to Firestore */
export async function saveSocialLinksToFirestore(links: SocialLinkItem[]): Promise<void> {
  // Always update local cache immediately
  setLocalSocialLinks(links);

  try {
    const docRef = doc(db, SETTINGS_COLLECTION, SOCIAL_DOC_ID);
    await setDoc(docRef, { links, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (err) {
    console.error("Failed to save social links to Firestore:", err);
    throw err;
  }
}
