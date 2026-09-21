import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  query,
  orderBy,
  limit,
  increment,
  serverTimestamp,
  type Timestamp,
  type DocumentSnapshot,
} from "firebase/firestore";
import { db } from "./firebase";
import { CATEGORY_LABEL, SECTION_TO_SLUG } from "./news-data";

export interface ArticleTranslation {
  title: string;
  excerpt: string;
  content: string;
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  section: string;
  author: string;
  excerpt: string;
  /** HTML string produced by TipTap editor */
  content: string;
  image: string;
  featured: boolean;
  published: boolean;
  breaking: boolean;
  mostRead: boolean;
  opinion: boolean;
  language?: "am" | "om" | "en";
  translations?: Partial<Record<"am" | "om" | "en", ArticleTranslation>>;
  tags?: string[];
  viewCount?: number;
  readTime?: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  videoUrl?: string;
  youtubeVideoId?: string;
}

export type ArticleInput = Omit<Article, "id" | "createdAt" | "updatedAt">;

const ARTICLES_COLLECTION = "articles";

/** Build a URL-safe slug from a title. */
export function articleSlug(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\u1200-\u137f\u0020-\u007ea-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

/** Estimate reading time from HTML content (words / 200 wpm). */
export function estimateReadTime(html: string): number {
  const text = html.replace(/<[^>]+>/g, " ");
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

export function timeAgo(date?: Timestamp, lang: "am" | "om" | "en" = "am"): string {
  if (!date) return "";
  const now = Date.now();
  const then = date.toDate().getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);

  if (lang === "en") {
    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay < 7) return `${diffDay}d ago`;
    return date.toDate().toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  if (lang === "om") {
    if (diffMin < 1) return "Amma";
    if (diffMin < 60) return `daqiiqaa ${diffMin} dura`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `sa'aatii ${diffHr} dura`;
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay < 7) return `guyyaa ${diffDay} dura`;
    return date.toDate().toLocaleDateString("en-ET", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  // Default Amharic
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

/**
 * Normalise the section field so both old articles (saved as slug e.g. "news")
 * and new articles (saved as Amharic label e.g. "ዜና") are handled correctly.
 * Converts slug → Amharic label if needed.
 */
function normaliseSection(raw: string): string {
  // If it's already an Amharic label it won't appear in CATEGORY_LABEL keys
  const fromSlug = CATEGORY_LABEL[raw];
  return fromSlug ?? raw; // prefer label form; keep as-is if already a label
}

function detectArticleScriptLanguage(text: string): "am" | "om" | "en" {
  if (/[\u1200-\u137F]/.test(text)) return "am";
  if (
    /\b(fi|kan|keessatti|irratti|hanga|akka|ykn|mootummaa|biyya|nama|jedhan|ibsan|ta'uu|dura|amma|oduu|gabaasa|guyyaa)\b/i.test(
      text,
    )
  ) {
    return "om";
  }
  return "en";
}

function toArticle(d: DocumentSnapshot): Article {
  const raw = d.data() as Record<string, unknown>;
  const title = (raw["title"] as string) ?? "";
  const rawSection = (raw["section"] as string) ?? "";
  const detected = detectArticleScriptLanguage(title);

  const article: Article = {
    id: d.id,
    title,
    slug: (raw["slug"] as string) || articleSlug(title),
    section: normaliseSection(rawSection),
    author: (raw["author"] as string) ?? "",
    excerpt: (raw["excerpt"] as string) ?? "",
    content: (raw["content"] as string) ?? "",
    image: (raw["image"] as string) ?? "",
    featured: Boolean(raw["featured"]),
    published: Boolean(raw["published"]),
    breaking: Boolean(raw["breaking"]),
    mostRead: Boolean(raw["mostRead"]),
    opinion: Boolean(raw["opinion"]),
    language: (raw["language"] as "am" | "om" | "en") || detected,
    viewCount: (raw["viewCount"] as number) ?? 0,
    readTime: (raw["readTime"] as number) ?? 1,
  };

  if (raw["translations"]) {
    article.translations = raw["translations"] as Partial<
      Record<"am" | "om" | "en", ArticleTranslation>
    >;
  }
  if (raw["tags"]) article.tags = raw["tags"] as string[];
  if (raw["videoUrl"]) article.videoUrl = raw["videoUrl"] as string;
  if (raw["youtubeVideoId"]) article.youtubeVideoId = raw["youtubeVideoId"] as string;
  if (raw["createdAt"]) article.createdAt = raw["createdAt"] as Timestamp;
  if (raw["updatedAt"]) article.updatedAt = raw["updatedAt"] as Timestamp;
  return article;
}

/**
 * Returns the best localized content for an article:
 * - If translated version exists for target language, returns that!
 * - Otherwise returns the original content with flags indicating translation needed.
 */
export function getLocalizedArticleContent(
  article: Article,
  targetLang: "am" | "om" | "en",
): {
  title: string;
  excerpt: string;
  content: string;
  isTranslated: boolean;
  sourceLang: "am" | "om" | "en";
} {
  const sourceLang = article.language || "am";

  // If article is already in the target language
  if (sourceLang === targetLang) {
    return {
      title: article.title,
      excerpt: article.excerpt,
      content: article.content,
      isTranslated: false,
      sourceLang,
    };
  }

  // If a pre-stored translation exists
  if (article.translations?.[targetLang]) {
    const tr = article.translations[targetLang]!;
    return {
      title: tr.title || article.title,
      excerpt: tr.excerpt || article.excerpt,
      content: tr.content || article.content,
      isTranslated: true,
      sourceLang,
    };
  }

  // Original fallback
  return {
    title: article.title,
    excerpt: article.excerpt,
    content: article.content,
    isTranslated: false,
    sourceLang,
  };
}

/* ─────────────────────────────────────────────────────────────────
   CORE FETCH: all articles in one query, sorted by createdAt desc.
   We then filter client-side — avoids Firestore composite index
   requirements (no index setup needed in Firebase Console).
   ───────────────────────────────────────────────────────────────── */

let _cache: Article[] | null = null;
let _cacheTime = 0;
const CACHE_TTL_MS = 30_000; // 30 s

async function fetchAllArticles(): Promise<Article[]> {
  const now = Date.now();
  if (_cache && now - _cacheTime < CACHE_TTL_MS) return _cache;

  const snapshot = await getDocs(
    query(collection(db, ARTICLES_COLLECTION), orderBy("createdAt", "desc")),
  );
  _cache = snapshot.docs.map(toArticle);
  _cacheTime = now;
  return _cache;
}

function invalidateCache() {
  _cache = null;
  _cacheTime = 0;
}

/* ── Generic CRUD ─────────────────────────────────────────────── */

export async function getArticles(): Promise<Article[]> {
  invalidateCache();
  return fetchAllArticles();
}

export async function getArticle(id: string): Promise<Article | null> {
  const snap = await getDoc(doc(db, ARTICLES_COLLECTION, id));
  if (!snap.exists()) return null;
  return toArticle(snap);
}

export async function createArticle(data: ArticleInput): Promise<string> {
  const readTime = estimateReadTime(data.content ?? "");
  invalidateCache();
  const docRef = await addDoc(collection(db, ARTICLES_COLLECTION), {
    ...data,
    slug: articleSlug(data.title),
    readTime,
    viewCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateArticle(id: string, data: Partial<ArticleInput>): Promise<void> {
  const updates: Record<string, unknown> = {
    ...data,
    updatedAt: serverTimestamp(),
  };
  if (data.title) updates["slug"] = articleSlug(data.title);
  if (data.content !== undefined) updates["readTime"] = estimateReadTime(data.content ?? "");
  invalidateCache();
  await updateDoc(doc(db, ARTICLES_COLLECTION, id), updates);
}

export async function deleteArticle(id: string): Promise<void> {
  invalidateCache();
  await deleteDoc(doc(db, ARTICLES_COLLECTION, id));
}

/**
 * Permanently delete multiple or all articles in batches (up to 450 per batch).
 */
export async function deleteAllArticles(ids?: string[]): Promise<number> {
  invalidateCache();
  const allIds = ids && ids.length > 0 ? ids : (await fetchAllArticles()).map((a) => a.id);
  if (allIds.length === 0) return 0;

  const chunkSize = 450;
  for (let i = 0; i < allIds.length; i += chunkSize) {
    const chunk = allIds.slice(i, i + chunkSize);
    const batch = writeBatch(db);
    chunk.forEach((id) => {
      batch.delete(doc(db, ARTICLES_COLLECTION, id));
    });
    await batch.commit();
  }
  invalidateCache();
  return allIds.length;
}

export async function incrementViewCount(id: string): Promise<void> {
  await updateDoc(doc(db, ARTICLES_COLLECTION, id), {
    viewCount: increment(1),
  });
}

/* ── Query helpers — all client-side filtered ─────────────────── */

export async function getPublishedArticles(pageSize = 30): Promise<Article[]> {
  const all = await fetchAllArticles();
  return all.filter((a) => a.published).slice(0, pageSize);
}

export async function getPublishedBySection(sectionOrSlug: string): Promise<Article[]> {
  const all = await fetchAllArticles();
  const amharicLabel = CATEGORY_LABEL[sectionOrSlug] || sectionOrSlug;
  return all.filter(
    (a) =>
      a.published &&
      (a.section === amharicLabel ||
        a.section.toLowerCase() === sectionOrSlug.toLowerCase() ||
        SECTION_TO_SLUG[a.section] === sectionOrSlug),
  );
}

export async function getFeaturedArticle(): Promise<Article | null> {
  const all = await fetchAllArticles();
  return all.find((a) => a.published && a.featured) ?? all.find((a) => a.published) ?? null;
}

export async function getBreakingNews(): Promise<Article[]> {
  const all = await fetchAllArticles();
  return all.filter((a) => a.published && a.breaking).slice(0, 8);
}

export async function getMostRead(): Promise<Article[]> {
  const all = await fetchAllArticles();
  const marked = all.filter((a) => a.published && a.mostRead);
  if (marked.length > 0) {
    return [...marked].sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0)).slice(0, 6);
  }
  // Fallback: top-viewed published articles
  return [...all.filter((a) => a.published)]
    .sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0))
    .slice(0, 6);
}

export async function getOpinionArticles(): Promise<Article[]> {
  const all = await fetchAllArticles();
  return all.filter((a) => a.published && a.opinion).slice(0, 4);
}

export async function findArticleBySlug(slug: string): Promise<Article | null> {
  // Fetch all (cache hit for subsequent calls on same page)
  const all = await fetchAllArticles();
  // 1. Match by stored slug field
  let found = all.find((a) => a.published && a.slug === slug);
  if (found) return found;
  // 2. Derive slug from title (handles legacy articles without slug field)
  found = all.find((a) => a.published && articleSlug(a.title) === slug);
  if (found) return found;
  // 3. Unpublished preview (admin)
  found = all.find((a) => a.slug === slug || articleSlug(a.title) === slug);
  return found ?? null;
}

export async function findRelatedArticles(article: Article): Promise<Article[]> {
  const all = await fetchAllArticles();
  return all
    .filter((a) => a.published && a.section === article.section && a.id !== article.id)
    .slice(0, 3);
}

/** Client-side full-text search across title, excerpt, author, section. */
export function searchArticles(articles: Article[], q: string): Article[] {
  const lower = q.toLowerCase();
  if (!lower.trim()) return articles;
  return articles.filter(
    (a) =>
      a.title.toLowerCase().includes(lower) ||
      a.excerpt.toLowerCase().includes(lower) ||
      a.author.toLowerCase().includes(lower) ||
      a.section.toLowerCase().includes(lower),
  );
}
