import type { IncomingMessage, ServerResponse } from "http";

interface ScrapedData {
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

function cleanText(text: string): string {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function extractMeta(html: string, nameOrProp: string): string {
  // Matches both property="og:..." and name="..." with either content="..." or value="..."
  const regex1 = new RegExp(
    `<meta[^>]*(?:property|name)=["']${nameOrProp}["'][^>]*content=["']([^"']*)["']`,
    "i",
  );
  const regex2 = new RegExp(
    `<meta[^>]*content=["']([^"']*)["'][^>]*(?:property|name)=["']${nameOrProp}["']`,
    "i",
  );
  const match1 = html.match(regex1);
  if (match1 && match1[1]) return cleanText(match1[1]);
  const match2 = html.match(regex2);
  if (match2 && match2[1]) return cleanText(match2[1]);
  return "";
}

function extractTitle(html: string): string {
  const ogTitle = extractMeta(html, "og:title") || extractMeta(html, "twitter:title");
  if (ogTitle) return ogTitle;
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch && titleMatch[1]) {
    const raw = cleanText(titleMatch[1]);
    // Strip site suffix if present (e.g. "Title - BBC News" -> "Title")
    const parts = raw.split(/\s*[-–|—]\s*/);
    return parts.length > 1 && parts[0]!.length > 10 ? parts[0]! : raw;
  }
  return "";
}

function extractImage(html: string, baseUrl: string): string {
  const ogImg = extractMeta(html, "og:image") || extractMeta(html, "twitter:image");
  if (ogImg) {
    if (ogImg.startsWith("http://") || ogImg.startsWith("https://")) return ogImg;
    try {
      return new URL(ogImg, baseUrl).href;
    } catch {
      return ogImg;
    }
  }

  // Fallback: search for first content image in article
  const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  const searchArea = articleMatch ? articleMatch[1] : html;
  const imgMatch = searchArea.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/i);
  if (imgMatch && imgMatch[1]) {
    const src = imgMatch[1];
    if (
      !src.includes("data:image") &&
      !src.includes("icon") &&
      !src.includes("logo") &&
      !src.includes("avatar")
    ) {
      if (src.startsWith("http://") || src.startsWith("https://")) return src;
      try {
        return new URL(src, baseUrl).href;
      } catch {
        return src;
      }
    }
  }
  return "";
}

function extractBodyContent(html: string): { content: string; excerpt: string } {
  // Strip head, scripts, styles, svg, nav, footer, headers
  let cleaned = html
    .replace(/<head[^>]*>[\s\S]*?<\/head>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<svg[^>]*>[\s\S]*?<\/svg>/gi, "")
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "")
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, "");

  // Look for article body container
  const articleMatch = cleaned.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  const scope = articleMatch ? articleMatch[1] : cleaned;

  // Extract all paragraphs
  const pMatches = scope.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi);
  const paragraphs: string[] = [];

  for (const m of pMatches) {
    if (m[1]) {
      // Strip inner tags
      const text = cleanText(m[1].replace(/<[^>]+>/g, ""));
      // Ignore tiny paragraphs like copyrights or "read more"
      if (
        text.length > 30 &&
        !text.toLowerCase().includes("cookie") &&
        !text.toLowerCase().includes("all rights reserved") &&
        !text.toLowerCase().includes("subscribe to our newsletter")
      ) {
        paragraphs.push(text);
      }
    }
  }

  const excerpt = paragraphs[0] || "";
  const content = paragraphs.map((p) => `<p>${p}</p>`).join("\n\n");

  return { content, excerpt };
}

export default async function handler(req: any, res: any) {
  // CORS setup
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  let targetUrl = "";
  if (req.method === "GET") {
    targetUrl = (req.query?.url as string) || "";
  } else if (req.method === "POST") {
    targetUrl = req.body?.url || "";
  }

  if (!targetUrl) {
    res.status(400).json({ error: "Missing required 'url' parameter" });
    return;
  }

  try {
    const parsedUrl = new URL(targetUrl);
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      res.status(400).json({ error: "Invalid URL protocol. Must be HTTP or HTTPS." });
      return;
    }

    const response = await fetch(targetUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "am,en-US,en;q=0.9",
      },
      redirect: "follow",
    });

    if (!response.ok) {
      res
        .status(response.status)
        .json({ error: `Target server responded with HTTP ${response.status}` });
      return;
    }

    const html = await response.text();

    const title = extractTitle(html);
    const metaDescription =
      extractMeta(html, "og:description") ||
      extractMeta(html, "description") ||
      extractMeta(html, "twitter:description");
    const image = extractImage(html, targetUrl);
    const author =
      extractMeta(html, "author") ||
      extractMeta(html, "article:author") ||
      extractMeta(html, "og:site_name") ||
      parsedUrl.hostname.replace(/^www\./, "");
    const siteName =
      extractMeta(html, "og:site_name") || parsedUrl.hostname.replace(/^www\./, "");
    const publishedAt =
      extractMeta(html, "article:published_time") ||
      extractMeta(html, "og:article:published_time") ||
      "";

    const { content, excerpt: bodyExcerpt } = extractBodyContent(html);

    const scraped: ScrapedData = {
      title: title || cleanText(parsedUrl.pathname.split("/").pop() || "Imported Article"),
      excerpt: metaDescription || bodyExcerpt || "",
      content: content || (metaDescription ? `<p>${metaDescription}</p>` : ""),
      image: image || undefined,
      author: author || "YERAS Media Network",
      sourceName: siteName,
      sourceUrl: targetUrl,
      publishedAt: publishedAt || undefined,
    };

    res.status(200).json({
      success: true,
      data: scraped,
    });
  } catch (err: any) {
    console.error("Scraping error:", err);
    res.status(500).json({
      error: err?.message || "Failed to fetch and scrape the requested URL.",
    });
  }
}
