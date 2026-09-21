import { type Language } from "./i18n";

/**
 * Cache for translations to minimize network requests and provide instant responses.
 */
const MEMORY_CACHE = new Map<string, string>();

function getCacheKey(text: string, from: string, to: string): string {
  return `${from}_${to}_${text.trim().slice(0, 100)}_${text.length}`;
}

function decodeHtmlEntities(text: string): string {
  if (typeof document !== "undefined") {
    const txt = document.createElement("textarea");
    txt.innerHTML = text;
    return txt.value;
  }
  return text
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

/**
 * Heuristic language detector:
 * - Checks for Ge'ez Ethiopic script (U+1200 - U+137F) -> "am"
 * - Checks for common Afaan Oromoo vocabulary / double vowel patterns -> "om"
 * - Otherwise falls back to "en"
 */
export function detectLanguage(text: string): Language {
  if (!text) return "am";
  const sample = text.slice(0, 500);

  // Check Ethiopic script
  if (/[\u1200-\u137F]/.test(sample)) {
    return "am";
  }

  // Check Afaan Oromoo patterns (double vowels, common grammar words)
  const oromoWordMatch = sample.match(
    /\b(fi|kan|keessatti|irratti|hanga|akka|ykn|mootummaa|biyya|nama|jedhan|ibsan|ta'uu|dura|amma|oduu|gabaasa|guyyaa)\b/i,
  );
  const doubleVowelCount = (sample.match(/(aa|ee|ii|oo|uu)/gi) || []).length;

  if (oromoWordMatch || doubleVowelCount >= 3) {
    return "om";
  }

  return "en";
}

/**
 * Translate a single chunk of text using MyMemory API with caching.
 */
export async function translateText(
  text: string,
  fromLang: string = "auto",
  toLang: Language = "en",
): Promise<string> {
  const trimmed = text.trim();
  if (!trimmed) return text;
  // Resolve source language with script verification
  let source = fromLang === "auto" ? detectLanguage(trimmed) : fromLang;

  // Guard against mismatched metadata:
  // If metadata claims "am" but text has no Ge'ez script, re-detect
  if (source === "am" && !/[\u1200-\u137F]/.test(trimmed)) {
    source = detectLanguage(trimmed);
  }
  // If metadata claims "om" or "en" but text contains Ge'ez script, it's Amharic
  if ((source === "om" || source === "en") && /[\u1200-\u137F]/.test(trimmed)) {
    source = "am";
  }

  if (source === toLang) return text;

  const cacheKey = getCacheKey(trimmed, source, toLang);

  // 1. Check memory cache
  if (MEMORY_CACHE.has(cacheKey)) {
    return MEMORY_CACHE.get(cacheKey)!;
  }

  // 2. Check localStorage cache
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(`tr_${cacheKey}`);
      if (stored) {
        MEMORY_CACHE.set(cacheKey, stored);
        return stored;
      }
    } catch {
      // ignore storage errors
    }
  }

  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
      trimmed,
    )}&langpair=${source}|${toLang}`;

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Translation API error: ${res.status}`);
    }

    const data = await res.json();
    let result = (data?.responseData?.translatedText as string) || text;
    result = decodeHtmlEntities(result);

    // Save to caches
    MEMORY_CACHE.set(cacheKey, result);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(`tr_${cacheKey}`, result);
      } catch {
        // storage quota exceeded, ignore
      }
    }

    return result;
  } catch (err) {
    console.warn("Translation failed, returning original text:", err);
    return text;
  }
}

/**
 * Translate an HTML block (e.g. TipTap rich text output) paragraph by paragraph concurrently.
 */
export async function translateHtml(
  html: string,
  fromLang: string = "auto",
  toLang: Language = "en",
): Promise<string> {
  if (!html || !html.trim()) return html;
  if (fromLang === toLang) return html;

  // If simple plain text without HTML tags
  if (!html.includes("<")) {
    return translateText(html, fromLang, toLang);
  }

  // Parse HTML in browser or split by tag
  if (typeof document !== "undefined") {
    const div = document.createElement("div");
    div.innerHTML = html;

    // Collect all translatable elements (p, h1, h2, h3, h4, li, blockquote)
    const elements = Array.from(div.querySelectorAll("p, h1, h2, h3, h4, h5, h6, li, blockquote"));

    if (elements.length === 0) {
      const text = div.textContent || "";
      const trans = await translateText(text, fromLang, toLang);
      div.textContent = trans;
      return div.innerHTML;
    }

    // Translate all elements in parallel for speed
    await Promise.all(
      elements.map(async (el) => {
        const originalText = el.textContent?.trim();
        if (originalText) {
          const translated = await translateText(originalText, fromLang, toLang);
          el.textContent = translated;
        }
      }),
    );

    return div.innerHTML;
  }

  // Fallback: translate whole string if not in DOM
  return translateText(html, fromLang, toLang);
}

/**
 * Translate an entire article bundle (title, excerpt, content)
 */
export async function translateArticleBundle(
  article: { title: string; excerpt: string; content: string },
  fromLang: string = "auto",
  toLang: Language = "en",
  onProgress?: (step: string) => void,
): Promise<{ title: string; excerpt: string; content: string }> {
  const source = fromLang === "auto" ? detectLanguage(article.title) : fromLang;
  if (source === toLang) {
    return { ...article };
  }

  onProgress?.("Translating title & summary...");
  const [translatedTitle, translatedExcerpt] = await Promise.all([
    translateText(article.title, source, toLang),
    article.excerpt ? translateText(article.excerpt, source, toLang) : Promise.resolve(""),
  ]);

  onProgress?.("Translating article content...");
  const translatedContent = article.content
    ? await translateHtml(article.content, source, toLang)
    : "";

  return {
    title: translatedTitle,
    excerpt: translatedExcerpt,
    content: translatedContent,
  };
}
