import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ArticleCard } from "@/components/article-card";
import { SkeletonCard, SkeletonHero } from "@/components/skeleton-card";
import { AdBanner } from "@/components/ad-banner";
import { SEO } from "@/components/seo";
import { useLanguage } from "@/contexts/language-context";
import {
  getPublishedArticles,
  getFeaturedArticle,
  getBreakingNews,
  getMostRead,
  getOpinionArticles,
  getLocalizedArticleContent,
  articleSlug,
  timeAgo,
  type Article,
} from "@/lib/firestore-service";
import { translateText } from "@/lib/translation-service";
import { TrendingUp, Clock, Flame, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Home,
});

function SectionTitle({
  children,
  moreSlug,
  moreLabel,
}: {
  children: React.ReactNode;
  moreSlug?: string;
  moreLabel?: string;
}) {
  return (
    <div className="mb-6 flex items-center justify-between border-b-2 border-border pb-3">
      <h2 className="rule-heading font-display text-xl sm:text-2xl font-bold tracking-tight text-foreground">
        {children}
      </h2>
      {moreSlug && (
        <Link
          to="/category/$slug"
          params={{ slug: moreSlug }}
          className="group flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-primary hover:text-primary/80 transition-colors"
        >
          <span>{moreLabel || "ሁሉንም ይመልከቱ"}</span>
          <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}

function Home() {
  const { t, language, categories, getCategoryLabel } = useLanguage();
  const [featured, setFeatured] = useState<Article | null>(null);
  const [allPublished, setAllPublished] = useState<Article[]>([]);
  const [breakingNews, setBreakingNews] = useState<Article[]>([]);
  const [mostRead, setMostRead] = useState<Article[]>([]);
  const [opinion, setOpinion] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  // Hero auto-translated state
  const [heroTitle, setHeroTitle] = useState("");
  const [heroExcerpt, setHeroExcerpt] = useState("");

  useEffect(() => {
    Promise.all([
      getFeaturedArticle(),
      getPublishedArticles(30),
      getBreakingNews(),
      getMostRead(),
      getOpinionArticles(),
    ])
      .then(([f, all, brk, mr, op]) => {
        setFeatured(f);
        setAllPublished(all);
        setBreakingNews(brk);
        setMostRead(mr);
        setOpinion(op);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Update Hero title & excerpt when featured or language changes
  useEffect(() => {
    if (!featured) return;
    const loc = getLocalizedArticleContent(featured, language);
    if (loc.isTranslated || loc.sourceLang === language) {
      setHeroTitle(loc.title);
      setHeroExcerpt(loc.excerpt);
      return;
    }

    setHeroTitle(featured.title);
    setHeroExcerpt(featured.excerpt);

    let active = true;
    Promise.all([
      translateText(featured.title, loc.sourceLang, language),
      featured.excerpt
        ? translateText(featured.excerpt, loc.sourceLang, language)
        : Promise.resolve(""),
    ])
      .then(([t, e]) => {
        if (active) {
          setHeroTitle(t);
          setHeroExcerpt(e);
        }
      })
      .catch((err) => {
        console.warn("Hero translation error:", err);
      });

    return () => {
      active = false;
    };
  }, [featured, language]);

  const side = allPublished.filter((a) => a.id !== featured?.id).slice(0, 3);
  const grid = allPublished
    .filter((a) => a.id !== featured?.id && !side.find((s) => s.id === a.id))
    .slice(0, 6);
  const breakingTexts = breakingNews.map((a) => a.title);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20 selection:text-primary">
      {/* ── Dynamic SEO & Schema.org ────────────────────────── */}
      <SEO
        title="ሲሳይ መንግስቴ | Sisay Mengiste — ዜና፣ ፖለቲካ፣ ቢዝነስ"
        description="የዕለቱ ዋና ዜናዎች፣ ፖለቲካ፣ ቢዝነስ፣ ማኅበራዊና ስፖርት ዘገባዎች — ከሲሳይ መንግስቴ አማርኛ፣ ኦሮምኛና እንግሊዝኛ እትም።"
      />

      <SiteHeader />

      {/* ── Modern Breaking News Ticker ─────────────────────── */}
      {breakingTexts.length > 0 && (
        <div className="relative border-b border-border/80 bg-muted/40 backdrop-blur-sm">
          <div className="mx-auto flex max-w-7xl items-center px-4 py-2 text-xs">
            {/* Pulsing live badge */}
            <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-primary mr-4 shrink-0 bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              <span className="text-[11px] font-black">{t("breaking")}</span>
            </div>

            {/* Smooth Marquee */}
            <div className="relative flex-1 overflow-hidden">
              <div className="animate-ticker flex w-max gap-10 whitespace-nowrap text-xs font-medium text-foreground/80 hover:[animation-play-state:paused]">
                {[...breakingTexts, ...breakingTexts].map((title, i) => (
                  <Link
                    key={i}
                    to="/article/$slug"
                    params={{ slug: articleSlug(title) }}
                    className="headline-link flex items-center gap-2 hover:text-primary transition-colors"
                  >
                    <span className="text-primary text-[10px]">◆</span>
                    <span>{title}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Top Leaderboard Advertisement Banner ───────────── */}
      <AdBanner variant="leaderboard" />

      {/* ── Main News Container ────────────────────────────── */}
      <main className="mx-auto max-w-7xl px-4 py-6 flex-1 w-full">
        {loading ? (
          <>
            <SkeletonHero />
            <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          </>
        ) : allPublished.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-16 text-center">
            <p className="text-lg font-medium text-muted-foreground">{t("noArticles")}</p>
            <Link
              to="/admin"
              className="mt-4 inline-block rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90 transition-colors"
            >
              {t("adminDashboard")}
            </Link>
          </div>
        ) : (
          <>
            {/* ── Editorial Top Lead Section ────────────────── */}
            <section className="animate-rise grid gap-8 lg:grid-cols-[1.75fr_1fr]">
              {/* Featured Primary Hero Card */}
              {featured ? (
                <article className="group relative flex flex-col justify-end overflow-hidden rounded-2xl bg-ink shadow-xl min-h-[420px] sm:min-h-[500px]">
                  {featured.image ? (
                    <img
                      src={featured.image}
                      alt={heroTitle || featured.title}
                      width={1600}
                      height={1000}
                      loading="eager"
                      className="absolute inset-0 h-full w-full object-cover opacity-90 transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 to-neutral-950" />
                  )}

                  {/* Gradient mask for text contrast */}
                  <div
                    className="pointer-events-none absolute inset-0"
                    style={{ backgroundImage: "var(--gradient-ink)" }}
                  />

                  {/* Hero Content */}
                  <div className="relative z-10 p-6 sm:p-8">
                    <span className="inline-block rounded-full bg-primary px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary-foreground shadow-md">
                      {getCategoryLabel(featured.section) || featured.section}
                    </span>

                    <h1 className="mt-4 max-w-3xl font-display text-2xl sm:text-4xl font-black leading-tight text-ink-foreground">
                      <Link
                        to="/article/$slug"
                        params={{ slug: articleSlug(featured.title) }}
                        className="hover:text-gold transition-colors"
                      >
                        {heroTitle || featured.title}
                      </Link>
                    </h1>

                    {(heroExcerpt || featured.excerpt) && (
                      <p className="mt-3 max-w-2xl text-sm sm:text-base text-ink-foreground/80 line-clamp-2 leading-relaxed">
                        {heroExcerpt || featured.excerpt}
                      </p>
                    )}

                    <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-ink-foreground/70 border-t border-white/10 pt-3">
                      <span className="font-semibold text-ink-foreground">{featured.author}</span>
                      <span>·</span>
                      <span>{timeAgo(featured.createdAt, language)}</span>
                      {featured.readTime && (
                        <>
                          <span>·</span>
                          <span className="flex items-center gap-1 font-mono text-gold">
                            <Clock className="h-3 w-3" /> {featured.readTime} {t("readTime")}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </article>
              ) : null}

              {/* Top Side Stories & Opinion Column */}
              <div className="flex flex-col justify-between divide-y divide-border rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-sm">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-border">
                    <Flame className="h-4 w-4 text-primary" />
                    <h3 className="font-display text-sm font-bold uppercase tracking-wider text-foreground">
                      {t("latestNews")}
                    </h3>
                  </div>
                  {side.map((s) => (
                    <ArticleCard key={s.id} article={s} variant="compact" />
                  ))}
                </div>

                {/* Editor's Pick Column */}
                {opinion.length > 0 && (
                  <div className="pt-4 mt-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                      {t("editorsPick")}
                    </span>
                    <ul className="mt-2 space-y-2.5">
                      {opinion.slice(0, 2).map((o) => (
                        <li key={o.id} className="group">
                          <Link
                            to="/article/$slug"
                            params={{ slug: articleSlug(o.title) }}
                            className="headline-link font-display text-sm font-bold text-foreground leading-snug line-clamp-2 block"
                          >
                            {o.title}
                          </Link>
                          <span className="text-[11px] text-muted-foreground mt-0.5 block">
                            {o.author}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </section>

            {/* ── Latest News Grid & Sidebar ──────────────────── */}
            <div className="mt-14 grid gap-10 lg:grid-cols-[1.8fr_1fr]">
              {/* Main Grid */}
              <section>
                <SectionTitle moreSlug="news" moreLabel={t("viewAll")}>
                  {t("latestNews")}
                </SectionTitle>
                <div className="grid gap-6 sm:grid-cols-2">
                  {grid.map((s) => (
                    <ArticleCard key={s.id} article={s} />
                  ))}
                </div>
              </section>

              {/* Sidebar with Ads */}
              <aside className="space-y-8">
                {/* Most Read Leaderboard */}
                {mostRead.length > 0 && (
                  <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                    <div className="mb-5 flex items-center gap-2 border-b border-border pb-3">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      <h2 className="font-display text-lg font-bold text-foreground">
                        {t("mostRead")}
                      </h2>
                    </div>
                    <ol className="space-y-4">
                      {mostRead.map((a, i) => (
                        <li key={a.id} className="flex items-start gap-4 group">
                          <span className="font-display text-3xl font-black leading-none text-primary/30 group-hover:text-primary transition-colors">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <div className="min-w-0 flex-1">
                            <Link
                              to="/article/$slug"
                              params={{ slug: articleSlug(a.title) }}
                              className="headline-link text-sm font-display font-semibold leading-snug text-foreground block line-clamp-2"
                            >
                              {a.title}
                            </Link>
                            {(a.viewCount ?? 0) > 0 && (
                              <p className="mt-1 text-[11px] text-muted-foreground font-mono">
                                {a.viewCount?.toLocaleString()} {t("views")}
                              </p>
                            )}
                          </div>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {/* Sidebar Advertisement Unit */}
                <AdBanner variant="sidebar" />

                {/* Categories Widget */}
                <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                  <h3 className="font-display text-base font-bold text-foreground mb-4 border-b border-border pb-2">
                    {t("columns")}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {categories
                      .filter((c) => c.slug)
                      .map((cat) => (
                        <Link
                          key={cat.slug}
                          to="/category/$slug"
                          params={{ slug: cat.slug }}
                          className="rounded-xl border border-border bg-muted/30 px-3.5 py-1.5 text-xs font-semibold text-foreground/80 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all shadow-xs"
                        >
                          {cat.label}
                        </Link>
                      ))}
                  </div>
                </div>
              </aside>
            </div>

            {/* ── Mid-Page Billboard Sponsor Spotlight ──────── */}
            <AdBanner variant="billboard" />
          </>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
