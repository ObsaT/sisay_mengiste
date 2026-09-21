import { useEffect } from "react";
import { useLanguage } from "@/contexts/language-context";
import { useSocialLinks } from "@/contexts/social-context";

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

const DEFAULT_TITLE = "የራስ | YERAS Media Network — ዜና፣ ፖለቲካ፣ ቢዝነስ";
const DEFAULT_DESCRIPTION =
  "የዕለቱ ዋና ዜናዎች፣ ፖለቲካ፣ ቢዝነስ፣ ማኅበራዊና ስፖርት ዘገባዎች — ከየራስ ሚዲያ ኔትወርክ (YERAS Media Network) አማርኛ፣ ኦሮምኛና እንግሊዝኛ እትም። የላቀ ሃሳብ፤ የላቀ ተግባር!";
const DEFAULT_IMAGE = "https://obsat.github.io/sisay_mengiste/logo.jpg";
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
  const { activeLinks } = useSocialLinks();

  useEffect(() => {
    // 1. Page Title
    const formattedTitle = title.includes("የራስ") || title.includes("YERAS")
      ? title
      : `${title} | የራስ — YERAS Media Network`;
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
      "Ethiopia news, ዜና, ፖለቲካ, ቢዝነስ, Oduu, Siyaasa, የራስ, YERAS, YERAS Media Network, Addis Ababa, Ethiopia breaking news",
    );
    setMetaTag('meta[name="author"]', "content", article?.authorName || "የራስ ሚዲያ ኔትወርክ | YERAS Media Network");

    // 3. OpenGraph Tags
    setMetaTag('meta[property="og:title"]', "content", formattedTitle);
    setMetaTag('meta[property="og:description"]', "content", description);
    setMetaTag('meta[property="og:image"]', "content", image);
    setMetaTag('meta[property="og:type"]', "content", type);
    setMetaTag('meta[property="og:site_name"]', "content", "የራስ | YERAS Media Network");
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
            name: article.authorName || "የራስ ሚዲያ",
          },
        ],
        publisher: {
          "@type": "NewsMediaOrganization",
          name: "የራስ ሚዲያ ኔትወርክ | YERAS Media Network",
          url: SITE_URL,
          logo: {
            "@type": "ImageObject",
            url: `${SITE_URL}/logo.jpg`,
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
        name: "የራስ | YERAS Media Network",
        alternateName: "YERAS Media Network",
        url: SITE_URL,
        logo: `${SITE_URL}/logo.jpg`,
        description: description,
        sameAs:
          activeLinks && activeLinks.length > 0
            ? activeLinks.map((l) => l.href)
            : [
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
  }, [title, description, image, article, type, canonicalUrl, language, activeLinks]);

  return null;
}
