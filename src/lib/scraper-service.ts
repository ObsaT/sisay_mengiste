export interface ScrapedArticle {
  title: string;
  excerpt: string;
  content: string;
  image?: string;
  author?: string;
  sourceName?: string;
  sourceUrl: string;
  tags?: string[];
  publishedAt?: string;
}

export function isValidUrl(url: string): boolean {
  if (!url || typeof url !== "string") return false;
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function cleanText(text: string): string {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Parses raw HTML string on client side using browser's DOMParser
 */
function parseHtmlClientSide(html: string, originalUrl: string): ScrapedArticle {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  const getMeta = (propOrName: string): string => {
    const el =
      doc.querySelector(`meta[property="${propOrName}"]`) ||
      doc.querySelector(`meta[name="${propOrName}"]`);
    return el?.getAttribute("content")?.trim() || "";
  };

  const hostname = new URL(originalUrl).hostname.replace(/^www\./, "");

  const ogTitle = getMeta("og:title") || getMeta("twitter:title");
  const docTitle = doc.querySelector("title")?.textContent?.trim() || "";
  const title = ogTitle || docTitle || hostname;

  const excerpt =
    getMeta("og:description") ||
    getMeta("description") ||
    getMeta("twitter:description") ||
    "";

  let image = getMeta("og:image") || getMeta("twitter:image") || "";
  if (image && !image.startsWith("http")) {
    try {
      image = new URL(image, originalUrl).href;
    } catch {
      // keep as is
    }
  }

  const author =
    getMeta("author") ||
    getMeta("article:author") ||
    getMeta("og:site_name") ||
    hostname;

  const siteName = getMeta("og:site_name") || hostname;

  // Extract body paragraphs
  const articleEl = doc.querySelector("article") || doc.querySelector("main") || doc.body;
  // Remove non-content elements
  articleEl.querySelectorAll("script, style, nav, footer, header, svg, noscript").forEach((el) => el.remove());

  const paragraphs: string[] = [];
  articleEl.querySelectorAll("p").forEach((p) => {
    const text = cleanText(p.textContent || "");
    if (
      text.length > 30 &&
      !text.toLowerCase().includes("cookie") &&
      !text.toLowerCase().includes("all rights reserved")
    ) {
      paragraphs.push(text);
    }
  });

  const content =
    paragraphs.length > 0
      ? paragraphs.map((p) => `<p>${p}</p>`).join("\n\n")
      : excerpt
      ? `<p>${excerpt}</p>`
      : "";

  return {
    title,
    excerpt: excerpt || (paragraphs[0] ?? ""),
    content,
    image: image || undefined,
    author: author || "YERAS Media Network",
    sourceName: siteName,
    sourceUrl: originalUrl,
  };
}

/**
 * Parses markdown output from Jina reader
 */
function parseJinaMarkdown(markdown: string, originalUrl: string): ScrapedArticle {
  const lines = markdown.split("\n");
  const hostname = new URL(originalUrl).hostname.replace(/^www\./, "");

  let title = "";
  let image = "";
  const paragraphs: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Title line from Jina
    if (!title && trimmed.startsWith("Title:")) {
      title = trimmed.replace(/^Title:\s*/i, "").trim();
      continue;
    }

    // Markdown title #
    if (!title && trimmed.startsWith("# ")) {
      title = trimmed.replace(/^#\s*/, "").trim();
      continue;
    }

    // Markdown image ![alt](url)
    if (!image) {
      const imgMatch = trimmed.match(/!\[.*?\]\((https?:\/\/[^\s)]+)\)/);
      if (imgMatch && imgMatch[1]) {
        const candidate = imgMatch[1];
        if (!candidate.includes("logo") && !candidate.includes("icon")) {
          image = candidate;
        }
      }
    }

    // Clean text lines (skip metadata, headers, buttons)
    if (
      !trimmed.startsWith("URL Source:") &&
      !trimmed.startsWith("Markdown Content:") &&
      !trimmed.startsWith("![]") &&
      !trimmed.startsWith("[") &&
      trimmed.length > 25
    ) {
      paragraphs.push(trimmed);
    }
  }

  const excerpt = paragraphs[0] || "";
  const content = paragraphs.map((p) => `<p>${p}</p>`).join("\n\n");

  return {
    title: title || hostname,
    excerpt,
    content,
    image: image || undefined,
    author: hostname,
    sourceName: hostname,
    sourceUrl: originalUrl,
  };
}

/**
 * Main scraper function with automatic dual-engine fallback:
 * 1. Tries Vercel Serverless Function `/api/scrape?url=...`
 * 2. Falls back to Jina Reader proxy (`https://r.jina.ai/...`)
 * 3. Falls back to AllOrigins CORS Proxy (`https://api.allorigins.win/get?url=...`)
 */
export async function scrapeArticle(rawUrl: string): Promise<ScrapedArticle> {
  const url = rawUrl.trim();
  if (!isValidUrl(url)) {
    throw new Error("Please enter a valid web URL starting with http:// or https://");
  }

  // Strategy 1: Vercel Serverless Function /api/scrape
  try {
    const res = await fetch(`/api/scrape?url=${encodeURIComponent(url)}`, {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    if (res.ok) {
      const data = await res.json();
      if (data?.success && data?.data) {
        return data.data as ScrapedArticle;
      }
    }
  } catch {
    // Serverless function not active (e.g. running in standard local Vite dev)
    console.info("Direct /api/scrape unreachable. Falling back to universal client reader proxy.");
  }

  // Strategy 2: Jina Universal Reader API (CORS-friendly, lightning-fast article extractor)
  try {
    const jinaRes = await fetch(`https://r.jina.ai/${url}`, {
      headers: {
        Accept: "text/plain",
      },
    });

    if (jinaRes.ok) {
      const text = await jinaRes.text();
      if (text && text.length > 100) {
        const parsed = parseJinaMarkdown(text, url);
        if (parsed.title && (parsed.content || parsed.excerpt)) {
          return parsed;
        }
      }
    }
  } catch (jinaErr) {
    console.warn("Jina reader proxy error:", jinaErr);
  }

  // Strategy 3: AllOrigins CORS Proxy fallback
  try {
    const proxyRes = await fetch(
      `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
    );
    if (proxyRes.ok) {
      const json = await proxyRes.json();
      if (json?.contents) {
        const parsed = parseHtmlClientSide(json.contents, url);
        if (parsed.title) {
          return parsed;
        }
      }
    }
  } catch (proxyErr) {
    console.warn("AllOrigins proxy error:", proxyErr);
  }

  throw new Error(
    "Could not extract article from this URL. The website might be blocking automated access or requiring a login.",
  );
}
