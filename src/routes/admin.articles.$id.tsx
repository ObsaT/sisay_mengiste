import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  createArticle,
  getArticle,
  updateArticle,
  type ArticleInput,
} from "@/lib/firestore-service";
import { NAV } from "@/lib/news-data";
import {
  Save,
  ArrowLeft,
  Eye,
  EyeOff,
  Star,
  Image,
  Zap,
  TrendingUp,
  MessageSquare,
} from "lucide-react";

export const Route = createFileRoute("/admin/articles/$id")({
  component: ArticleEditor,
});

const SECTIONS = NAV.filter((n) => n.slug).map((n) => ({
  value: n.slug,
  label: n.label,
}));

function ArticleEditor() {
  const { id } = Route.useParams();
  const isNew = id === "new";
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [section, setSection] = useState("news");
  const [author, setAuthor] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState("");
  const [featured, setFeatured] = useState(false);
  const [published, setPublished] = useState(false);
  const [breaking, setBreaking] = useState(false);
  const [mostRead, setMostRead] = useState(false);
  const [opinion, setOpinion] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!isNew);

  useEffect(() => {
    if (!isNew) {
      getArticle(id)
        .then((article) => {
          if (article) {
            setTitle(article.title);
            setSection(article.section);
            setAuthor(article.author);
            setExcerpt(article.excerpt);
            setContent(article.content || "");
            setImage(article.image);
            setFeatured(article.featured);
            setPublished(article.published);
            setBreaking(article.breaking);
            setMostRead(article.mostRead);
            setOpinion(article.opinion);
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [id, isNew]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const data: ArticleInput = {
      title,
      section,
      author,
      excerpt,
      content,
      image,
      featured,
      published,
      breaking,
      mostRead,
      opinion,
    };

    try {
      if (isNew) {
        const newId = await createArticle(data);
        navigate({ to: "/admin/articles/$id", params: { id: newId } });
      } else {
        await updateArticle(id, data);
        alert("Article updated successfully!");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to save article.");
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

  return (
    <div className="mx-auto max-w-3xl">
      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <Link
          to="/admin/articles"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border transition-colors hover:bg-muted"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {isNew ? "New Article" : "Edit Article"}
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {isNew ? "Create a new news article" : "Update article details"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Title *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter article title"
            required
            className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Section + Author */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Section *
            </label>
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
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Author *
            </label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Author name"
              required
              className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        {/* Image URL */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Image URL
          </label>
          <div className="relative">
            <Image className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="url"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="w-full rounded-lg border border-border bg-card py-2.5 pl-10 pr-4 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          {image && (
            <div className="mt-2 overflow-hidden rounded-lg border border-border">
              <img
                src={image}
                alt="Preview"
                className="h-40 w-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
          )}
        </div>

        {/* Excerpt */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Excerpt / Summary *
          </label>
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder="Brief summary of the article..."
            required
            rows={3}
            className="w-full resize-none rounded-lg border border-border bg-card px-4 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Content */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Full Content
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write the full article content here..."
            rows={12}
            className="w-full resize-y rounded-lg border border-border bg-card px-4 py-3 font-mono text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Toggles */}
        <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/30 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-foreground">
              <input
                type="checkbox"
                checked={published}
                onChange={(e) => setPublished(e.target.checked)}
                className="h-4 w-4 rounded border-border accent-primary"
              />
              {published ? <Eye className="h-4 w-4 text-green-500" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
              {published ? "Published" : "Draft"}
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-foreground">
              <input
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                className="h-4 w-4 rounded border-border accent-primary"
              />
              <Star className={`h-4 w-4 ${featured ? "text-yellow-500" : "text-muted-foreground"}`} />
              Featured
            </label>
          </div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground pt-2">Placement</p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-foreground">
              <input
                type="checkbox"
                checked={breaking}
                onChange={(e) => setBreaking(e.target.checked)}
                className="h-4 w-4 rounded border-border accent-primary"
              />
              <Zap className={`h-4 w-4 ${breaking ? "text-red-500" : "text-muted-foreground"}`} />
              Breaking News ticker
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-foreground">
              <input
                type="checkbox"
                checked={mostRead}
                onChange={(e) => setMostRead(e.target.checked)}
                className="h-4 w-4 rounded border-border accent-primary"
              />
              <TrendingUp className={`h-4 w-4 ${mostRead ? "text-blue-500" : "text-muted-foreground"}`} />
              Most Read sidebar
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-foreground">
              <input
                type="checkbox"
                checked={opinion}
                onChange={(e) => setOpinion(e.target.checked)}
                className="h-4 w-4 rounded border-border accent-primary"
              />
              <MessageSquare className={`h-4 w-4 ${opinion ? "text-purple-500" : "text-muted-foreground"}`} />
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
            to="/admin/articles"
            className="rounded-lg border border-border px-6 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
