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
  type ContactSettings,
  DEFAULT_CONTACT_SETTINGS,
  getLocalContactSettings,
  saveContactSettingsToFirestore,
} from "@/lib/contact-settings";

interface ContactContextType {
  contact: ContactSettings;
  loading: boolean;
  updateContact: (partial: Partial<ContactSettings>) => Promise<void>;
  saveContact: (settings: ContactSettings) => Promise<void>;
  resetToDefaults: () => Promise<void>;
}

const ContactContext = createContext<ContactContextType | null>(null);

export function ContactProvider({ children }: { children: ReactNode }) {
  const [contact, setContact] = useState<ContactSettings>(getLocalContactSettings);
  const [loading, setLoading] = useState(true);

  // Sync real-time with Firestore settings/contact
  useEffect(() => {
    let unsubscribe = () => {};

    try {
      const docRef = doc(db, "settings", "contact");
      unsubscribe = onSnapshot(
        docRef,
        (snap) => {
          if (snap.exists()) {
            const data = snap.data() as Partial<ContactSettings>;
            setContact((prev) => ({ ...prev, ...data }));
          }
          setLoading(false);
        },
        (err) => {
          console.warn("Firestore contact settings listener error:", err);
          setLoading(false);
        },
      );
    } catch (err) {
      console.warn("Could not attach contact listener:", err);
      setLoading(false);
    }

    return () => unsubscribe();
  }, []);

  const saveContact = useCallback(async (settings: ContactSettings) => {
    setContact(settings);
    await saveContactSettingsToFirestore(settings);
  }, []);

  const updateContact = useCallback(
    async (partial: Partial<ContactSettings>) => {
      const updated = { ...contact, ...partial };
      await saveContact(updated);
    },
    [contact, saveContact],
  );

  const resetToDefaults = useCallback(async () => {
    await saveContact(DEFAULT_CONTACT_SETTINGS);
  }, [saveContact]);

  return (
    <ContactContext.Provider
      value={{
        contact,
        loading,
        updateContact,
        saveContact,
        resetToDefaults,
      }}
    >
      {children}
    </ContactContext.Provider>
  );
}

export function useContact(): ContactContextType {
  const ctx = useContext(ContactContext);
  if (!ctx) {
    throw new Error("useContact must be used within a ContactProvider");
  }
  return ctx;
}
