import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ArticleCard } from "@/components/article-card";
import { SECTION_TO_SLUG } from "@/lib/news-data";
import { useLanguage } from "@/contexts/language-context";
import { type Language } from "@/lib/i18n";
import {
  findArticleBySlug,
  findRelatedArticles,
  incrementViewCount,
  getLocalizedArticleContent,
  timeAgo,
  type Article,
} from "@/lib/firestore-service";
import { translateArticleBundle } from "@/lib/translation-service";
import {
  Clock,
  Share2,
  Twitter,
  Send,
  Link as LinkIcon,
  Eye,
  ChevronRight,
  Languages,
  RotateCcw,
  Sparkles,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/article/$slug")({
  head: ({ params }) => {
    return {
      meta: [
        { title: `${decodeURIComponent(params.slug)} — ሲሳይ መንግስቴ` },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: ArticlePage,
});

/* ── Reading progress bar ─────────────────────────────────────── */
function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const update = () => {
      const el = document.documentElement;
      const scrollTop = el.scrollTop || document.body.scrollTop;
      const scrollHeight = el.scrollHeight - el.clientHeight;
      const pct = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
      setProgress(Math.min(100, Math.max(0, pct)));
    };
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <div
      className="read-progress"
      style={{ width: `${progress}%` }}
      role="progressbar"
      aria-valuenow={Math.round(progress)}
      aria-valuemin={0}
      aria-valuemax={100}
    />
  );
}

