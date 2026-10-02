import { useState } from "react";
import {
  scrapeArticle,
  isValidUrl,
  type ScrapedArticle,
} from "@/lib/scraper-service";
import {
  Globe,
  Download,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  FileText,
  Image as ImageIcon,
  User,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";

interface ArticleImportModalProps {
  open: boolean;
  onClose: () => void;
  onImport: (article: ScrapedArticle) => void;
}

const SAMPLE_SOURCES = [
  { name: "ENA (ኢዜአ)", domain: "ena.et" },
  { name: "BBC News", domain: "bbc.com" },
  { name: "Fana BC", domain: "fanabc.com" },
  { name: "Reuters", domain: "reuters.com" },
];

export function ArticleImportModal({
  open,
  onClose,
  onImport,
}: ArticleImportModalProps) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scrapedData, setScrapedData] = useState<ScrapedArticle | null>(null);

  if (!open) return null;

  const handleFetch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    const targetUrl = url.trim();

    if (!targetUrl) {
      setError("Please paste a valid web URL.");
      return;
    }

    if (!isValidUrl(targetUrl)) {
      setError("URL must start with http:// or https://");
      return;
    }

    setLoading(true);
    setScrapedData(null);
    const toastId = toast.loading("Scraping article content...");

    try {
      const data = await scrapeArticle(targetUrl);
      setScrapedData(data);
      toast.success("Article successfully scraped!", { id: toastId });
    } catch (err: any) {
      console.error("Scraper error:", err);
      const msg = err?.message || "Failed to scrape the specified webpage.";
      setError(msg);
      toast.error(msg, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (!scrapedData) return;
    onImport(scrapedData);
    toast.success("Imported article content into editor!");
    onClose();
  };

  const handleReset = () => {
    setUrl("");
    setScrapedData(null);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
      <div
        className="fixed inset-0"
        onClick={() => {
          if (!loading) onClose();
        }}
      />

      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border border-border bg-card shadow-2xl overflow-hidden z-10 animate-in fade-in-0 zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-muted/30">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <span>Web Scraper — Import Article</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 text-primary text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider">
                  <Sparkles className="h-3 w-3" /> Auto Extract
                </span>
              </h2>
              <p className="text-xs text-muted-foreground">
                Paste any article or news URL to extract headline, image, summary, and text.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-50"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* URL Input Form */}
          <form onSubmit={handleFetch} className="space-y-2">
            <label className="text-xs font-bold text-foreground">
              Article Webpage URL
            </label>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative flex-1">
                <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="url"
                  required
                  placeholder="https://www.ena.et/article-slug or https://www.bbc.com/..."
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    if (error) setError(null);
                  }}
                  className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={loading || !url.trim()}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-xs hover:bg-primary/90 transition-all disabled:opacity-50 shrink-0 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Scraping...</span>
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    <span>Fetch & Scrape</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick Suggestions */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[11px] text-muted-foreground">
              <span className="font-semibold">Compatible sources:</span>
              {SAMPLE_SOURCES.map((s) => (
                <span
                  key={s.domain}
                  className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-mono border border-border/60"
                >
                  {s.name}
                </span>
              ))}
              <span>+ any standard news URL</span>
            </div>
          </form>

          {/* Error Message */}
          {error && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 flex items-start gap-2.5 text-xs text-destructive dark:text-red-400 animate-fade-in">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold">Scraping Unsuccessful</p>
                <p>{error}</p>
              </div>
            </div>
          )}

          {/* Loading Indicator */}
          {loading && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-8 flex flex-col items-center justify-center gap-3 text-center animate-pulse">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <div>
                <p className="text-sm font-bold text-foreground">Scraping Webpage...</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Downloading HTML, bypassing CORS, and extracting clean article paragraphs.
                </p>
              </div>
            </div>
          )}

          {/* Scraped Content Preview */}
          {scrapedData && (
            <div className="space-y-4 rounded-xl border border-border bg-muted/20 p-4 animate-fade-in">
              <div className="flex items-center justify-between border-b border-border/80 pb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-xs font-bold text-foreground">
                    Extracted Article Preview
                  </span>
                </div>
                {scrapedData.sourceUrl && (
                  <a
                    href={scrapedData.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-primary hover:underline flex items-center gap-1"
                  >
                    <span>Original Source</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>

              {/* Cover Image Preview */}
              {scrapedData.image && (
                <div className="relative aspect-video max-h-48 w-full overflow-hidden rounded-xl border border-border bg-black/40">
                  <img
                    src={scrapedData.image}
                    alt={scrapedData.title}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                  <div className="absolute bottom-2 left-2 rounded-md bg-black/75 px-2 py-0.5 text-[10px] text-white flex items-center gap-1">
                    <ImageIcon className="h-3 w-3" />
                    <span>Featured Image Found</span>
                  </div>
                </div>
              )}

              {/* Title */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Headline / Title
                </span>
                <p className="text-base font-bold text-foreground leading-snug">
                  {scrapedData.title}
                </p>
              </div>

              {/* Meta Attribution */}
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                {scrapedData.author && (
                  <div className="flex items-center gap-1">
                    <User className="h-3.5 w-3.5" />
                    <span>{scrapedData.author}</span>
                  </div>
                )}
                {scrapedData.sourceName && (
                  <div className="flex items-center gap-1">
                    <Globe className="h-3.5 w-3.5" />
                    <span>{scrapedData.sourceName}</span>
                  </div>
                )}
              </div>

              {/* Excerpt */}
              {scrapedData.excerpt && (
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Summary / Excerpt
                  </span>
                  <p className="text-xs text-muted-foreground line-clamp-3 bg-background/80 p-2.5 rounded-lg border border-border/60">
                    {scrapedData.excerpt}
                  </p>
                </div>
              )}

              {/* Content Preview */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                  <span>Body Content Preview</span>
                  <span className="font-normal lowercase">
                    {scrapedData.content.length > 0
                      ? `${Math.round(scrapedData.content.length / 5)} words estimated`
                      : "No text found"}
                  </span>
                </span>
                <div
                  className="text-xs text-foreground/80 max-h-40 overflow-y-auto bg-background/80 p-3 rounded-lg border border-border/60 space-y-2 prose dark:prose-invert prose-xs"
                  dangerouslySetInnerHTML={{
                    __html:
                      scrapedData.content || "<p>No body text extracted.</p>",
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-border px-6 py-3.5 bg-muted/20">
          <div>
            {scrapedData && (
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="h-3 w-3" />
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={!scrapedData}
              onClick={handleApply}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2 text-xs font-bold text-primary-foreground shadow-xs hover:bg-primary/90 transition-all disabled:opacity-40 cursor-pointer"
            >
              <CheckCircle2 className="h-4 w-4" />
              Import into Editor
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
