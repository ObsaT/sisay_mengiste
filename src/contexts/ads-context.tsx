import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  type AdsSettings,
  type AdSlotConfig,
  DEFAULT_ADS_SETTINGS,
  getLocalAdsSettings,
  saveAdsSettingsToFirestore,
} from "@/lib/ads-settings";

interface AdsContextType {
  ads: AdsSettings;
  loading: boolean;
  saveAds: (newSettings: AdsSettings) => Promise<void>;
  updateSlot: (slotId: string, updates: Partial<AdSlotConfig>) => Promise<void>;
  resetToDefaults: () => Promise<void>;
}

const AdsContext = createContext<AdsContextType | null>(null);

export function AdsProvider({ children }: { children: ReactNode }) {
  const [ads, setAds] = useState<AdsSettings>(getLocalAdsSettings);
  const [loading, setLoading] = useState(true);

  // Synchronize with Firestore `settings/advertisements` in real-time
  useEffect(() => {
    let unsubscribe = () => {};

    try {
      const docRef = doc(db, "settings", "advertisements");
      unsubscribe = onSnapshot(
        docRef,
        (snap) => {
          if (snap.exists()) {
            const data = snap.data() as Partial<AdsSettings>;
            setAds({
              ...DEFAULT_ADS_SETTINGS,
              ...data,
              slots: {
                ...DEFAULT_ADS_SETTINGS.slots,
                ...(data.slots || {}),
              },
            });
          }
          setLoading(false);
        },
        (err) => {
          console.warn("Firestore ads listener error (using local cache):", err);
          setLoading(false);
        },
      );
    } catch (err) {
      console.warn("Could not attach ads listener:", err);
      setLoading(false);
    }

    return () => unsubscribe();
  }, []);

  const saveAds = useCallback(async (newSettings: AdsSettings) => {
    setAds(newSettings);
    await saveAdsSettingsToFirestore(newSettings);
  }, []);

  const updateSlot = useCallback(
    async (slotId: string, updates: Partial<AdSlotConfig>) => {
      const current = ads.slots[slotId];
      if (!current) return;
      const updatedSlots = {
        ...ads.slots,
        [slotId]: { ...current, ...updates },
      };
      const newSettings = { ...ads, slots: updatedSlots };
      setAds(newSettings);
      await saveAdsSettingsToFirestore(newSettings);
    },
    [ads],
  );

  const resetToDefaults = useCallback(async () => {
    setAds(DEFAULT_ADS_SETTINGS);
    await saveAdsSettingsToFirestore(DEFAULT_ADS_SETTINGS);
  }, []);

  return (
    <AdsContext.Provider
      value={{
        ads,
        loading,
        saveAds,
        updateSlot,
        resetToDefaults,
      }}
    >
      {children}
    </AdsContext.Provider>
  );
}

export function useAds(): AdsContextType {
  const ctx = useContext(AdsContext);
  if (!ctx) {
    throw new Error("useAds must be used within an AdsProvider");
  }
  return ctx;
}
