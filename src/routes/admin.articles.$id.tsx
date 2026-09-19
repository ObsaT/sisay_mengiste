import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  createArticle,
  getArticle,
  updateArticle,
  articleSlug,
  estimateReadTime,
  type ArticleInput,
  type ArticleTranslation,
} from "@/lib/firestore-service";
import { NAV_CATEGORIES, type Language } from "@/lib/i18n";
import { translateArticleBundle } from "@/lib/translation-service";
import { TipTapEditor } from "@/components/tiptap-editor";
import { ImageUpload } from "@/components/image-upload";
import {
  Save,
  ArrowLeft,
  Eye,
  EyeOff,
  Star,
  Zap,
  TrendingUp,
  MessageSquare,
  ExternalLink,
  Sparkles,
  Loader2,
  Languages,
  Check,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/articles/$id")({
  component: ArticleEditor,
});

const SECTIONS = NAV_CATEGORIES.filter((n) => n.slug).map((n) => ({
  value: n.label.am,
  label: `${n.label.am} — ${n.label.om} (${n.label.en})`,
}));

const LANGUAGES: { code: Language; label: string; flag: string }[] = [
  { code: "am", label: "አማርኛ (Amharic)", flag: "🇪🇹" },
  { code: "om", label: "Afaan Oromoo", flag: "🌳" },
  { code: "en", label: "English", flag: "🌐" },
];

