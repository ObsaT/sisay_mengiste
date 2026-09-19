import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ArticleCard } from "@/components/article-card";
import { SkeletonCard } from "@/components/skeleton-card";
import { useLanguage } from "@/contexts/language-context";
import { getPublishedBySection, getPublishedArticles, type Article } from "@/lib/firestore-service";
import { ChevronRight } from "lucide-react";

export const Route = createFileRoute("/category/$slug")({
  head: ({ params }) => {
    return {
      meta: [
        { title: `${decodeURIComponent(params.slug)} — ሲሳይ መንግስቴ` },
        { name: "robots", content: "index, follow" },
      ],
    };
  },
  component: CategoryPage,
});

function CategoryPage() {
  const { slug } = Route.useParams();
  const { t, getCategoryLabel } = useLanguage();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  const localizedTitle = getCategoryLabel(slug) || slug;

  useEffect(() => {
    setLoading(true);
    setArticles([]);

    const fetchPromise =
      slug && slug !== "all" ? getPublishedBySection(slug) : getPublishedArticles(40);

    fetchPromise
      .then(setArticles)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [slug]);

  const featured = articles[0];
  const rest = articles.slice(1);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SiteHeader />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:py-10 flex-1 w-full">
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="mb-4 flex items-center gap-1.5 text-xs text-muted-foreground font-medium"
        >
          <Link to="/" className="hover:text-primary transition-colors">
            {t("home")}
          </Link>
          <ChevronRight className="h-3 w-3 opacity-40" />
          <span className="text-foreground font-bold">{localizedTitle}</span>
        </nav>

        {/* Page header banner */}
        <div className="mb-8 border-b-2 border-border pb-5 flex flex-wrap items-baseline justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="h-7 w-1.5 rounded-full bg-primary" />
            <h1 className="font-display text-3xl sm:text-4xl font-black tracking-tight text-foreground">
              {localizedTitle}
            </h1>
          </div>
          {!loading && (
            <p className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              {articles.length} {articles.length === 1 ? "story" : "stories"}
            </p>
          )}
        </div>

        {/* Loading Skeletons */}
        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card py-20 text-center">
            <p className="text-lg font-medium text-muted-foreground">{t("noArticles")}</p>
            <Link
              to="/"
              className="mt-5 inline-block rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90 transition-colors"
            >
              {t("backHome")}
            </Link>
          </div>
        ) : (
          <>
            {/* Top Featured story if available */}
            {featured && (
              <div className="mb-10 animate-rise">
                <ArticleCard
                  article={featured}
                  variant="horizontal"
                  className="rounded-2xl border border-border bg-card p-4 sm:p-6 shadow-sm"
                />
              </div>
            )}

            {/* Articles Grid */}
            <div className="grid animate-fade-in gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map((a) => (
                <ArticleCard key={a.id} article={a} />
              ))}
            </div>
          </>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