/* ── Share buttons with language support ──────────────────────── */
function ShareButtons({ title }: { title: string }) {
  const { t } = useLanguage();
  const url = typeof window !== "undefined" ? window.location.href : "";
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success(t("linkCopied"), { description: url });
    } catch {
      toast.error("Failed to copy link");
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">
        <Share2 className="h-3.5 w-3.5 text-primary" /> {t("share")}:
      </span>
      <a
        href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex h-8 w-8 items-center justify-center rounded-full bg-muted/60 transition-colors hover:bg-foreground hover:text-background"
        aria-label="Share on X"
      >
        <Twitter className="h-3.5 w-3.5" />
      </a>
      <a
        href={`https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex h-8 w-8 items-center justify-center rounded-full bg-muted/60 transition-colors hover:bg-blue-500 hover:text-white"
        aria-label="Share on Telegram"
      >
        <Send className="h-3.5 w-3.5" />
      </a>
      <button
        type="button"
        onClick={copyLink}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-muted/60 transition-colors hover:bg-primary hover:text-primary-foreground"
        aria-label="Copy link"
      >
        <LinkIcon className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

/* ── Article skeleton ────────────────────────────────────────── */
function ArticleSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="h-3 w-24 rounded bg-muted" />
        <div className="mt-4 space-y-2">
          <div className="h-3 w-16 rounded bg-muted" />
          <div className="h-8 w-full rounded bg-muted" />
          <div className="h-8 w-4/5 rounded bg-muted" />
        </div>
        <div className="mt-3 h-3 w-40 rounded bg-muted" />
        <div className="mt-6 aspect-[16/9] w-full rounded-xl bg-muted" />
        <div className="mt-6 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-4 rounded bg-muted"
              style={{ width: i % 3 === 2 ? "75%" : "100%" }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

const LANG_NAMES: Record<Language, string> = {
  am: "አማርኛ (Amharic)",
  om: "Afaan Oromoo",
  en: "English",
};

function ArticlePage() {
  const { slug } = Route.useParams();
  const { t, language, getCategoryLabel } = useLanguage();
  const [story, setStory] = useState<Article | null>(null);
  const [related, setRelated] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFoundState, setNotFoundState] = useState(false);
  const viewedRef = useRef(false);

  // Translation states
  const [displayedTitle, setDisplayedTitle] = useState("");
  const [displayedExcerpt, setDisplayedExcerpt] = useState("");
  const [displayedContent, setDisplayedContent] = useState("");
  const [currentViewLang, setCurrentViewLang] = useState<Language>("am");
  const [isTranslating, setIsTranslating] = useState(false);
  const [translateStatus, setTranslateStatus] = useState("");
  const [isTranslatedView, setIsTranslatedView] = useState(false);

  // Fetch article
  useEffect(() => {
    setLoading(true);
    setNotFoundState(false);
    viewedRef.current = false;

    findArticleBySlug(slug)
      .then((article) => {
        if (!article) {
          setNotFoundState(true);
          return Promise.resolve([]);
        }
        setStory(article);

        if (!viewedRef.current) {
          viewedRef.current = true;
          void incrementViewCount(article.id);
        }
        return findRelatedArticles(article);
      })
      .then((rels) => {
        if (Array.isArray(rels)) setRelated(rels);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [slug]);

  // Handle active language change or auto-translation
  useEffect(() => {
    if (!story) return;

    const loc = getLocalizedArticleContent(story, language);

    // 1. If pre-stored translation in Firestore exists
    if (loc.isTranslated) {
      setDisplayedTitle(loc.title);
      setDisplayedExcerpt(loc.excerpt);
      setDisplayedContent(loc.content);
      setCurrentViewLang(language);
      setIsTranslatedView(true);
      return;
    }

    // 2. If article's original language matches current language
    if (loc.sourceLang === language) {
      setDisplayedTitle(story.title);
      setDisplayedExcerpt(story.excerpt);
      setDisplayedContent(story.content);
      setCurrentViewLang(loc.sourceLang);
      setIsTranslatedView(false);
      return;
    }

    // 3. Needs on-demand automatic translation!
    let active = true;
    setIsTranslating(true);
    setTranslateStatus(`Auto-translating to ${LANG_NAMES[language]}...`);

    // Show initial content while translating
    setDisplayedTitle(story.title);
    setDisplayedExcerpt(story.excerpt);
    setDisplayedContent(story.content);

    translateArticleBundle(
      {
        title: story.title,
        excerpt: story.excerpt,
        content: story.content,
      },
      loc.sourceLang,
      language,
      (step) => {
        if (active) setTranslateStatus(step);
      },
    )
      .then((result) => {
        if (active) {
          setDisplayedTitle(result.title);
          setDisplayedExcerpt(result.excerpt);
          setDisplayedContent(result.content);
          setCurrentViewLang(language);
          setIsTranslatedView(true);
        }
      })
      .catch((err) => {
        console.warn("Auto-translation error:", err);
      })
      .finally(() => {
        if (active) {
          setIsTranslating(false);
          setTranslateStatus("");
        }
      });

    return () => {
      active = false;
    };
  }, [story, language]);

  const handleTranslateTo = async (targetLang: Language) => {
    if (!story) return;
    if (targetLang === (story.language || "am")) {
      handleShowOriginal();
      return;
    }

    // Check pre-saved translation
    if (story.translations?.[targetLang]) {
      const tr = story.translations[targetLang]!;
      setDisplayedTitle(tr.title);
      setDisplayedExcerpt(tr.excerpt);
      setDisplayedContent(tr.content);
      setCurrentViewLang(targetLang);
      setIsTranslatedView(true);
      toast.success(`Switched to ${LANG_NAMES[targetLang]}`);
      return;
    }

    setIsTranslating(true);
    setTranslateStatus("Translating...");
    try {
      const result = await translateArticleBundle(
        {
          title: story.title,
          excerpt: story.excerpt,
          content: story.content,
        },
        story.language || "auto",
        targetLang,
        setTranslateStatus,
      );

      setDisplayedTitle(result.title);
      setDisplayedExcerpt(result.excerpt);
      setDisplayedContent(result.content);
      setCurrentViewLang(targetLang);
      setIsTranslatedView(true);
      toast.success(`Translated to ${LANG_NAMES[targetLang]}`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to translate article.");
    } finally {
      setIsTranslating(false);
      setTranslateStatus("");
    }
  };

  const handleShowOriginal = () => {
    if (!story) return;
    setDisplayedTitle(story.title);
    setDisplayedExcerpt(story.excerpt);
    setDisplayedContent(story.content);
    setCurrentViewLang(story.language || "am");
    setIsTranslatedView(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <SiteHeader />
        <ArticleSkeleton />
        <SiteFooter />
      </div>
    );
  }

  if (notFoundState || !story) throw notFound();

  const originalLang = story.language || "am";
  const catSlug = SECTION_TO_SLUG[story.section] ?? "news";
  const localizedSection = getCategoryLabel(catSlug) || story.section;
  const isHtml = displayedContent?.startsWith("<");

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <ReadingProgress />
      <SiteHeader />

      <main className="mx-auto max-w-3xl px-4 py-8 sm:py-12 flex-1 w-full">
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium"
        >
          <Link to="/" className="hover:text-primary transition-colors">
            {t("home")}
          </Link>
          <ChevronRight className="h-3 w-3 opacity-40" />
          <Link
            to="/category/$slug"
            params={{ slug: catSlug }}
            className="hover:text-primary transition-colors"
          >
            {localizedSection}
          </Link>
        </nav>

        {/* ── Smart Translation Banner ───────────────────────── */}
        <div className="mt-4 rounded-2xl border border-border/80 bg-card p-3.5 sm:p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-foreground/80">
            <Languages className="h-4 w-4 text-primary shrink-0" />
            <span>
              {isTranslatedView ? (
                <>
                  <span className="font-semibold text-foreground">
                    Translated to {LANG_NAMES[currentViewLang]}
                  </span>
                  <span className="text-muted-foreground ml-1">
                    (Original: {LANG_NAMES[originalLang]})
                  </span>
                </>
              ) : (
                <>
                  <span>Original Language:</span>{" "}
                  <span className="font-bold text-foreground">{LANG_NAMES[originalLang]}</span>
                </>
              )}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {isTranslatedView ? (
              <button
                type="button"
                onClick={handleShowOriginal}
                className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 font-semibold text-foreground hover:bg-muted transition-colors"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Show Original</span>
              </button>
            ) : null}

            {/* Quick translate buttons for other languages */}
            {(["am", "om", "en"] as Language[])
              .filter((l) => l !== currentViewLang)
              .map((targetCode) => (
                <button
                  key={targetCode}
                  type="button"
                  disabled={isTranslating}
                  onClick={() => handleTranslateTo(targetCode)}
                  className="flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1 font-bold text-primary hover:bg-primary/20 transition-colors disabled:opacity-50"
                >
                  {isTranslating ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Sparkles className="h-3 w-3" />
                  )}
                  <span>
                    Translate to{" "}
                    {targetCode === "am" ? "አማርኛ" : targetCode === "om" ? "Oromoo" : "English"}
                  </span>
                </button>
              ))}
          </div>
        </div>

        {isTranslating && (
          <div className="mt-3 p-3 rounded-xl bg-primary/5 border border-primary/20 text-center text-xs text-primary font-medium flex items-center justify-center gap-2 animate-pulse">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>{translateStatus || "Auto-translating article..."}</span>
          </div>
        )}

        <article className="mt-6">
          {/* Section badge */}
          <Link
            to="/category/$slug"
            params={{ slug: catSlug }}
            className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary hover:bg-primary/20 transition-colors"
          >
            {localizedSection}
          </Link>

          {/* Title */}
          <h1 className="mt-4 font-display text-2xl sm:text-4xl lg:text-5xl font-extrabold leading-tight text-foreground">
            {displayedTitle}
          </h1>

          {/* Meta row */}
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-y border-border py-3 text-xs text-muted-foreground">
            <span className="font-bold text-foreground">{story.author}</span>
            <span className="opacity-40">·</span>
            <span>{timeAgo(story.createdAt, language)}</span>
            {story.readTime && (
              <>
                <span className="opacity-40">·</span>
                <span className="flex items-center gap-1 font-mono">
                  <Clock className="h-3.5 w-3.5 text-primary" /> {story.readTime} {t("readTime")}
                </span>
              </>
            )}
            {(story.viewCount ?? 0) > 0 && (
              <>
                <span className="opacity-40">·</span>
                <span className="flex items-center gap-1 font-mono">
                  <Eye className="h-3.5 w-3.5 text-primary" /> {story.viewCount?.toLocaleString()}{" "}
                  {t("views")}
                </span>
              </>
            )}
          </div>

          {/* Featured Image */}
          {story.image ? (
            <figure className="mt-6 overflow-hidden rounded-2xl border border-border shadow-lg">
              <img
                src={story.image}
                alt={displayedTitle}
                width={1600}
                height={1000}
                className="w-full object-cover max-h-[500px]"
              />
            </figure>
          ) : null}

          {/* Excerpt Lead */}
          {displayedExcerpt ? (
            <p className="mt-8 rounded-xl border-l-4 border-primary bg-muted/30 p-4 sm:p-5 text-base sm:text-lg font-medium leading-relaxed text-foreground/90">
              {displayedExcerpt}
            </p>
          ) : null}

          {/* Article Body */}
          <div className="mt-8">
            {displayedContent ? (
              isHtml ? (
                <div
                  className="prose-amharic"
                  dangerouslySetInnerHTML={{ __html: displayedContent }}
                />
              ) : (
                <div className="prose-amharic whitespace-pre-wrap">{displayedContent}</div>
              )
            ) : null}
          </div>

          {/* Share & Tags bar */}
          <div className="mt-12 flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between shadow-xs">
            <ShareButtons title={displayedTitle} />
            {story.tags && story.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {story.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground font-medium"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </article>

        {/* Related Articles */}
        {related.length > 0 ? (
          <section className="mt-16 border-t-2 border-border pt-8">
            <h2 className="rule-heading font-display text-xl sm:text-2xl font-bold mb-6 text-foreground">
              {t("relatedNews")}
            </h2>
            <div className="grid gap-6 sm:grid-cols-3">
              {related.map((r) => (
                <ArticleCard key={r.id} article={r} />
              ))}
            </div>
          </section>
        ) : null}
      </main>

      <SiteFooter />
    </div>
  );
}
