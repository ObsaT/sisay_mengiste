import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  type SocialLinkItem,
  DEFAULT_SOCIAL_LINKS,
  getLocalSocialLinks,
  saveSocialLinksToFirestore,
} from "@/lib/social-links";

interface SocialContextType {
  links: SocialLinkItem[];
  activeLinks: SocialLinkItem[];
  loading: boolean;
  updateLink: (id: string, updates: Partial<SocialLinkItem>) => Promise<void>;
  saveAllLinks: (links: SocialLinkItem[]) => Promise<void>;
  addLink: (item: Omit<SocialLinkItem, "id">) => Promise<void>;
  deleteLink: (id: string) => Promise<void>;
  resetToDefaults: () => Promise<void>;
}

const SocialContext = createContext<SocialContextType | null>(null);

export function SocialProvider({ children }: { children: ReactNode }) {
  const [links, setLinks] = useState<SocialLinkItem[]>(getLocalSocialLinks);
  const [loading, setLoading] = useState(true);

  // Synchronize with Firestore `settings/social` in real-time
  useEffect(() => {
    let unsubscribe = () => {};

    try {
      const docRef = doc(db, "settings", "social");
      unsubscribe = onSnapshot(
        docRef,
        (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            if (Array.isArray(data["links"]) && data["links"].length > 0) {
              setLinks(data["links"] as SocialLinkItem[]);
            }
          }
          setLoading(false);
        },
        (err) => {
          console.warn("Firestore social listener error (using local cache):", err);
          setLoading(false);
        },
      );
    } catch (err) {
      console.warn("Could not attach social listener:", err);
      setLoading(false);
    }

    return () => unsubscribe();
  }, []);

  const saveAllLinks = useCallback(async (newLinks: SocialLinkItem[]) => {
    setLinks(newLinks);
    await saveSocialLinksToFirestore(newLinks);
  }, []);

  const updateLink = useCallback(
    async (id: string, updates: Partial<SocialLinkItem>) => {
      const next = links.map((item) => (item.id === id ? { ...item, ...updates } : item));
      await saveAllLinks(next);
    },
    [links, saveAllLinks],
  );

  const addLink = useCallback(
    async (item: Omit<SocialLinkItem, "id">) => {
      const id =
        item.label.toLowerCase().replace(/[^a-z0-9]/g, "") || `custom_${Date.now()}`;
      const nextItem: SocialLinkItem = {
        ...item,
        id: `${id}_${Date.now().toString(36)}`,
        order: links.length + 1,
      };
      await saveAllLinks([...links, nextItem]);
    },
    [links, saveAllLinks],
  );

  const deleteLink = useCallback(
    async (id: string) => {
      const next = links.filter((item) => item.id !== id);
      await saveAllLinks(next);
    },
    [links, saveAllLinks],
  );

  const resetToDefaults = useCallback(async () => {
    await saveAllLinks(DEFAULT_SOCIAL_LINKS);
  }, [saveAllLinks]);

  const activeLinks = useMemo(() => {
    return links
      .filter((l) => l.enabled)
      .sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
  }, [links]);

  return (
    <SocialContext.Provider
      value={{
        links,
        activeLinks,
        loading,
        updateLink,
        saveAllLinks,
        addLink,
        deleteLink,
        resetToDefaults,
      }}
    >
      {children}
    </SocialContext.Provider>
  );
}

export function useSocialLinks(): SocialContextType {
  const ctx = useContext(SocialContext);
  if (!ctx) {
    throw new Error("useSocialLinks must be used within a SocialProvider");
  }
  return ctx;
}
