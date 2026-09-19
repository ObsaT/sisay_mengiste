import { useEffect } from "react";
import { useLanguage } from "@/contexts/language-context";

interface SEOProps {
  title: string;
  description?: string | undefined;
  image?: string | undefined;
  article?: {
    headline: string;
    description: string;
    image?: string | undefined;
    datePublished?: string | undefined;
    dateModified?: string | undefined;
    authorName?: string | undefined;
    section?: string | undefined;
    url?: string | undefined;
  } | undefined;
  type?: "website" | "article" | undefined;
  canonicalUrl?: string | undefined;
}

const DEFAULT_TITLE = "ሲሳይ መንግስቴ | Sisay Mengiste — ዜና፣ ፖለቲካ፣ ቢዝነስ";
const DEFAULT_DESCRIPTION =
  "የዕለቱ ዋና ዜናዎች፣ ፖለቲካ፣ ቢዝነስ፣ ማኅበራዊና ስፖርት ዘገባዎች — ከሲሳይ መንግስቴ አማርኛ፣ ኦሮምኛና እንግሊዝኛ እትም። Independent news from Ethiopia.";
const DEFAULT_IMAGE = "https://obsat.github.io/sisay_mengiste/og-image.jpg";
const SITE_URL = "https://obsat.github.io/sisay_mengiste";

export function SEO({
  title,
  description = DEFAULT_DESCRIPTION,
  image = DEFAULT_IMAGE,
  article,
  type = "website",
  canonicalUrl,
}: SEOProps) {
  const { language } = useLanguage();

  useEffect(() => {
    // 1. Page Title
    const formattedTitle = title.includes("ሲሳይ መንግስቴ") || title.includes("Sisay Mengiste")
      ? title
      : `${title} | ሲሳይ መንግስቴ — Sisay Mengiste`;
    document.title = formattedTitle;

    // Helper to update or create a meta tag
    const setMetaTag = (selector: string, attr: string, value: string) => {
      let element = document.querySelector(selector) as HTMLMetaElement | null;
      if (!element) {
        element = document.createElement("meta");
        const parts = selector.replace(/[\[\]'"]/g, "").split("=");
        const attrName = parts[0];
        const attrVal = parts[1] || "";
        if (attrName) {
          element.setAttribute(attrName, attrVal);
        }
        document.head.appendChild(element);
      }
      element.setAttribute(attr, value);
    };

    // 2. Standard Meta Tags
    setMetaTag('meta[name="description"]', "content", description);
    setMetaTag(
      'meta[name="keywords"]',
      "content",
      "Ethiopia news, ዜና, ፖለቲካ, ቢዝነስ, Oduu, Siyaasa, Ethiopian Reporter, Addis Ababa, Sisay Mengiste",
    );
    setMetaTag('meta[name="author"]', "content", article?.authorName || "Sisay Mengiste Media");

    // 3. OpenGraph Tags
    setMetaTag('meta[property="og:title"]', "content", formattedTitle);
    setMetaTag('meta[property="og:description"]', "content", description);
    setMetaTag('meta[property="og:image"]', "content", image);
    setMetaTag('meta[property="og:type"]', "content", type);
    setMetaTag('meta[property="og:site_name"]', "content", "ሲሳይ መንግስቴ | Sisay Mengiste");
    setMetaTag(
      'meta[property="og:locale"]',
      "content",
      language === "am" ? "am_ET" : language === "om" ? "om_ET" : "en_US",
    );

    const currentUrl = canonicalUrl || (typeof window !== "undefined" ? window.location.href : SITE_URL);
    setMetaTag('meta[property="og:url"]', "content", currentUrl);

    // 4. Twitter Cards
    setMetaTag('meta[name="twitter:card"]', "content", "summary_large_image");
    setMetaTag('meta[name="twitter:site"]', "content", "@ethioreporter");
    setMetaTag('meta[name="twitter:title"]', "content", formattedTitle);
    setMetaTag('meta[name="twitter:description"]', "content", description);
    setMetaTag('meta[name="twitter:image"]', "content", image);

    // 5. Canonical Link
    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonicalLink) {
      canonicalLink = document.createElement("link");
      canonicalLink.setAttribute("rel", "canonical");
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute("href", currentUrl);

    // 6. JSON-LD Structured Data
    const existingJsonLd = document.getElementById("structured-data-jsonld");
    if (existingJsonLd) {
      existingJsonLd.remove();
    }

    const script = document.createElement("script");
    script.id = "structured-data-jsonld";
    script.type = "application/ld+json";

    if (article) {
      // NewsArticle Schema
      const newsArticleSchema = {
        "@context": "https://schema.org",
        "@type": "NewsArticle",
        headline: article.headline,
        description: article.description,
        image: [article.image || image],
        datePublished: article.datePublished || new Date().toISOString(),
        dateModified: article.dateModified || article.datePublished || new Date().toISOString(),
        author: [
          {
            "@type": "Person",
            name: article.authorName || "Sisay Mengiste",
          },
        ],
        publisher: {
          "@type": "NewsMediaOrganization",
          name: "ሲሳይ መንግስቴ | Sisay Mengiste Media",
          url: SITE_URL,
          logo: {
            "@type": "ImageObject",
            url: `${SITE_URL}/favicon.ico`,
          },
        },
        mainEntityOfPage: {
          "@type": "WebPage",
          "@id": currentUrl,
        },
        articleSection: article.section || "General",
        inLanguage: language,
      };
      script.text = JSON.stringify(newsArticleSchema);
    } else {
      // Organization / WebSite Schema
      const orgSchema = {
        "@context": "https://schema.org",
        "@type": "NewsMediaOrganization",
        name: "ሲሳይ መንግስቴ | Sisay Mengiste",
        alternateName: "Sisay Mengiste News",
        url: SITE_URL,
        logo: `${SITE_URL}/favicon.ico`,
        description: description,
        sameAs: [
          "https://www.facebook.com/EThReporter",
          "https://t.me/EthiopianReporterAmharic",
          "https://twitter.com/ethioreporter",
          "https://www.youtube.com/@ethiopiareporter",
        ],
      };
      script.text = JSON.stringify(orgSchema);
    }

    document.head.appendChild(script);

    return () => {
      const el = document.getElementById("structured-data-jsonld");
      if (el) el.remove();
    };
  }, [title, description, image, article, type, canonicalUrl, language]);

  return null;
}
