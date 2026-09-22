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
import { useLanguage } from "@/contexts/language-context";
import { translateArticleBundle } from "@/lib/translation-service";
import { TipTapEditor } from "@/components/tiptap-editor";
import { ImageUpload } from "@/components/image-upload";
import { BroadcastModal } from "@/components/broadcast-modal";
import { YouTubeModal } from "@/components/youtube-modal";
import { fetchSubscribers, type Subscriber } from "@/lib/subscribers-service";
import { getYouTubeEmbedUrl, type YouTubeVideoItem } from "@/lib/youtube-service";
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
  Send,
  Video,
  Play,
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
  const { t } = useLanguage();

  const [title, setTitle] = useState("");
  const [section, setSection] = useState(SECTIONS[0]?.value ?? "ዜና");
  const [language, setLanguage] = useState<Language>("am");
  const [author, setAuthor] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState("");
  const [tags, setTags] = useState("");
  const [featured, setFeatured] = useState(false);
  const [published, setPublished] = useState(true); // Default to PUBLISHED live!
  const [breaking, setBreaking] = useState(false);
  const [mostRead, setMostRead] = useState(false);
  const [opinion, setOpinion] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!isNew);
  const [preview, setPreview] = useState(false);

  // YouTube Video Article state
  const [videoUrl, setVideoUrl] = useState("");
  const [youtubeVideoId, setYoutubeVideoId] = useState("");
  const [youtubeModalOpen, setYoutubeModalOpen] = useState(false);

  // Multilingual translations state
  const [translations, setTranslations] = useState<Partial<Record<Language, ArticleTranslation>>>(
    {},
  );
  const [translatingTo, setTranslatingTo] = useState<Language | null>(null);
  const [activeTranslationTab, setActiveTranslationTab] = useState<Language | null>(null);

  // Broadcast to subscribers state
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);

  const handleOpenBroadcast = async () => {
    try {
      const subs = await fetchSubscribers();
      setSubscribers(subs);
      setBroadcastOpen(true);
    } catch (err) {
      console.error(err);
      toast.error("Could not load subscribers.");
    }
  };

  const handleSelectYouTubeVideo = (video: YouTubeVideoItem) => {
    setYoutubeVideoId(video.id);
    setVideoUrl(video.videoUrl);

    // Auto-fill title if current title is empty
    if (!title.trim()) {
      setTitle(video.title);
    }

    // Auto-fill image with YouTube thumbnail if empty
    if (!image.trim()) {
      setImage(video.thumbnailUrl);
    }

    // Auto-select "ቪዲዮ" section if available
    const videoSec = SECTIONS.find((s) => s.value === "ቪዲዮ" || s.label.toLowerCase().includes("video"));
    if (videoSec) {
      setSection(videoSec.value);
    }
  };

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
            setPublished(article.published !== false); // load actual status
            setBreaking(article.breaking);
            setMostRead(article.mostRead);
            setOpinion(article.opinion);
            if (article.videoUrl) setVideoUrl(article.videoUrl);
            if (article.youtubeVideoId) setYoutubeVideoId(article.youtubeVideoId);
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

  const handleSaveWithStatus = async (publishStatus: boolean) => {
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
    const toastId = toast.loading(
      publishStatus
        ? isNew
          ? "Publishing article live..."
          : "Updating and publishing live..."
        : isNew
        ? "Saving draft..."
        : "Saving changes as draft...",
    );

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
      published: publishStatus,
      breaking,
      mostRead,
      opinion,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      readTime: estimateReadTime(content),
      viewCount: 0,
      videoUrl: videoUrl.trim() || undefined,
      youtubeVideoId: youtubeVideoId.trim() || undefined,
    };

    try {
      if (isNew) {
        const newId = await createArticle(data);
        setPublished(publishStatus);
        toast.success(
          publishStatus
            ? "Article published! It is now live on the website."
            : "Article saved as draft (hidden from public).",
          { id: toastId },
        );
        navigate({ to: "/admin/articles/$id", params: { id: newId } });
      } else {
        await updateArticle(id, data);
        setPublished(publishStatus);
        toast.success(
          publishStatus
            ? "Article updated and live on website!"
            : "Article saved as draft (hidden from public).",
          { id: toastId },
        );
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to save article. Check your connection.", { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void handleSaveWithStatus(published);
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
          title={t("adminBackToArticles")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">
            {isNew ? t("adminNavNewArticle") : t("adminEditMode")}
          </h1>
          {title && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              Slug: <code className="rounded bg-muted px-1 py-0.5">{slug}</code>
              {" · "}~{readTime} min read
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Badge Toggle */}
          <button
            type="button"
            onClick={() => setPublished(!published)}
            title="Click to toggle between Published and Draft"
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition-all border cursor-pointer ${
              published
                ? "bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30 hover:bg-green-500/25"
                : "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/25"
            }`}
          >
            {published ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            <span>{published ? t("adminStatusPublished") : t("adminStatusDraft")}</span>
          </button>

          <button
            type="button"
            onClick={() => setPreview((v) => !v)}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
          >
            {preview ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            {preview ? t("adminEditMode") : t("adminPreview")}
          </button>

          <button
            type="button"
            onClick={() => handleSaveWithStatus(false)}
            disabled={saving}
            className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground shadow-xs hover:bg-muted transition-colors disabled:opacity-50"
          >
            <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
            {t("adminSaveDraft")}
          </button>

          <button
            type="button"
            onClick={() => handleSaveWithStatus(true)}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            <Eye className="h-3.5 w-3.5" />
            {saving ? "Saving..." : t("adminPublishLive")}
          </button>

          {!isNew && (
            <button
              type="button"
              onClick={handleOpenBroadcast}
              className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/20 transition-colors shadow-xs"
              title="Broadcast this news story to newsletter subscribers"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Send to Subscribers</span>
            </button>
          )}

          {!isNew && (
            <a
              href={`/#/article/${slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              {t("views")}
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

          {/* ── YouTube Video Article Integration ──────────────── */}
          <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-600/10 text-red-600 border border-red-600/20 font-bold">
                  <Video className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                    <span>YouTube Video Article</span>
                    {youtubeVideoId && (
                      <span className="rounded-full bg-red-600 px-2 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider">
                        Linked
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {youtubeVideoId
                      ? "This article embeds a responsive YouTube video player."
                      : "Choose from your YouTube video list or paste a link to turn this into a video article."}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setYoutubeModalOpen(true)}
                className="flex items-center gap-1.5 rounded-xl border border-red-600/30 bg-red-600/10 px-3.5 py-2 text-xs font-bold text-red-600 hover:bg-red-600/20 transition-all cursor-pointer shrink-0"
              >
                <Video className="h-3.5 w-3.5" />
                <span>{youtubeVideoId ? "Change Video" : "🎬 Choose from YouTube Video List"}</span>
              </button>
            </div>

            {/* Active Video Preview Player */}
            {youtubeVideoId && (
              <div className="mt-3 rounded-xl border border-border bg-neutral-950/40 p-3.5 space-y-3">
                <div className="aspect-video w-full overflow-hidden rounded-lg bg-black border border-border/60">
                  <iframe
                    src={getYouTubeEmbedUrl(youtubeVideoId)}
                    title="YouTube Video Preview"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="h-full w-full border-0"
                  />
                </div>

                <div className="flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono text-[11px] text-muted-foreground">ID: {youtubeVideoId}</span>
                    {videoUrl && (
                      <a
                        href={videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center gap-1 truncate"
                      >
                        <span>View on YouTube</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setYoutubeVideoId("");
                      setVideoUrl("");
                      toast.info("Video link removed.");
                    }}
                    className="text-xs font-semibold text-destructive hover:underline cursor-pointer"
                  >
                    Remove Video
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Cover Image */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Cover Image
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
          <div className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-6 shadow-xs">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                Publication Status <span className="text-destructive">*</span>
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setPublished(true)}
                  className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-all cursor-pointer ${
                    published
                      ? "border-green-500 bg-green-500/10 text-foreground ring-2 ring-green-500/30"
                      : "border-border bg-muted/20 text-muted-foreground hover:bg-muted/40"
                  }`}
                >
                  <Eye
                    className={`h-5 w-5 mt-0.5 shrink-0 ${
                      published ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
                    }`}
                  />
                  <div>
                    <span className="font-bold text-sm block text-foreground">
                      Publish Immediately (Live)
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Visible to all readers across the homepage, category pages, and search.
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPublished(false)}
                  className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-all cursor-pointer ${
                    !published
                      ? "border-amber-500 bg-amber-500/10 text-foreground ring-2 ring-amber-500/30"
                      : "border-border bg-muted/20 text-muted-foreground hover:bg-muted/40"
                  }`}
                >
                  <EyeOff
                    className={`h-5 w-5 mt-0.5 shrink-0 ${
                      !published ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"
                    }`}
                  />
                  <div>
                    <span className="font-bold text-sm block text-foreground">Save as Draft</span>
                    <span className="text-xs text-muted-foreground">
                      Hidden from readers; only visible and editable by admins.
                    </span>
                  </div>
                </button>
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                Special Placements & Features
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6 flex-wrap">
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
                  <span>Featured Hero Headline</span>
                </label>

                <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-foreground">
                  <input
                    type="checkbox"
                    checked={breaking}
                    onChange={(e) => setBreaking(e.target.checked)}
                    className="h-4 w-4 rounded border-border accent-primary"
                  />
                  <Zap className={`h-4 w-4 ${breaking ? "text-red-500" : "text-muted-foreground"}`} />
                  <span>Breaking News Ticker</span>
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
                  <span>Most Read Column</span>
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
                  <span>Opinion / Editorial</span>
                </label>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between gap-3 border-t border-border pt-6 flex-wrap">
            <Link
              to="/admin/articles/"
              className="rounded-xl border border-border px-5 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {t("backHome")}
            </Link>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleSaveWithStatus(false)}
                disabled={saving}
                className="flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground shadow-xs transition-colors hover:bg-muted disabled:opacity-50"
              >
                <EyeOff className="h-4 w-4 text-muted-foreground" />
                <span>{saving ? "Saving..." : t("adminSaveDraft")}</span>
              </button>

              <button
                type="button"
                onClick={() => handleSaveWithStatus(true)}
                disabled={saving}
                className="flex items-center gap-2 rounded-xl bg-green-600 px-6 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:bg-green-700 disabled:opacity-50 cursor-pointer"
              >
                <Eye className="h-4 w-4" />
                <span>
                  {saving
                    ? "Publishing..."
                    : isNew
                    ? t("adminPublishLive")
                    : `${t("adminEditMode")} & ${t("adminPublishLive")}`}
                </span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Newsletter Broadcast Modal */}
      <BroadcastModal
        open={broadcastOpen}
        onClose={() => setBroadcastOpen(false)}
        article={{
          id,
          title,
          excerpt,
          slug,
          image,
          section,
          author,
          readTime: estimateReadTime(content),
        }}
        subscribers={subscribers}
      />

      {/* YouTube Video Selection Modal */}
      <YouTubeModal
        open={youtubeModalOpen}
        onOpenChange={setYoutubeModalOpen}
        onSelectVideo={handleSelectYouTubeVideo}
        currentVideoId={youtubeVideoId}
      />
    </div>
  );
}
