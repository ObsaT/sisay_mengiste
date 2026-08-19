import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  getArticles,
  type Article,
} from "@/lib/firestore-service";
import { seedFirestore } from "@/lib/seed-firestore";
import {
  FileText,
  Eye,
  Clock,
  TrendingUp,
  PlusCircle,
  Database,
  Zap,
} from "lucide-react";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  const loadArticles = () =>
    getArticles()
      .then(setArticles)
      .catch(console.error)
      .finally(() => setLoading(false));

  useEffect(() => {
    loadArticles();
  }, []);

  const handleSeed = async () => {
    if (!confirm("Import sample stories from the demo dataset into Firestore? This only works if the database is empty.")) return;
    setSeeding(true);
    try {
      const result = await seedFirestore();
      if (result.skipped > 0) {
        alert(`Database already has ${result.skipped} articles. Seed skipped.`);
      } else {
        alert(`Successfully imported ${result.imported} sample articles!`);
        loadArticles();
      }
    } catch (err) {
      console.error(err);
      alert("Seed failed. Check the console for details.");
    } finally {
      setSeeding(false);
    }
  };

  const published = articles.filter((a) => a.published).length;
  const drafts = articles.filter((a) => !a.published).length;
  const featured = articles.filter((a) => a.featured).length;
  const breaking = articles.filter((a) => a.breaking).length;

  const stats = [
    { label: "Total Articles", value: articles.length, icon: FileText, color: "text-blue-500" },
    { label: "Published", value: published, icon: Eye, color: "text-green-500" },
    { label: "Drafts", value: drafts, icon: Clock, color: "text-yellow-500" },
    { label: "Featured", value: featured, icon: TrendingUp, color: "text-purple-500" },
    { label: "Breaking", value: breaking, icon: Zap, color: "text-red-500" },
  ];

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your news articles and content.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
          >
            <Database className={`h-4 w-4 ${seeding ? "animate-pulse" : ""}`} />
            {seeding ? "Importing..." : "Seed Demo Data"}
          </button>
          <Link
            to="/admin/articles/$id"
            params={{ id: "new" }}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <PlusCircle className="h-4 w-4" />
            New Article
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-border bg-card p-5"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </span>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
            <p className="mt-2 text-3xl font-bold text-foreground">
              {loading ? "—" : stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Recent articles */}
      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold text-foreground">Recent Articles</h2>
          <Link
            to="/admin/articles"
            className="text-sm text-primary hover:underline"
          >
            View all
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : articles.length === 0 ? (
          <div className="py-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground/30" />
            <p className="mt-3 text-sm text-muted-foreground">
              No articles yet.{" "}
              <Link
              to="/admin/articles/$id"
              params={{ id: "new" }}
              className="text-primary hover:underline"
            >
                Create your first article
              </Link>
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {articles.slice(0, 5).map((article) => (
              <Link
                key={article.id}
                to="/admin/articles/$id"
                params={{ id: article.id }}
                className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-muted/50"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {article.title}
                  </p>
                  <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{article.section}</span>
                    <span>·</span>
                    <span>{article.author}</span>
                  </div>
                </div>
                  <div className="ml-4 flex items-center gap-2 flex-wrap justify-end">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      article.published
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {article.published ? "Published" : "Draft"}
                  </span>
                  {article.featured && (
                    <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                      Featured
                    </span>
                  )}
                  {article.breaking && (
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                      Breaking
                    </span>
                  )}
                  {article.mostRead && (
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                      Most Read
                    </span>
                  )}
                  {article.opinion && (
                    <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-600">
                      Opinion
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
