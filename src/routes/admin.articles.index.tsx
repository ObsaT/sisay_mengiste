import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  getArticles,
  deleteArticle,
  deleteAllArticles,
  updateArticle,
  type Article,
} from "@/lib/firestore-service";
import { NAV, SECTION_TO_SLUG } from "@/lib/news-data";
import { useLanguage } from "@/contexts/language-context";
import { type Language } from "@/lib/i18n";
import {
  PlusCircle,
  Pencil,
  Trash2,
  Search,
  Filter,
  Eye,
  EyeOff,
  Calendar,
  Globe,
  AlertTriangle,
  CheckSquare,
  Square,
  Video,
} from "lucide-react";
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
  const [filterFormat, setFilterFormat] = useState<"all" | "video" | "standard">("all");
  const [filterLanguage, setFilterLanguage] = useState<string>("all");
  const [deleteTarget, setDeleteTarget] = useState<Article | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Bulk selection & Delete All state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);
  const [deleteSelectedOpen, setDeleteSelectedOpen] = useState(false);
  const [batchDeleting, setBatchDeleting] = useState(false);

  const loadArticles = () => {
    setLoading(true);
    getArticles()
      .then((data) => {
        setArticles(data);
        setSelectedIds(new Set());
      })
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
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(deleteTarget.id);
        return next;
      });
      toast.success(`"${deleteTarget.title.slice(0, 40)}..." deleted.`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete article.");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  // Delete ALL articles in the database
  const handleDeleteAll = async () => {
    setBatchDeleting(true);
    const toastId = toast.loading("Deleting all articles from database...");
    try {
      const count = await deleteAllArticles();
      setArticles([]);
      setSelectedIds(new Set());
      toast.success(`Successfully deleted all ${count} articles.`, { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete all articles.", { id: toastId });
    } finally {
      setBatchDeleting(false);
      setDeleteAllOpen(false);
    }
  };

  // Delete SELECTED articles in the database
  const handleDeleteSelected = async () => {
    const idsToDelete = Array.from(selectedIds);
    if (idsToDelete.length === 0) return;

    setBatchDeleting(true);
    const toastId = toast.loading(`Deleting ${idsToDelete.length} selected articles...`);
    try {
      const count = await deleteAllArticles(idsToDelete);
      setArticles((prev) => prev.filter((a) => !selectedIds.has(a.id)));
      setSelectedIds(new Set());
      toast.success(`Successfully deleted ${count} articles.`, { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete selected articles.", { id: toastId });
    } finally {
      setBatchDeleting(false);
      setDeleteSelectedOpen(false);
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

    const isVideo = Boolean(a.youtubeVideoId || a.videoUrl);

    // Format Filter (Videos vs Written Articles)
    let matchesFormat = true;
    if (filterFormat === "video") {
      matchesFormat = isVideo;
    } else if (filterFormat === "standard") {
      matchesFormat = !isVideo;
    }

    // Section Filter
    const isVideoSectionFilter =
      filterSection === "ቪዲዮ" ||
      filterSection.toLowerCase() === "video" ||
      filterSection.toLowerCase() === "viidiyoo";

    let matchesSection = true;
    if (filterSection !== "all") {
      if (isVideoSectionFilter) {
        // When Video section is selected, strictly list ONLY articles that have video
        matchesSection = isVideo;
      } else {
        matchesSection = a.section === filterSection || SECTION_TO_SLUG[a.section] === filterSection;
      }
    }

    const matchesLanguage =
      filterLanguage === "all" ||
      (filterLanguage === "am" && (!a.language || a.language === "am")) ||
      a.language === filterLanguage;

    return matchesSearch && matchesFormat && matchesSection && matchesLanguage;
  });

  const published = articles.filter((a) => a.published).length;
  const drafts = articles.filter((a) => !a.published).length;

  const handleToggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((a) => a.id)));
    }
  };

  const handleToggleSelectOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const getLanguageBadge = (lang?: Language) => {
    if (lang === "om") {
      return (
        <span className="rounded bg-emerald-100 dark:bg-emerald-950/40 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800 dark:text-emerald-300">
          🌳 Oromoo
        </span>
      );
    }
    if (lang === "en") {
      return (
        <span className="rounded bg-sky-100 dark:bg-sky-950/40 px-1.5 py-0.5 text-[10px] font-bold text-sky-800 dark:text-sky-300">
          🌐 English
        </span>
      );
    }
    return (
      <span className="rounded bg-amber-100 dark:bg-amber-950/40 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 dark:text-amber-300">
        🇪🇹 አማርኛ
      </span>
    );
  };

  return (
    <div>
      {/* Top Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("adminNavArticles")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {articles.length} {t("adminTotalArticles").toLowerCase()} · {published}{" "}
            {t("adminPublished").toLowerCase()} · {drafts} {t("adminDrafts").toLowerCase()}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Delete All Option */}
          {articles.length > 0 && (
            <button
              type="button"
              onClick={() => setDeleteAllOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border border-destructive/40 bg-destructive/10 px-3.5 py-2.5 text-xs font-bold text-destructive hover:bg-destructive/20 transition-all cursor-pointer shadow-2xs"
              title="Permanently remove all articles from database"
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete All Articles</span>
            </button>
          )}

          {/* New Article Link */}
          <Link
            to="/admin/articles/$id"
            params={{ id: "new" }}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs sm:text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 shadow-xs cursor-pointer"
          >
            <PlusCircle className="h-4 w-4" />
            <span>{t("adminNavNewArticle")}</span>
          </Link>
        </div>
      </div>

      {/* Bulk selection actions bar */}
      {selectedIds.size > 0 && (
        <div className="mb-4 flex items-center justify-between gap-4 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 animate-in fade-in">
          <div className="flex items-center gap-2 text-xs font-bold text-destructive">
            <CheckSquare className="h-4 w-4" />
            <span>{selectedIds.size} articles selected</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              Deselect All
            </button>
            <button
              type="button"
              onClick={() => setDeleteSelectedOpen(true)}
              className="flex items-center gap-1.5 rounded-lg bg-destructive px-3.5 py-1.5 text-xs font-bold text-destructive-foreground shadow-xs hover:bg-destructive/90 transition-all cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete Selected ({selectedIds.size})</span>
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder={t("adminSearchArticles")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-border bg-card py-2.5 pl-10 pr-4 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Section Filter */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <select
            value={filterSection}
            onChange={(e) => setFilterSection(e.target.value)}
            className="rounded-xl border border-border bg-card py-2.5 pl-10 pr-8 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 cursor-pointer"
          >
            <option value="all">{t("adminAllSections")}</option>
            {sections.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Format Filter */}
        <div className="relative">
          <Video className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <select
            value={filterFormat}
            onChange={(e) => setFilterFormat(e.target.value as "all" | "video" | "standard")}
            className="rounded-xl border border-border bg-card py-2.5 pl-10 pr-8 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 cursor-pointer"
          >
            <option value="all">All Formats</option>
            <option value="video">🎬 Videos Only</option>
            <option value="standard">📰 Written Articles Only</option>
          </select>
        </div>

        {/* Language Filter */}
        <div className="relative">
          <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <select
            value={filterLanguage}
            onChange={(e) => setFilterLanguage(e.target.value)}
            className="rounded-xl border border-border bg-card py-2.5 pl-10 pr-8 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 cursor-pointer"
          >
            <option value="all">{t("adminAllLanguages")}</option>
            <option value="am">🇪🇹 አማርኛ (Amharic)</option>
            <option value="om">🌳 Afaan Oromoo</option>
            <option value="en">🌐 English</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-2xs">
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
                  className="text-primary hover:underline font-bold"
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
                  {/* Select All Checkbox */}
                  <th className="px-4 py-3 w-10">
                    <button
                      type="button"
                      onClick={handleToggleSelectAll}
                      className="text-muted-foreground hover:text-foreground cursor-pointer flex items-center"
                      title={selectedIds.size === filtered.length ? "Deselect all" : "Select all"}
                    >
                      {selectedIds.size === filtered.length && filtered.length > 0 ? (
                        <CheckSquare className="h-4 w-4 text-primary" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>
                  </th>
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
                {filtered.map((article) => {
                  const isSelected = selectedIds.has(article.id);
                  const isVideo = Boolean(article.youtubeVideoId || article.videoUrl);
                  return (
                    <tr
                      key={article.id}
                      className={`transition-colors ${
                        isSelected ? "bg-primary/5" : "hover:bg-muted/30"
                      }`}
                    >
                      {/* Row Checkbox */}
                      <td className="px-4 py-3 w-10">
                        <button
                          type="button"
                          onClick={() => handleToggleSelectOne(article.id)}
                          className="text-muted-foreground hover:text-foreground cursor-pointer flex items-center"
                        >
                          {isSelected ? (
                            <CheckSquare className="h-4 w-4 text-primary" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </button>
                      </td>

                      <td className="max-w-xs px-4 py-3">
                        <div className="flex items-center gap-2">
                          {isVideo && (
                            <span className="rounded bg-red-600/10 text-red-600 border border-red-600/20 px-1.5 py-0.5 text-[9px] font-bold flex items-center gap-0.5 shrink-0">
                              <Video className="h-2.5 w-2.5" />
                              <span>VIDEO</span>
                            </span>
                          )}
                          <p className="truncate font-medium text-foreground">{article.title}</p>
                        </div>
                        {article.featured && (
                          <span className="mt-1 inline-block rounded bg-yellow-100 dark:bg-yellow-950/40 px-1.5 py-0.5 text-[10px] font-semibold text-yellow-700 dark:text-yellow-300">
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
                          className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-50 cursor-pointer ${
                            article.published
                              ? "bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-300 hover:bg-red-100 hover:text-red-700"
                              : "bg-yellow-100 dark:bg-yellow-950/40 text-yellow-700 dark:text-yellow-300 hover:bg-green-100 hover:text-green-700"
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
                            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Single Article Confirmation Dialog */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Article?"
        description={`"${deleteTarget?.title.slice(0, 60) ?? ""}" will be permanently deleted and cannot be recovered.`}
        confirmLabel={deleting ? "Deleting..." : "Delete Article"}
        onConfirm={handleDelete}
      />

      {/* Delete ALL Articles Confirmation Dialog */}
      <ConfirmDialog
        open={deleteAllOpen}
        onOpenChange={(open) => !open && setDeleteAllOpen(false)}
        title={`⚠️ Delete ALL ${articles.length} Articles?`}
        description={`WARNING: You are about to permanently delete all ${articles.length} articles from Firestore. All content, images, translations, and view statistics will be permanently destroyed. This action CANNOT be undone.`}
        confirmLabel={batchDeleting ? "Deleting Everything..." : `Yes, Delete All (${articles.length})`}
        variant="destructive"
        onConfirm={handleDeleteAll}
      />

      {/* Delete SELECTED Articles Confirmation Dialog */}
      <ConfirmDialog
        open={deleteSelectedOpen}
        onOpenChange={(open) => !open && setDeleteSelectedOpen(false)}
        title={`Delete ${selectedIds.size} Selected Articles?`}
        description={`Are you sure you want to permanently delete the ${selectedIds.size} selected articles? This action cannot be undone.`}
        confirmLabel={batchDeleting ? "Deleting..." : `Delete ${selectedIds.size} Articles`}
        variant="destructive"
        onConfirm={handleDeleteSelected}
      />
    </div>
  );
}
