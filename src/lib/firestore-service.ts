import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  limit,
  serverTimestamp,
  type Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

export interface Article {
  id: string;
  title: string;
  section: string;
  author: string;
  excerpt: string;
  content: string;
  image: string;
  featured: boolean;
  published: boolean;
  breaking: boolean;
  mostRead: boolean;
  opinion: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export type ArticleInput = Omit<Article, "id" | "createdAt" | "updatedAt">;

const ARTICLES_COLLECTION = "articles";

function toArticle(d: { id: string; data: () => Record<string, unknown> }): Article {
  const raw = d.data() as Record<string, unknown>;
  return {
    id: d.id,
    title: (raw["title"] as string) ?? "",
    section: (raw["section"] as string) ?? "",
    author: (raw["author"] as string) ?? "",
    excerpt: (raw["excerpt"] as string) ?? "",
    content: (raw["content"] as string) ?? "",
    image: (raw["image"] as string) ?? "",
    featured: (raw["featured"] as boolean) ?? false,
    published: (raw["published"] as boolean) ?? false,
    breaking: (raw["breaking"] as boolean) ?? false,
    mostRead: (raw["mostRead"] as boolean) ?? false,
    opinion: (raw["opinion"] as boolean) ?? false,
    createdAt: raw["createdAt"] as Timestamp,
    updatedAt: raw["updatedAt"] as Timestamp,
  } as Article;
}

function sortByDateDesc(articles: Article[]): Article[] {
  return [...articles].sort((a, b) => {
    const ta = a.createdAt?.toMillis?.() ?? 0;
    const tb = b.createdAt?.toMillis?.() ?? 0;
    return tb - ta;
  });
}

/* ── Generic CRUD ─────────────────────────────────────────────── */

export async function getArticles(): Promise<Article[]> {
  const snapshot = await getDocs(collection(db, ARTICLES_COLLECTION));
  return sortByDateDesc(snapshot.docs.map(toArticle));
}

export async function getArticle(id: string): Promise<Article | null> {
  const snap = await getDoc(doc(db, ARTICLES_COLLECTION, id));
  if (!snap.exists()) return null;
  return toArticle(snap);
}

export async function createArticle(data: ArticleInput): Promise<string> {
  const docRef = await addDoc(collection(db, ARTICLES_COLLECTION), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateArticle(
  id: string,
  data: Partial<ArticleInput>,
): Promise<void> {
  await updateDoc(doc(db, ARTICLES_COLLECTION, id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteArticle(id: string): Promise<void> {
  await deleteDoc(doc(db, ARTICLES_COLLECTION, id));
}

/* ── Query helpers for the public site ────────────────────────── */

export async function getPublishedArticles(): Promise<Article[]> {
  const snapshot = await getDocs(
    query(collection(db, ARTICLES_COLLECTION), where("published", "==", true)),
  );
  return sortByDateDesc(snapshot.docs.map(toArticle));
}

export async function getPublishedBySection(section: string): Promise<Article[]> {
  const snapshot = await getDocs(
    query(
      collection(db, ARTICLES_COLLECTION),
      where("published", "==", true),
      where("section", "==", section),
    ),
  );
  return sortByDateDesc(snapshot.docs.map(toArticle));
}

export async function getFeaturedArticle(): Promise<Article | null> {
  const snapshot = await getDocs(
    query(
      collection(db, ARTICLES_COLLECTION),
      where("published", "==", true),
      where("featured", "==", true),
      limit(1),
    ),
  );
  if (snapshot.empty) return null;
  return toArticle(snapshot.docs[0]!);
}

export async function getBreakingNews(): Promise<Article[]> {
  const snapshot = await getDocs(
    query(
      collection(db, ARTICLES_COLLECTION),
      where("published", "==", true),
      where("breaking", "==", true),
    ),
  );
  return sortByDateDesc(snapshot.docs.map(toArticle));
}

export async function getMostRead(): Promise<Article[]> {
  const snapshot = await getDocs(
    query(
      collection(db, ARTICLES_COLLECTION),
      where("published", "==", true),
      where("mostRead", "==", true),
    ),
  );
  return sortByDateDesc(snapshot.docs.map(toArticle));
}

export async function getOpinionArticles(): Promise<Article[]> {
  const snapshot = await getDocs(
    query(
      collection(db, ARTICLES_COLLECTION),
      where("published", "==", true),
      where("opinion", "==", true),
    ),
  );
  return sortByDateDesc(snapshot.docs.map(toArticle));
}

export async function findArticleBySlug(slug: string): Promise<Article | null> {
  const all = await getPublishedArticles();
  return all.find((a) => articleSlug(a.title) === slug) ?? null;
}

export async function findRelatedArticles(article: Article): Promise<Article[]> {
  const all = await getPublishedArticles();
  return all
    .filter((a) => a.section === article.section && a.id !== article.id)
    .slice(0, 3);
}

/* ── Slug helpers ─────────────────────────────────────────────── */

export function articleSlug(title: string): string {
  return title.trim().replace(/\s+/g, "-").slice(0, 80);
}

export function timeAgo(date?: Timestamp): string {
  if (!date) return "";
  const now = Date.now();
  const then = date.toDate().getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "አሁን";
  if (diffMin < 60) return `ከ${diffMin} ደቂቃ በፊት`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `ከ${diffHr} ሰዓት በፊት`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `ከ${diffDay} ቀን በፊት`;
  return date.toDate().toLocaleDateString("am-ET", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
