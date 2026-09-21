import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Clock } from "lucide-react";
import {
  articleSlug,
  timeAgo,
  getLocalizedArticleContent,
  type Article,
} from "@/lib/firestore-service";
import { SECTION_TO_SLUG } from "@/lib/news-data";
import { useLanguage } from "@/contexts/language-context";
import { translateText } from "@/lib/translation-service";

interface ArticleCardProps {
  article: Article;
  variant?: "default" | "horizontal" | "compact";
  className?: string;
}

export function ArticleCard({ article, variant = "default", className = "" }: ArticleCardProps) {
  const { t, getCategoryLabel, language } = useLanguage();
  const catSlug = SECTION_TO_SLUG[article.section] ?? "news";
  const slug = articleSlug(article.title);
  const localizedSection = getCategoryLabel(catSlug) || article.section;

  // Resolve best localized title and excerpt
  const initial = getLocalizedArticleContent(article, language);
  const [title, setTitle] = useState(initial.title || article.title);
  const [excerpt, setExcerpt] = useState(initial.excerpt || article.excerpt);
  const [isTranslated, setIsTranslated] = useState(initial.isTranslated);

  useEffect(() => {
    const loc = getLocalizedArticleContent(article, language);
    if (loc.isTranslated) {
      setTitle(loc.title);
      setExcerpt(loc.excerpt);
      setIsTranslated(true);
      return;
    }

    if (loc.sourceLang === language) {
      setTitle(article.title);
      setExcerpt(article.excerpt);
      setIsTranslated(false);
      return;
    }

    // Auto-translate title & excerpt on language change
    let isCurrent = true;
    Promise.all([
      translateText(article.title, loc.sourceLang, language),
      article.excerpt
        ? translateText(article.excerpt, loc.sourceLang, language)
        : Promise.resolve(""),
    ])
      .then(([translatedTitle, translatedExcerpt]) => {
        if (isCurrent) {
          setTitle(translatedTitle);
          setExcerpt(translatedExcerpt);
          setIsTranslated(true);
        }
      })
      .catch((err) => {
        console.warn("Card translation failed:", err);
      });

    return () => {
      isCurrent = false;
    };
  }, [article, language]);

  if (variant === "compact") {
    return (
      <article
        className={`group flex items-start gap-3 py-3 border-b border-border/60 last:border-none ${className}`}
      >
        {article.image && (
          <Link
            to="/article/$slug"
            params={{ slug }}
            className="shrink-0 overflow-hidden rounded-lg"
          >
            <img
              src={article.image}
              alt={title}
              loading="lazy"
              className="h-16 w-20 object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </Link>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <Link
              to="/category/$slug"
              params={{ slug: catSlug }}
              className="text-[10px] font-bold uppercase tracking-wider text-primary hover:underline"
            >
              {localizedSection}
            </Link>
            {article.breaking && (
              <span className="inline-flex items-center gap-1 rounded bg-red-500/15 px-1.5 py-0.5 text-[9px] font-black uppercase text-red-600 dark:text-red-400 border border-red-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                {t("breaking")}
              </span>
            )}
            {isTranslated && (
              <span className="text-[9px] font-semibold text-gold bg-gold/10 px-1 rounded">AI</span>
            )}
          </div>
          <h4 className="mt-0.5 text-xs sm:text-sm font-display font-semibold leading-snug">
            <Link to="/article/$slug" params={{ slug }} className="headline-link text-foreground">
              {title}
            </Link>
          </h4>
          <span className="text-[10px] text-muted-foreground mt-1 block">
            {timeAgo(article.createdAt, language)}
          </span>
        </div>
      </article>
    );
  }

  if (variant === "horizontal") {
    return (
      <article
        className={`group flex gap-4 rounded-xl p-2 transition-all hover:bg-muted/40 ${className}`}
      >
        {article.image ? (
          <Link
            to="/article/$slug"
            params={{ slug }}
            className="shrink-0 overflow-hidden rounded-xl"
          >
            <img
              src={article.image}
              alt={title}
              loading="lazy"
              className="h-28 w-32 sm:h-32 sm:w-36 object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </Link>
        ) : null}
        <div className="min-w-0 flex-1 flex flex-col justify-center">
          <div className="flex items-center gap-2">
            <Link
              to="/category/$slug"
              params={{ slug: catSlug }}
              className="text-[11px] font-bold uppercase tracking-wider text-primary hover:underline"
            >
              {localizedSection}
            </Link>
            {article.breaking && (
              <span className="inline-flex items-center gap-1 rounded bg-red-500/15 px-1.5 py-0.5 text-[9px] font-black uppercase text-red-600 dark:text-red-400 border border-red-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                {t("breaking")}
              </span>
            )}
            {isTranslated && (
              <span className="text-[10px] font-bold text-gold bg-gold/10 px-1.5 py-0.2 rounded">
                Translated
              </span>
            )}
          </div>
          <h3 className="mt-1.5 text-base sm:text-lg font-display font-bold leading-snug">
            <Link to="/article/$slug" params={{ slug }} className="headline-link text-foreground">
              {title}
            </Link>
          </h3>
          {excerpt && (
            <p className="mt-1 line-clamp-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {excerpt}
            </p>
          )}
          <div className="mt-2.5 flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground/80">{article.author}</span>
            <span className="opacity-40">·</span>
            <span>{timeAgo(article.createdAt, language)}</span>
            {article.readTime ? (
              <>
                <span className="opacity-40">·</span>
                <span className="flex items-center gap-1 font-mono text-[11px]">
                  <Clock className="h-3 w-3" />
                  {article.readTime} {t("readTime")}
                </span>
              </>
            ) : null}
          </div>
        </div>
      </article>
    );
  }

  // Default Grid Card
  return (
    <article
      className={`group flex flex-col overflow-hidden rounded-2xl border border-border bg-card p-4 transition-all duration-300 hover:shadow-xl hover:border-primary/40 ${className}`}
    >
      {article.image ? (
        <Link to="/article/$slug" params={{ slug }} className="overflow-hidden rounded-xl">
          <img
            src={article.image}
            alt={title}
            loading="lazy"
            className="aspect-[16/10] w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        </Link>
      ) : (
        <div className="aspect-[16/10] rounded-xl bg-muted/40" />
      )}

      <div className="mt-4 flex-1 flex flex-col">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Link
              to="/category/$slug"
              params={{ slug: catSlug }}
              className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary hover:bg-primary/20 transition-colors"
            >
              {localizedSection}
            </Link>
            {article.breaking && (
              <span className="inline-flex items-center gap-1 rounded bg-red-500/15 px-1.5 py-0.5 text-[9px] font-black uppercase text-red-600 dark:text-red-400 border border-red-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                {t("breaking")}
              </span>
            )}
            {isTranslated && (
              <span className="text-[10px] font-semibold text-gold bg-gold/10 px-1.5 py-0.5 rounded-full">
                AI Translated
              </span>
            )}
          </div>
          {article.readTime ? (
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground font-mono">
              <Clock className="h-3 w-3" />
              {article.readTime} {t("readTime")}
            </span>
          ) : null}
        </div>

        <h3 className="mt-2.5 text-lg sm:text-xl font-display font-bold leading-snug">
          <Link to="/article/$slug" params={{ slug }} className="headline-link text-foreground">
            {title}
          </Link>
        </h3>

        {excerpt ? (
          <p className="mt-2 line-clamp-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {excerpt}
          </p>
        ) : null}

        <div className="mt-4 pt-3 border-t border-border/70 flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-semibold text-foreground/80">{article.author}</span>
          <span>{timeAgo(article.createdAt, language)}</span>
        </div>
      </div>
    </article>
  );
}
