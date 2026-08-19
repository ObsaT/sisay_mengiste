import {
  collection,
  getDocs,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { LEAD, SIDE, GRID, MOST_READ, OPINION } from "./news-data";

export async function seedFirestore(): Promise<{
  imported: number;
  skipped: number;
}> {
  const existing = await getDocs(collection(db, "articles"));
  if (!existing.empty) {
    return { imported: 0, skipped: existing.size };
  }

  const toClean = (obj: Record<string, unknown>) => {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      if (v !== undefined && v !== null) out[k] = v;
    }
    return out;
  };

  let imported = 0;

  // Lead → featured
  await addDoc(collection(db, "articles"), toClean({
    title: LEAD.title,
    section: LEAD.section,
    author: LEAD.author,
    excerpt: LEAD.excerpt ?? "",
    content: "",
    image: LEAD.image ?? "",
    featured: true,
    published: true,
    breaking: true,
    mostRead: false,
    opinion: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }));
  imported++;

  // Side stories
  for (const item of SIDE) {
    await addDoc(collection(db, "articles"), toClean({
      title: item.title,
      section: item.section,
      author: item.author,
      excerpt: item.excerpt ?? "",
      content: "",
      image: item.image ?? "",
      featured: false,
      published: true,
      breaking: false,
      mostRead: false,
      opinion: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }));
    imported++;
  }

  // Grid stories
  for (const item of GRID) {
    await addDoc(collection(db, "articles"), toClean({
      title: item.title,
      section: item.section,
      author: item.author,
      excerpt: item.excerpt ?? "",
      content: "",
      image: item.image ?? "",
      featured: false,
      published: true,
      breaking: false,
      mostRead: false,
      opinion: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }));
    imported++;
  }

  // Most Read → mark matching articles or create lightweight entries
  for (const title of MOST_READ) {
    await addDoc(collection(db, "articles"), toClean({
      title,
      section: "ዜና",
      author: "ሲሳይ መንግስቴ",
      excerpt: "",
      content: "",
      image: "",
      featured: false,
      published: true,
      breaking: false,
      mostRead: true,
      opinion: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }));
    imported++;
  }

  // Opinion
  for (const item of OPINION) {
    await addDoc(collection(db, "articles"), toClean({
      title: item.title,
      section: "ርዕሰ አንቀጽ",
      author: item.author,
      excerpt: "",
      content: "",
      image: "",
      featured: false,
      published: true,
      breaking: false,
      mostRead: false,
      opinion: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }));
    imported++;
  }

  return { imported, skipped: 0 };
}
