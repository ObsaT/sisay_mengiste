import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { NAV, SECTION_TO_SLUG } from "@/lib/news-data";
import {
  getPublishedArticles,
  getFeaturedArticle,
  getBreakingNews,
  getMostRead,
  getOpinionArticles,
  articleSlug,
  timeAgo,
  type Article,
} from "@/lib/firestore-service";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ሲሳይ መንግስቴ | Sisay Mengiste — ዜና፣ ፖለቲካ፣ ቢዝነስ" },
      {
        name: "description",
        content:
          "የዕለቱ ዋና ዜናዎች፣ ፖለቲካ፣ ቢዝነስ፣ ማኅበራዊና ስፖርት ዘገባዎች — ከሲሳይ መንግስቴ አማርኛ እትም።",
      },
      { property: "og:title", content: "ሲሳይ መንግስቴ | Sisay Mengiste — ዜና፣ ፖለቲካ፣ ቢዝነስ" },
      {
        property: "og:description",
        content: "የዕለቱ ዋና ዜናዎች፣ ፖለቲካ፣ ቢዝነስ፣ ማኅበራዊና ስፖርት ዘገባዎች — ከሲሳይ መንግስቴ አማርኛ እትም።",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://ethiopian-reporter-creations.lovable.app/" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://ethiopian-reporter-creations.lovable.app/" }],
  }),
  component: Home,
});

function Meta({ article }: { article: Article }) {
  return (
    <p className="mt-2 text-xs text-muted-foreground">
      <span className="font-semibold text-foreground/80">{article.author}</span>
      <span className="mx-2 opacity-40">·</span>
      {timeAgo(article.createdAt)}
    </p>
  );
}

function ArticleLink({
  article,
  className,
}: {
  article: Article;
  className?: string;
}) {
  return (
    <Link
      to="/article/$slug"
      params={{ slug: articleSlug(article.title) }}
      className={className ?? "headline-link"}
    >
      {article.title}
    </Link>
  );
}

function SectionTitle({
  children,
  moreSlug,
}: {
  children: string;
  moreSlug?: string;
}) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4 border-b border-border pb-3">
      <h2 className="rule-heading text-2xl tracking-tight">{children}</h2>
      {moreSlug ? (
        <Link
          to="/category/$slug"
          params={{ slug: moreSlug }}
          className="kicker text-primary hover:underline"
        >
          ሁሉንም ይመልከቱ
        </Link>
      ) : null}
    </div>
  );
}

