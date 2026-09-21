import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";

export interface Subscriber {
  id: string;
  email: string;
  subscribedAt: string;
  language?: string;
  status: "active" | "unsubscribed";
}

const SUBSCRIBERS_STORAGE_KEY = "newsletter_subscribers";

function getLocalSubscribers(): Subscriber[] {
  try {
    const raw = localStorage.getItem(SUBSCRIBERS_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveLocalSubscribers(list: Subscriber[]): void {
  try {
    localStorage.setItem(SUBSCRIBERS_STORAGE_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
}

/**
 * Subscribe an email address to the newsletter.
 * Saves to Firestore `subscribers` collection and updates local cache.
 */
export async function subscribeEmail(
  email: string,
  language: string = "am",
): Promise<{ success: boolean; isNew: boolean; message?: string }> {
  const cleanEmail = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(cleanEmail)) {
    throw new Error("Invalid email address.");
  }

  // Create document ID from sanitized email
  const docId = cleanEmail.replace(/[^a-zA-Z0-9_.-]/g, "_");
  const localList = getLocalSubscribers();
  const existingLocal = localList.find((s) => s.email.toLowerCase() === cleanEmail);

  const newSubscriber: Subscriber = {
    id: docId,
    email: cleanEmail,
    subscribedAt: new Date().toISOString(),
    language,
    status: "active",
  };

  let isNew = true;

  try {
    const subscriberRef = doc(db, "subscribers", docId);
    const snap = await getDoc(subscriberRef);

    if (snap.exists()) {
      isNew = false;
      // Re-activate if was unsubscribed
      await setDoc(
        subscriberRef,
        {
          email: cleanEmail,
          language,
          status: "active",
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
    } else {
      await setDoc(subscriberRef, {
        email: cleanEmail,
        language,
        status: "active",
        createdAt: serverTimestamp(),
      });
    }
  } catch (err) {
    console.warn("Firestore error while subscribing, using local storage fallback:", err);
    if (existingLocal) {
      isNew = false;
    }
  }

  // Update local cache
  if (existingLocal) {
    saveLocalSubscribers(
      localList.map((s) => (s.email.toLowerCase() === cleanEmail ? { ...s, status: "active" } : s)),
    );
  } else {
    saveLocalSubscribers([newSubscriber, ...localList]);
  }

  return { success: true, isNew };
}

/**
 * Fetch all subscribers from Firestore, with local cache fallback.
 */
export async function fetchSubscribers(): Promise<Subscriber[]> {
  try {
    const q = query(collection(db, "subscribers"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);

    if (!snap.empty) {
      const remoteSubscribers: Subscriber[] = snap.docs.map((d) => {
        const data = d.data();
        let dateStr = new Date().toISOString();
        if (data.createdAt?.toDate) {
          dateStr = data.createdAt.toDate().toISOString();
        } else if (data.subscribedAt) {
          dateStr = data.subscribedAt;
        }

        return {
          id: d.id,
          email: data.email || d.id,
          subscribedAt: dateStr,
          language: data.language || "am",
          status: data.status || "active",
        };
      });

      saveLocalSubscribers(remoteSubscribers);
      return remoteSubscribers;
    }
  } catch (err) {
    console.warn("Could not fetch remote subscribers, reading local fallback:", err);
  }

  return getLocalSubscribers();
}

/**
 * Delete a subscriber by ID.
 */
export async function deleteSubscriber(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "subscribers", id));
  } catch (err) {
    console.warn("Error deleting subscriber from Firestore:", err);
  }

  const list = getLocalSubscribers().filter((s) => s.id !== id);
  saveLocalSubscribers(list);
}

/**
 * Export subscribers to CSV file and trigger browser download.
 */
export function exportSubscribersToCsv(subscribers: Subscriber[]): void {
  if (subscribers.length === 0) return;

  const headers = ["Email", "Language", "Status", "Subscribed At"];
  const rows = subscribers.map((s) => [
    `"${s.email.replace(/"/g, '""')}"`,
    `"${(s.language || "am").replace(/"/g, '""')}"`,
    `"${s.status}"`,
    `"${new Date(s.subscribedAt).toLocaleString()}"`,
  ]);

  const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `subscribers_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
