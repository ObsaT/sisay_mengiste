import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CATEGORY_LABEL } from "@/lib/news-data";
import {
  getPublishedBySection,
  articleSlug,
  timeAgo,
  type Article,
} from "@/lib/firestore-service";

export const Route = createFileRoute("/category/$slug")({
  head: ({ params }) => {
    const label = CATEGORY_LABEL[params.slug];
    if (!label) {
      return {
        meta: [
          { title: "ገጹ አልተገኘም" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const title = `${label} — ሲሳይ መንግስቴ`;
    const description = `የ${label} ክፍል የቅርብ ጊዜ ዘገባዎችና ትንታኔዎች ከሲሳይ መንግስቴ።`;
    const url = `https://ethiopian-reporter-creations.lovable.app/category/${params.slug}`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:url", content: url },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  component: CategoryPage,
});

function Card({ article }: { article: Article }) {
  return (
    <article className="group">
      {article.image ? (
        <div className="overflow-hidden rounded-sm">
          <img
            src={article.image}
            alt={article.title}
            loading="lazy"
            width={1200}
            height={800}
            className="aspect-[3/2] w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]"
          />
        </div>
      ) : null}
      <span className="kicker mt-4 block text-primary">{article.section}</span>
      <h2 className="mt-2 text-lg leading-snug">
        <Link
          to="/article/$slug"
          params={{ slug: articleSlug(article.title) }}
          className="headline-link"
        >
          {article.title}
        </Link>
      </h2>
      {article.excerpt ? (
        <p className="mt-2 text-sm text-muted-foreground">{article.excerpt}</p>
      ) : null}
      <p className="mt-2 text-xs text-muted-foreground">
        <span className="font-semibold text-foreground/80">
          {article.author}
        </span>
        <span className="mx-2 opacity-40">·</span>
        {timeAgo(article.createdAt)}
      </p>
    </article>
  );
}

function CategoryPage() {
  const { slug } = Route.useParams();
  const label = CATEGORY_LABEL[slug];
  const [stories, setStories] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!label) {
      setLoading(false);
      return;
    }
    getPublishedBySection(label)
      .then(setStories)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [label, slug]);

  if (!label) throw notFound();

  const [lead, ...rest] = stories;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-10">
        <nav
          aria-label="የመንገድ ዱካ"
          className="text-xs text-muted-foreground"
        >
          <Link to="/" className="hover:text-primary">
            መነሻ ገጽ
          </Link>
          <span className="mx-2 opacity-40">/</span>
          <span className="text-foreground/80">{label}</span>
        </nav>
        <h1 className="rule-heading mt-3 border-b border-border pb-4 text-3xl tracking-tight">
          {label}
        </h1>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : stories.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground">
            በዚህ ክፍል ዘገባ አልተገኘም።
          </div>
        ) : (
          <>
            {lead ? (
              <section className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
                <Card article={lead} />
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1">
                  {rest.slice(0, 2).map((s) => (
                    <Card key={s.id} article={s} />
                  ))}
                </div>
              </section>
            ) : null}

            <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {rest.slice(2).map((s) => (
                <Card key={s.id} article={s} />
              ))}
            </div>
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
