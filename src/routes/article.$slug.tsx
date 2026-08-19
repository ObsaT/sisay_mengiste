import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SECTION_TO_SLUG } from "@/lib/news-data";
import {
  findArticleBySlug,
  findRelatedArticles,
  articleSlug,
  timeAgo,
  type Article,
} from "@/lib/firestore-service";

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

function ArticlePage() {
  const { slug } = Route.useParams();
  const [story, setStory] = useState<Article | null>(null);
  const [related, setRelated] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFoundState, setNotFoundState] = useState(false);

  useEffect(() => {
    setLoading(true);
    findArticleBySlug(slug)
      .then((article) => {
        if (!article) {
          setNotFoundState(true);
          return;
        }
        setStory(article);
        return findRelatedArticles(article);
      })
      .then((rels) => {
        if (rels) setRelated(rels);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <SiteHeader />
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  if (notFoundState || !story) throw notFound();

  const catSlug = SECTION_TO_SLUG[story.section] ?? "news";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <nav
          aria-label="የመንገድ ዱካ"
          className="text-xs text-muted-foreground"
        >
          <Link to="/" className="hover:text-primary">
            መነሻ ገጽ
          </Link>
          <span className="mx-2 opacity-40">/</span>
          <Link
            to="/category/$slug"
            params={{ slug: catSlug }}
            className="hover:text-primary"
          >
            {story.section}
          </Link>
        </nav>

        <article className="mt-4">
          <span className="kicker bg-primary px-2 py-1 text-primary-foreground">
            {story.section}
          </span>
          <h1 className="mt-4 text-3xl leading-snug sm:text-4xl">
            {story.title}
          </h1>
          <p className="mt-3 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground/80">
              {story.author}
            </span>
            <span className="mx-2 opacity-40">·</span>
            {timeAgo(story.createdAt)}
          </p>
          {story.image ? (
            <img
              src={story.image}
              alt={story.title}
              width={1600}
              height={1000}
              className="mt-6 w-full rounded-sm object-cover"
            />
          ) : null}
          <div className="mt-6 space-y-4 text-base leading-relaxed">
            {story.excerpt ? (
              <p className="text-lg">{story.excerpt}</p>
            ) : null}
            {story.content ? (
              <div className="whitespace-pre-wrap">{story.content}</div>
            ) : (
              <p>
                ይህ ዘገባ በሲሳይ መንግስቴ ዝግጅት ክፍል የተሰናዳ ሲሆን፣ ተጨማሪ መረጃዎችና
                የባለሙያ አስተያየቶች ሲገኙ ይዘምናል። ዝርዝሩን በተከታይ እናቀርባለን።
              </p>
            )}
          </div>
        </article>

        {related.length > 0 ? (
          <section className="mt-12 border-t border-border pt-6">
            <h2 className="rule-heading text-xl">ተዛማጅ ዘገባዎች</h2>
            <ul className="mt-4 space-y-3">
              {related.map((r) => (
                <li key={r.id}>
                  <Link
                    to="/article/$slug"
                    params={{ slug: articleSlug(r.title) }}
                    className="headline-link"
                  >
                    {r.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </main>
      <SiteFooter />
    </div>
  );
}
