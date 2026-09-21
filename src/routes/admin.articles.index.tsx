import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getArticles, deleteArticle, updateArticle, type Article } from "@/lib/firestore-service";
import { NAV } from "@/lib/news-data";
import { useLanguage } from "@/contexts/language-context";
import { type Language } from "@/lib/i18n";
import { PlusCircle, Pencil, Trash2, Search, Filter, Eye, EyeOff, Calendar, Globe } from "lucide-react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/articles/")({
  component: ArticlesList,
});

function ArticlesList() {
  const { t, language: adminLang } = useLanguage();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterSection, setFilterSection] = useState("all");
  const [filterLanguage, setFilterLanguage] = useState<string>("all");
  const [deleteTarget, setDeleteTarget] = useState<Article | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const loadArticles = () => {
    setLoading(true);
    getArticles()
      .then(setArticles)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadArticles();
  }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteArticle(deleteTarget.id);
      setArticles((prev) => prev.filter((a) => a.id !== deleteTarget.id));
      toast.success(`"${deleteTarget.title.slice(0, 40)}..." deleted.`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete article.");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const handleTogglePublish = async (article: Article) => {
    setTogglingId(article.id);
    try {
      await updateArticle(article.id, { published: !article.published });
      setArticles((prev) =>
        prev.map((a) => (a.id === article.id ? { ...a, published: !a.published } : a)),
      );
      toast.success(article.published ? "Moved to draft." : "Published!", {
        description: article.title.slice(0, 50),
      });
    } catch {
      toast.error("Failed to update status.");
    } finally {
      setTogglingId(null);
    }
  };

  const sections = NAV.filter((n) => n.slug).map((n) => n.label);

  const filtered = articles.filter((a) => {
    const matchesSearch =
      !search ||
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.author.toLowerCase().includes(search.toLowerCase());
    const matchesSection = filterSection === "all" || a.section === filterSection;
    const matchesLanguage =
      filterLanguage === "all" ||
      (filterLanguage === "am" && (!a.language || a.language === "am")) ||
      a.language === filterLanguage;
    return matchesSearch && matchesSection && matchesLanguage;
  });

  const published = articles.filter((a) => a.published).length;
  const drafts = articles.filter((a) => !a.published).length;

  const getLanguageBadge = (lang?: Language) => {
    if (lang === "om") {
      return (
        <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
          🌳 Oromoo
        </span>
      );
    }
    if (lang === "en") {
      return (
        <span className="rounded bg-sky-100 px-1.5 py-0.5 text-[10px] font-bold text-sky-800">
          🌐 English
        </span>
      );
    }
    return (
      <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
        🇪🇹 አማርኛ
      </span>
    );
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("adminNavArticles")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {articles.length} {t("adminTotalArticles").toLowerCase()} · {published}{" "}
            {t("adminPublished").toLowerCase()} · {drafts} {t("adminDrafts").toLowerCase()}
          </p>
        </div>
        <Link
          to="/admin/articles/$id"
          params={{ id: "new" }}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <PlusCircle className="h-4 w-4" />
          {t("adminNavNewArticle")}
        </Link>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder={t("adminSearchArticles")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-card py-2.5 pl-10 pr-4 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Section Filter */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <select
            value={filterSection}
            onChange={(e) => setFilterSection(e.target.value)}
            className="rounded-lg border border-border bg-card py-2.5 pl-10 pr-8 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            <option value="all">{t("adminAllSections")}</option>
            {sections.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Language Filter */}
        <div className="relative">
          <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <select
            value={filterLanguage}
            onChange={(e) => setFilterLanguage(e.target.value)}
            className="rounded-lg border border-border bg-card py-2.5 pl-10 pr-8 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            <option value="all">{t("adminAllLanguages")}</option>
            <option value="am">🇪🇹 አማርኛ (Amharic)</option>
            <option value="om">🌳 Afaan Oromoo</option>
            <option value="en">🌐 English</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">
            {articles.length === 0 ? (
              <>
                {t("adminNoArticlesFound")}{" "}
                <Link
                  to="/admin/articles/$id"
                  params={{ id: "new" }}
                  className="text-primary hover:underline"
                >
                  {t("adminCreateFirstArticle")}
                </Link>
              </>
            ) : (
              t("adminNoArticlesFound")
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 font-semibold text-foreground">{t("adminTableTitle")}</th>
                  <th className="hidden px-4 py-3 font-semibold text-foreground md:table-cell">
                    {t("adminTableSection")}
                  </th>
                  <th className="hidden px-4 py-3 font-semibold text-foreground lg:table-cell">
                    {t("adminTableLanguage")}
                  </th>
                  <th className="hidden px-4 py-3 font-semibold text-foreground lg:table-cell">
                    {t("adminTableAuthor")}
                  </th>
                  <th className="hidden px-4 py-3 font-semibold text-foreground lg:table-cell">
                    <Calendar className="inline h-3.5 w-3.5 mr-1" />
                    {t("adminTableDate")}
                  </th>
                  <th className="px-4 py-3 font-semibold text-foreground">{t("adminTableStatus")}</th>
                  <th className="px-4 py-3 text-right font-semibold text-foreground">{t("adminTableActions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((article) => (
                  <tr key={article.id} className="transition-colors hover:bg-muted/30">
                    <td className="max-w-xs px-4 py-3">
                      <p className="truncate font-medium text-foreground">{article.title}</p>
                      {article.featured && (
                        <span className="mt-0.5 inline-block rounded bg-yellow-100 px-1.5 py-0.5 text-[10px] font-semibold text-yellow-700">
                          {t("adminFeatured")}
                        </span>
                      )}
                    </td>
                    <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                      {article.section}
                    </td>
                    <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">
                      {getLanguageBadge(article.language)}
                    </td>
                    <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">
                      {article.author}
                    </td>
                    <td className="hidden px-4 py-3 text-xs text-muted-foreground lg:table-cell">
                      {article.createdAt
                        ? article.createdAt.toDate().toLocaleDateString(
                            adminLang === "am" ? "am-ET" : adminLang === "om" ? "en-ET" : "en-GB",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            },
                          )
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => handleTogglePublish(article)}
                        disabled={togglingId === article.id}
                        title={article.published ? "Click to unpublish" : "Click to publish"}
                        className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-50 ${
                          article.published
                            ? "bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-700"
                            : "bg-yellow-100 text-yellow-700 hover:bg-green-100 hover:text-green-700"
                        }`}
                      >
                        {togglingId === article.id ? (
                          <div className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
                        ) : article.published ? (
                          <Eye className="h-3 w-3" />
                        ) : (
                          <EyeOff className="h-3 w-3" />
                        )}
                        {article.published ? t("adminPublished") : t("adminDrafts")}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          to="/admin/articles/$id"
                          params={{ id: article.id }}
                          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(article)}
                          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Article?"
        description={`"${deleteTarget?.title.slice(0, 60) ?? ""}" will be permanently deleted and cannot be recovered.`}
        confirmLabel={deleting ? "Deleting..." : "Delete"}
        onConfirm={handleDelete}
      />
    </div>
  );
}