function ArticleEditor() {
  const { id } = Route.useParams();
  const isNew = id === "new";
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [section, setSection] = useState(SECTIONS[0]?.value ?? "ዜና");
  const [language, setLanguage] = useState<Language>("am");
  const [author, setAuthor] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState("");
  const [tags, setTags] = useState("");
  const [featured, setFeatured] = useState(false);
  const [published, setPublished] = useState(false);
  const [breaking, setBreaking] = useState(false);
  const [mostRead, setMostRead] = useState(false);
  const [opinion, setOpinion] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!isNew);
  const [preview, setPreview] = useState(false);

  // Multilingual translations state
  const [translations, setTranslations] = useState<Partial<Record<Language, ArticleTranslation>>>(
    {},
  );
  const [translatingTo, setTranslatingTo] = useState<Language | null>(null);
  const [activeTranslationTab, setActiveTranslationTab] = useState<Language | null>(null);

  useEffect(() => {
    if (!isNew) {
      getArticle(id)
        .then((article) => {
          if (article) {
            setTitle(article.title);
            setSection(article.section);
            if (article.language) setLanguage(article.language);
            setAuthor(article.author);
            setExcerpt(article.excerpt);
            setContent(article.content || "");
            setImage(article.image);
            setTags((article.tags ?? []).join(", "));
            setFeatured(article.featured);
            setPublished(article.published);
            setBreaking(article.breaking);
            setMostRead(article.mostRead);
            setOpinion(article.opinion);
            if (article.translations) {
              setTranslations(article.translations);
            }
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [id, isNew]);

  const handleAutoTranslate = async (targetLang: Language) => {
    if (!title.trim()) {
      toast.error("Please enter a title before translating.");
      return;
    }
    setTranslatingTo(targetLang);
    const toastId = toast.loading(
      `Translating to ${LANGUAGES.find((l) => l.code === targetLang)?.label}...`,
    );

    try {
      const result = await translateArticleBundle(
        { title, excerpt, content },
        language,
        targetLang,
      );

      setTranslations((prev) => ({
        ...prev,
        [targetLang]: result,
      }));
      setActiveTranslationTab(targetLang);
      toast.success(`Translated to ${LANGUAGES.find((l) => l.code === targetLang)?.label}!`, {
        id: toastId,
      });
    } catch (err) {
      console.error(err);
      toast.error("Translation failed. Please try again.", { id: toastId });
    } finally {
      setTranslatingTo(null);
    }
  };

  const handleRemoveTranslation = (targetLang: Language) => {
    setTranslations((prev) => {
      const copy = { ...prev };
      delete copy[targetLang];
      return copy;
    });
    if (activeTranslationTab === targetLang) {
      setActiveTranslationTab(null);
    }
    toast.success("Translation removed.");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Title is required.");
      return;
    }
    if (!author.trim()) {
      toast.error("Author is required.");
      return;
    }
    if (!excerpt.trim()) {
      toast.error("Excerpt is required.");
      return;
    }

    setSaving(true);
    const toastId = toast.loading(isNew ? "Creating article..." : "Saving changes...");

    const data: ArticleInput = {
      title: title.trim(),
      slug: articleSlug(title),
      section,
      language,
      translations,
      author: author.trim(),
      excerpt: excerpt.trim(),
      content,
      image,
      featured,
      published,
      breaking,
      mostRead,
      opinion,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      readTime: estimateReadTime(content),
      viewCount: 0,
    };

    try {
      if (isNew) {
        const newId = await createArticle(data);
        toast.success("Article created!", { id: toastId });
        navigate({ to: "/admin/articles/$id", params: { id: newId } });
      } else {
        await updateArticle(id, data);
        toast.success("Article updated!", { id: toastId });
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to save article. Check your connection.", { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const slug = articleSlug(title);
  const readTime = estimateReadTime(content);

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <Link
          to="/admin/articles/"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border transition-colors hover:bg-muted"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">
            {isNew ? "New Article" : "Edit Article"}
          </h1>
          {title && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              Slug: <code className="rounded bg-muted px-1 py-0.5">{slug}</code>
              {" · "}~{readTime} min read
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPreview((v) => !v)}
            className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            {preview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {preview ? "Edit" : "Preview"}
          </button>
          {!isNew && (
            <a
              href={`/sisay_mengiste/article/${slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              <ExternalLink className="h-4 w-4" />
              View
            </a>
          )}
        </div>
      </div>

      {/* Preview mode */}
      {preview ? (
        <div className="rounded-xl border border-border bg-card p-8">
          {image && (
            <img src={image} alt={title} className="mb-6 w-full rounded-lg object-cover max-h-80" />
          )}
          <span className="kicker bg-primary px-2 py-1 text-primary-foreground text-xs">
            {section}
          </span>
          <h1 className="mt-4 text-3xl font-display font-bold leading-snug">
            {title || "Untitled"}
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            {author} · ~{readTime} min read
          </p>
          {excerpt && (
            <p className="mt-4 text-lg text-foreground/80 border-l-4 border-primary pl-4">
              {excerpt}
            </p>
          )}
          {content ? (
            <div className="prose-amharic mt-6" dangerouslySetInnerHTML={{ __html: content }} />
          ) : (
            <p className="mt-6 text-muted-foreground italic">No content yet.</p>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter article title"
              required
              className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Section + Author + Primary Language */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Section *</label>
              <select
                value={section}
                onChange={(e) => setSection(e.target.value)}
                required
                className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                {SECTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Author *</label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Author name"
                required
                className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Original Language *
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
                required
                className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.flag} {l.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Cover Image */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Cover Image
              <span className="ml-2 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                Cloudinary Storage
              </span>
            </label>
            <ImageUpload value={image} onChange={setImage} />
          </div>

          {/* Excerpt */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Excerpt / Summary *
            </label>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Brief summary of the article (shown on homepage and category pages)"
              required
              rows={3}
              className="w-full resize-none rounded-lg border border-border bg-card px-4 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Rich text content */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Full Content
              <span className="ml-2 rounded bg-accent/10 px-1.5 py-0.5 text-[10px] font-semibold text-accent">
                Rich Text
              </span>
            </label>
            <TipTapEditor
              content={content}
              onChange={setContent}
              placeholder="Write the full article here. Use the toolbar for formatting..."
            />
          </div>

          {/* Tags */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Tags <span className="text-muted-foreground font-normal">(comma-separated)</span>
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="politics, economy, addis ababa"
              className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* ── AI Multilingual Translations Box ─────────────── */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Languages className="h-5 w-5 text-primary" />
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    Multilingual Translations / ትርጉሞች
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Automatically generate Afaan Oromoo, Amharic, or English versions with 1 click.
                  </p>
                </div>
              </div>

              {/* Translation Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                {(["am", "om", "en"] as Language[])
                  .filter((l) => l !== language)
                  .map((targetLang) => {
                    const exists = Boolean(translations[targetLang]);
                    return (
                      <button
                        key={targetLang}
                        type="button"
                        disabled={translatingTo === targetLang}
                        onClick={() => handleAutoTranslate(targetLang)}
                        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all shadow-xs border ${
                          exists
                            ? "bg-muted text-foreground border-border hover:bg-muted/80"
                            : "bg-primary/10 text-primary border-primary/30 hover:bg-primary hover:text-primary-foreground"
                        }`}
                      >
                        {translatingTo === targetLang ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : exists ? (
                          <Check className="h-3.5 w-3.5 text-green-500" />
                        ) : (
                          <Sparkles className="h-3.5 w-3.5" />
                        )}
                        <span>
                          {exists ? "Re-translate" : "AI Translate to"}{" "}
                          {targetLang === "am"
                            ? "አማርኛ"
                            : targetLang === "om"
                              ? "Oromoo"
                              : "English"}
                        </span>
                      </button>
                    );
                  })}
              </div>
            </div>

            {/* Translation Tabs */}
            {Object.keys(translations).length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-border pb-2">
                  {Object.keys(translations).map((langKey) => {
                    const lk = langKey as Language;
                    return (
                      <button
                        key={lk}
                        type="button"
                        onClick={() => setActiveTranslationTab(lk)}
                        className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-bold border transition-colors ${
                          activeTranslationTab === lk
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-muted/40 text-foreground border-border hover:bg-muted"
                        }`}
                      >
                        <span>
                          {lk === "am" ? "አማርኛ" : lk === "om" ? "Afaan Oromoo" : "English"}
                        </span>
                        <Check className="h-3 w-3 text-green-400" />
                      </button>
                    );
                  })}
                </div>

                {activeTranslationTab && translations[activeTranslationTab] && (
                  <div className="rounded-xl border border-border/80 bg-muted/20 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                        {activeTranslationTab === "am"
                          ? "አማርኛ Version"
                          : activeTranslationTab === "om"
                            ? "Afaan Oromoo Version"
                            : "English Version"}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTranslation(activeTranslationTab)}
                        className="flex items-center gap-1 text-xs text-destructive hover:underline"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Remove</span>
                      </button>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-muted-foreground block mb-1">
                        Translated Title:
                      </label>
                      <input
                        type="text"
                        value={translations[activeTranslationTab]?.title || ""}
                        onChange={(e) =>
                          setTranslations((prev) => ({
                            ...prev,
                            [activeTranslationTab]: {
                              ...prev[activeTranslationTab]!,
                              title: e.target.value,
                            },
                          }))
                        }
                        className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-muted-foreground block mb-1">
                        Translated Excerpt:
                      </label>
                      <textarea
                        rows={2}
                        value={translations[activeTranslationTab]?.excerpt || ""}
                        onChange={(e) =>
                          setTranslations((prev) => ({
                            ...prev,
                            [activeTranslationTab]: {
                              ...prev[activeTranslationTab]!,
                              excerpt: e.target.value,
                            },
                          }))
                        }
                        className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">
                No translations generated yet. Click any "AI Translate" button above to
                auto-generate versions for Afaan Oromoo or English.
              </p>
            )}
          </div>

          {/* Status & Placement Toggles */}
          <div className="flex flex-col gap-3 rounded-xl border border-border bg-muted/30 p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Status
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
              <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-foreground">
                <input
                  type="checkbox"
                  checked={published}
                  onChange={(e) => setPublished(e.target.checked)}
                  className="h-4 w-4 rounded border-border accent-primary"
                />
                {published ? (
                  <Eye className="h-4 w-4 text-green-500" />
                ) : (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                )}
                {published ? "Published" : "Draft"}
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-foreground">
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="h-4 w-4 rounded border-border accent-primary"
                />
                <Star
                  className={`h-4 w-4 ${featured ? "text-yellow-500" : "text-muted-foreground"}`}
                />
                Featured Hero
              </label>
            </div>

            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground pt-2">
              Placement
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
              <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-foreground">
                <input
                  type="checkbox"
                  checked={breaking}
                  onChange={(e) => setBreaking(e.target.checked)}
                  className="h-4 w-4 rounded border-border accent-primary"
                />
                <Zap className={`h-4 w-4 ${breaking ? "text-red-500" : "text-muted-foreground"}`} />
                Breaking ticker
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-foreground">
                <input
                  type="checkbox"
                  checked={mostRead}
                  onChange={(e) => setMostRead(e.target.checked)}
                  className="h-4 w-4 rounded border-border accent-primary"
                />
                <TrendingUp
                  className={`h-4 w-4 ${mostRead ? "text-blue-500" : "text-muted-foreground"}`}
                />
                Most Read
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-foreground">
                <input
                  type="checkbox"
                  checked={opinion}
                  onChange={(e) => setOpinion(e.target.checked)}
                  className="h-4 w-4 rounded border-border accent-primary"
                />
                <MessageSquare
                  className={`h-4 w-4 ${opinion ? "text-purple-500" : "text-muted-foreground"}`}
                />
                Opinion / Editorial
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 border-t border-border pt-6">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : isNew ? "Create Article" : "Update Article"}
            </button>
            <Link
              to="/admin/articles/"
              className="rounded-lg border border-border px-6 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              Cancel
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}
