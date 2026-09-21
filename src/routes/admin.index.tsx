import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getArticles, type Article } from "@/lib/firestore-service";
import { fetchSubscribers } from "@/lib/subscribers-service";
import { seedFirestore } from "@/lib/seed-firestore";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useLanguage } from "@/contexts/language-context";
import {
  FileText,
  Eye,
  Clock,
  TrendingUp,
  PlusCircle,
  Database,
  Zap,
  ExternalLink,
  BarChart3,
  Users,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

const CHART_COLORS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#06b6d4",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
];

function AdminDashboard() {
  const { t } = useLanguage();
  const [articles, setArticles] = useState<Article[]>([]);
  const [subscribersCount, setSubscribersCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [seedOpen, setSeedOpen] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const loadArticles = () =>
    getArticles()
      .then(setArticles)
      .catch(console.error)
      .finally(() => setLoading(false));

  useEffect(() => {
    loadArticles();
    fetchSubscribers()
      .then((subs) => setSubscribersCount(subs.length))
      .catch(console.error);
  }, []);

  const handleSeed = async () => {
    setSeeding(true);
    const toastId = toast.loading("Importing demo articles...");
    try {
      const result = await seedFirestore();
      if (result.skipped > 0) {
        toast.warning(`Seed skipped — ${result.skipped} articles already exist.`, { id: toastId });
      } else {
        toast.success(`Imported ${result.imported} demo articles!`, { id: toastId });
        loadArticles();
      }
    } catch (err) {
      console.error(err);
      toast.error("Seed failed. Check the console.", { id: toastId });
    } finally {
      setSeeding(false);
    }
  };

  const published = articles.filter((a) => a.published).length;
  const drafts = articles.filter((a) => !a.published).length;
  const featured = articles.filter((a) => a.featured).length;
  const breaking = articles.filter((a) => a.breaking).length;

  const stats = [
    { label: t("adminTotalArticles"), value: articles.length, icon: FileText, color: "text-blue-500 bg-blue-50", link: "/admin/articles" },
    { label: t("adminPublished"), value: published, icon: Eye, color: "text-green-600 bg-green-50", link: "/admin/articles" },
    { label: t("adminDrafts"), value: drafts, icon: Clock, color: "text-yellow-600 bg-yellow-50", link: "/admin/articles" },
    { label: t("adminNavSubscribers"), value: subscribersCount, icon: Users, color: "text-purple-600 bg-purple-50", link: "/admin/subscribers" },
    { label: t("adminBreaking"), value: breaking, icon: Zap, color: "text-red-600 bg-red-50", link: "/admin/articles" },
  ];

  // Articles by section chart data
  const sectionCounts: Record<string, number> = {};
  articles.forEach((a) => {
    sectionCounts[a.section] = (sectionCounts[a.section] ?? 0) + 1;
  });
  const chartData = Object.entries(sectionCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, count]) => ({ name, count }));

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("adminDashboardTitle")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("adminDashboardSubtitle")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSeedOpen(true)}
            disabled={seeding}
            className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
          >
            <Database className={`h-4 w-4 ${seeding ? "animate-pulse" : ""}`} />
            {t("adminSeedDemo")}
          </button>
          <a
            href="/sisay_mengiste/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            <ExternalLink className="h-4 w-4" />
            {t("adminViewSite")}
          </a>
          <Link
            to="/admin/articles/$id"
            params={{ id: "new" }}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <PlusCircle className="h-4 w-4" />
            {t("adminNavNewArticle")}
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((stat) => {
          const Content = (
            <div className="rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/50 hover:shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">{stat.label}</span>
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${stat.color}`}>
                  <stat.icon className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-2 text-3xl font-bold text-foreground">{loading ? "—" : stat.value}</p>
            </div>
          );

          if (stat.link) {
            return (
              <Link key={stat.label} to={stat.link} className="block">
                {Content}
              </Link>
            );
          }

          return <div key={stat.label}>{Content}</div>;
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.5fr]">
        {/* Recent articles */}
        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h2 className="text-lg font-semibold text-foreground">{t("adminRecentArticles")}</h2>
            <Link to="/admin/articles" className="text-sm text-primary hover:underline">
              {t("viewAll")}
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
                {t("adminNoArticlesFound")}{" "}
                <Link
                  to="/admin/articles/$id"
                  params={{ id: "new" }}
                  className="text-primary hover:underline"
                >
                  {t("adminCreateFirstArticle")}
                </Link>
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {articles.slice(0, 6).map((article) => (
                <Link
                  key={article.id}
                  to="/admin/articles/$id"
                  params={{ id: article.id }}
                  className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-muted/50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{article.title}</p>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{article.section}</span>
                      <span>·</span>
                      <span>{article.author}</span>
                    </div>
                  </div>
                  <span
                    className={`ml-4 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      article.published
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {article.published ? t("adminPublished") : t("adminDrafts")}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Chart: articles by section */}
        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center gap-2 border-b border-border px-6 py-4">
            <BarChart3 className="h-4 w-4 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">{t("adminArticlesBySection")}</h2>
          </div>
          {loading || chartData.length === 0 ? (
            <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
              {loading ? (
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              ) : (
                t("adminNoArticlesFound")
              )}
            </div>
          ) : (
            <div className="p-4">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 4 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid var(--border)",
                      background: "var(--card)",
                      color: "var(--foreground)",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {chartData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={seedOpen}
        onOpenChange={setSeedOpen}
        title="Import Demo Data?"
        description="This will add sample Amharic news articles to your Firestore database. Only works if the database is empty."
        confirmLabel="Import Demo Data"
        variant="default"
        onConfirm={handleSeed}
      />
    </div>
  );
}