function Home() {
  const [featured, setFeatured] = useState<Article | null>(null);
  const [allPublished, setAllPublished] = useState<Article[]>([]);
  const [breakingNews, setBreakingNews] = useState<Article[]>([]);
  const [mostRead, setMostRead] = useState<Article[]>([]);
  const [opinion, setOpinion] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getFeaturedArticle(),
      getPublishedArticles(),
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

  const side = allPublished
    .filter((a) => a.id !== featured?.id)
    .slice(0, 2);
  const grid = allPublished
    .filter((a) => a.id !== featured?.id && !side.find((s) => s.id === a.id))
    .slice(0, 6);
  const breakingTexts = breakingNews.map((a) => a.title);
  const catPills = NAV.filter((n) => n.slug);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      {/* Breaking ticker */}
      {breakingTexts.length > 0 && (
        <div className="flex items-center gap-0 overflow-hidden border-b border-border bg-paper-deep">
          <span className="kicker shrink-0 bg-primary px-4 py-2.5 text-primary-foreground">
            ወቅታዊ
          </span>
          <div className="relative flex-1 overflow-hidden">
            <div className="animate-ticker flex w-max gap-10 whitespace-nowrap py-2.5 text-sm">
              {[...breakingTexts, ...breakingTexts].map((b, i) => (
                <Link
                  key={i}
                  to="/category/$slug"
                  params={{ slug: "news" }}
                  className="headline-link"
                >
                  <span className="text-primary">◆</span> {b}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      <main className="mx-auto max-w-7xl px-4 py-10">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : allPublished.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-lg text-muted-foreground">
              ምንም ዘገባ አልተገኘም። ከAdmin Dashboard ዘገባዎችን ያ sediment.
            </p>
            <Link
              to="/admin"
              className="mt-4 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Go to Admin
            </Link>
          </div>
        ) : (
          <>
            {/* Lead */}
            <section className="animate-rise grid gap-8 lg:grid-cols-[1.7fr_1fr]">
              {featured ? (
                <article className="group relative overflow-hidden rounded-md bg-ink">
                  {featured.image ? (
                    <img
                      src={featured.image}
                      alt={featured.title}
                      width={1600}
                      height={1000}
                      className="h-full max-h-[540px] w-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="h-full min-h-[300px] w-full bg-ink/80" />
                  )}
                  <div
                    className="pointer-events-none absolute inset-0"
                    style={{ backgroundImage: "var(--gradient-ink)" }}
                  />
                  <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
                    <span className="kicker bg-primary px-2 py-1 text-primary-foreground">
                      {featured.section}
                    </span>
                    <h1 className="mt-4 max-w-3xl text-2xl leading-snug text-ink-foreground sm:text-4xl">
                      <ArticleLink
                        article={featured}
                        className="hover:underline"
                      />
                    </h1>
                    {featured.excerpt && (
                      <p className="mt-3 max-w-2xl text-sm text-ink-foreground/75 sm:text-base">
                        {featured.excerpt}
                      </p>
                    )}
                    <p className="mt-4 text-xs text-ink-foreground/60">
                      {featured.author} · {timeAgo(featured.createdAt)}
                    </p>
                  </div>
                </article>
              ) : (
                <div className="flex min-h-[300px] items-center justify-center rounded-md bg-muted/30 text-muted-foreground">
                  መነሻ ዘገባ ያለ ነው
                </div>
              )}

              <div className="flex flex-col divide-y divide-border">
                {side.map((s) => (
                  <article key={s.id} className="group flex gap-4 py-5 first:pt-0">
                    <div className="min-w-0 flex-1">
                      <Link
                        to="/category/$slug"
                        params={{
                          slug: SECTION_TO_SLUG[s.section] ?? "news",
                        }}
                        className="kicker text-primary hover:underline"
                      >
                        {s.section}
                      </Link>
                      <h3 className="mt-2 text-lg leading-snug">
                        <ArticleLink article={s} />
                      </h3>
                      <Meta article={s} />
                    </div>
                    {s.image ? (
                      <img
                        src={s.image}
                        alt={s.title}
                        loading="lazy"
                        width={1200}
                        height={800}
                        className="h-24 w-28 shrink-0 rounded-sm object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : null}
                  </article>
                ))}
                {opinion.length > 0 && (
                  <div className="border-t border-border pt-5">
                    <span className="kicker text-muted-foreground">
                      የአርታዒ ምርጫ
                    </span>
                    <ul className="mt-3 space-y-3">
                      {opinion.map((o) => (
                        <li key={o.id}>
                          <Link
                            to="/article/$slug"
                            params={{ slug: articleSlug(o.title) }}
                            className="headline-link font-display text-base"
                          >
                            {o.title}
                          </Link>
                          <p className="text-xs text-muted-foreground">
                            {o.author}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </section>

            {/* Latest + rail */}
            <div className="mt-14 grid gap-10 lg:grid-cols-[1.7fr_1fr]">
              <section>
                <SectionTitle moreSlug="news">
                  የቅርብ ጊዜ ዘገባዎች
                </SectionTitle>
                <div className="grid gap-8 sm:grid-cols-2">
                  {grid.map((s) => (
                    <article key={s.id} className="group">
                      {s.image ? (
                        <div className="overflow-hidden rounded-sm">
                          <img
                            src={s.image}
                            alt={s.title}
                            loading="lazy"
                            width={1200}
                            height={800}
                            className="aspect-[3/2] w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]"
                          />
                        </div>
                      ) : null}
                      <Link
                        to="/category/$slug"
                        params={{
                          slug: SECTION_TO_SLUG[s.section] ?? "news",
                        }}
                        className="kicker mt-4 block text-primary hover:underline"
                      >
                        {s.section}
                      </Link>
                      <h3 className="mt-2 text-lg leading-snug">
                        <ArticleLink article={s} />
                      </h3>
                      {s.excerpt && (
                        <p className="mt-2 text-sm text-muted-foreground">
                          {s.excerpt}
                        </p>
                      )}
                      <Meta article={s} />
                    </article>
                  ))}
                </div>
              </section>

              <aside className="space-y-10">
                {mostRead.length > 0 && (
                  <div className="rounded-md border border-border bg-card p-6 shadow-[var(--shadow-card)]">
                    <SectionTitle>በብዛት የተነበቡ</SectionTitle>
                    <ol className="space-y-4">
                      {mostRead.map((a, i) => (
                        <li key={a.id} className="flex gap-4">
                          <span className="font-display text-2xl leading-none text-primary/35">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <Link
                            to="/article/$slug"
                            params={{ slug: articleSlug(a.title) }}
                            className="headline-link text-sm leading-snug"
                          >
                            {a.title}
                          </Link>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                <div className="rounded-md bg-ink p-6 text-ink-foreground">
                  <span className="kicker text-gold">ዕለታዊ ጋዜጣ</span>
                  <h3 className="mt-3 text-xl text-ink-foreground">
                    የዕለቱን ዋና ዜናዎች በኢሜይል ይቀበሉ
                  </h3>
                  <p className="mt-2 text-sm text-ink-foreground/70">
                    በየቀኑ ጠዋት አጭር ማጠቃለያ — ያለ ክፍያ።
                  </p>
                  <form
                    className="mt-5 flex gap-2"
                    onSubmit={(e) => e.preventDefault()}
                  >
                    <label htmlFor="nl" className="sr-only">
                      ኢሜይል
                    </label>
                    <input
                      id="nl"
                      type="email"
                      required
                      placeholder="ኢሜይል አድራሻዎ"
                      className="min-w-0 flex-1 rounded-sm border border-ink-foreground/20 bg-ink-foreground/10 px-3 py-2 text-sm text-ink-foreground placeholder:text-ink-foreground/45 focus:border-gold focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="rounded-sm bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                    >
                      ይመዝገቡ
                    </button>
                  </form>
                </div>

                <div>
                  <SectionTitle>ዓምዶች</SectionTitle>
                  <div className="flex flex-wrap gap-2">
                    {catPills.map((t) => (
                      <Link
                        key={t.slug}
                        to="/category/$slug"
                        params={{ slug: t.slug }}
                        className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold transition-colors hover:border-primary hover:text-primary"
                      >
                        {t.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </aside>
            </div>
          </>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
