import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  extractYouTubeVideoId,
  fetchYouTubeVideoDetails,
  getSavedYouTubeVideos,
  saveYouTubeVideos,
  getYouTubeEmbedUrl,
  type YouTubeVideoItem,
} from "@/lib/youtube-service";
import {
  Play,
  Search,
  Plus,
  Trash2,
  ExternalLink,
  Check,
  Video,
  Loader2,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

interface YouTubeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectVideo: (video: YouTubeVideoItem) => void;
  currentVideoId?: string;
}

export function YouTubeModal({
  open,
  onOpenChange,
  onSelectVideo,
  currentVideoId,
}: YouTubeModalProps) {
  const [activeTab, setActiveTab] = useState<"list" | "link">("list");
  const [videoList, setVideoList] = useState<YouTubeVideoItem[]>(getSavedYouTubeVideos);
  const [searchQuery, setSearchQuery] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [fetching, setFetching] = useState(false);
  const [previewVideo, setPreviewVideo] = useState<YouTubeVideoItem | null>(null);

  // New video input for adding to the list
  const [newVideoInput, setNewVideoInput] = useState("");
  const [addingToList, setAddingToList] = useState(false);

  // Filter video list by search query
  const filteredVideos = videoList.filter((v) =>
    searchQuery
      ? v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (v.authorName && v.authorName.toLowerCase().includes(searchQuery.toLowerCase()))
      : true,
  );

  // Handle fetching single link for direct use or preview
  const handleFetchLink = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const videoId = extractYouTubeVideoId(urlInput);
    if (!videoId) {
      toast.error("Please enter a valid YouTube video URL or ID.");
      return;
    }

    setFetching(true);
    try {
      const details = await fetchYouTubeVideoDetails(videoId);
      setPreviewVideo(details);
      toast.success("Video metadata retrieved successfully!");
    } catch {
      toast.error("Could not fetch video details from YouTube.");
    } finally {
      setFetching(false);
    }
  };

  // Handle adding a video to the reusable library list
  const handleAddVideoToList = async (e: React.FormEvent) => {
    e.preventDefault();
    const videoId = extractYouTubeVideoId(newVideoInput);
    if (!videoId) {
      toast.error("Please enter a valid YouTube video URL or ID to add.");
      return;
    }

    // Check if already in list
    if (videoList.some((v) => v.id === videoId)) {
      toast.info("This video is already in your video list.");
      setNewVideoInput("");
      return;
    }

    setAddingToList(true);
    try {
      const details = await fetchYouTubeVideoDetails(videoId);
      const updated = [details, ...videoList];
      setVideoList(updated);
      saveYouTubeVideos(updated);
      setNewVideoInput("");
      toast.success("Added to YouTube Video List!");
    } catch {
      toast.error("Failed to add video to list.");
    } finally {
      setAddingToList(false);
    }
  };

  // Remove video from saved library
  const handleRemoveFromList = (idToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = videoList.filter((v) => v.id !== idToRemove);
    setVideoList(updated);
    saveYouTubeVideos(updated);
    toast.success("Video removed from library.");
  };

  const handleClearList = () => {
    setVideoList([]);
    saveYouTubeVideos([]);
    toast.success("All videos cleared from library.");
  };

  const handleSelect = (video: YouTubeVideoItem) => {
    onSelectVideo(video);
    onOpenChange(false);
    toast.success(`Selected video: "${video.title.slice(0, 45)}..."`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-0 overflow-hidden bg-card border-border">
        {/* Header */}
        <div className="p-5 border-b border-border/70 bg-muted/20">
          <DialogHeader>
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-600/10 text-red-600 border border-red-600/20">
                <Video className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base sm:text-lg font-bold">
                  YouTube Video Article Selector
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Select a video from your YouTube video list or paste a link to embed in the article.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 mt-4">
            <button
              type="button"
              onClick={() => setActiveTab("list")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "list"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              <Video className="h-3.5 w-3.5" />
              <span>Channel Video List ({videoList.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("link")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "link"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Paste Video URL / ID</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Video List */}
        {activeTab === "list" && (
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* Quick Add video to list & search bar */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search in video list..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-3 text-xs text-foreground outline-none focus:border-primary"
                />
              </div>

              {/* Add URL to this list form */}
              <form onSubmit={handleAddVideoToList} className="flex gap-1.5 shrink-0">
                <input
                  type="text"
                  placeholder="Paste YouTube link to add to list..."
                  value={newVideoInput}
                  onChange={(e) => setNewVideoInput(e.target.value)}
                  className="w-48 sm:w-60 rounded-xl border border-border bg-background py-2 px-3 text-xs text-foreground outline-none focus:border-primary"
                />
                <button
                  type="submit"
                  disabled={addingToList || !newVideoInput.trim()}
                  className="flex items-center gap-1 rounded-xl bg-primary/10 border border-primary/20 px-3 py-2 text-xs font-bold text-primary hover:bg-primary/20 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {addingToList ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Plus className="h-3.5 w-3.5" />
                  )}
                  <span>Add</span>
                </button>
              </form>
            </div>

            {videoList.length > 0 && (
              <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                <span>{videoList.length} {videoList.length === 1 ? "video" : "videos"} in your list</span>
                <button
                  type="button"
                  onClick={handleClearList}
                  className="text-[11px] text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="h-3 w-3" />
                  <span>Clear All</span>
                </button>
              </div>
            )}

            {/* Video Cards Grid */}
            {filteredVideos.length === 0 ? (
              <div className="py-12 text-center rounded-xl border border-dashed border-border bg-muted/20">
                <Video className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                <p className="text-xs font-semibold text-foreground">No videos in your list yet</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Paste a YouTube video link above or use the &ldquo;Paste Video URL&rdquo; tab to add your channel&apos;s videos.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {filteredVideos.map((video) => {
                  const isCurrent = currentVideoId === video.id;
                  return (
                    <div
                      key={video.id}
                      onClick={() => handleSelect(video)}
                      className={`group relative flex flex-col rounded-xl border p-2.5 transition-all cursor-pointer ${
                        isCurrent
                          ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                          : "border-border bg-card hover:border-primary/50 hover:shadow-xs"
                      }`}
                    >
                      {/* Video Thumbnail with Play Overlay */}
                      <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
                        <img
                          src={video.thumbnailUrl}
                          alt={video.title}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/25 group-hover:bg-black/10 transition-colors">
                          <div className="rounded-full bg-red-600 p-2 text-white shadow-md transition-transform group-hover:scale-110">
                            <Play className="h-4 w-4 fill-white" />
                          </div>
                        </div>

                        {/* Top corner ID badge */}
                        <span className="absolute bottom-1.5 right-1.5 rounded bg-black/80 px-1.5 py-0.5 text-[9px] font-mono font-semibold text-white">
                          {video.id}
                        </span>

                        {isCurrent && (
                          <span className="absolute top-1.5 left-1.5 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white flex items-center gap-1 shadow">
                            <Check className="h-3 w-3" /> Selected
                          </span>
                        )}
                      </div>

                      {/* Video Details */}
                      <div className="mt-2.5 flex-1 flex flex-col justify-between">
                        <div>
                          <h4 className="text-xs font-bold text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                            {video.title}
                          </h4>
                          {video.authorName && (
                            <p className="text-[10px] text-muted-foreground mt-1">
                              {video.authorName}
                            </p>
                          )}
                        </div>

                        <div className="mt-3 pt-2 border-t border-border/60 flex items-center justify-between">
                          <button
                            type="button"
                            onClick={(e) => handleRemoveFromList(video.id, e)}
                            className="p-1 text-muted-foreground/60 hover:text-destructive transition-colors rounded"
                            title="Remove from list"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>

                          <span className="text-[11px] font-bold text-primary group-hover:underline flex items-center gap-1">
                            <span>Use This Video</span>
                            <Check className="h-3 w-3" />
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Paste Link / Quick Import */}
        {activeTab === "link" && (
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <form onSubmit={handleFetchLink} className="space-y-3">
              <label className="block text-xs font-bold text-foreground">
                YouTube Video URL or Video ID
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="flex-1 rounded-xl border border-border bg-background py-2.5 px-3.5 text-xs text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                />
                <button
                  type="submit"
                  disabled={fetching || !urlInput.trim()}
                  className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-xs hover:bg-primary/90 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {fetching ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5" />
                  )}
                  <span>Fetch Video</span>
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Supports regular video links, short links (youtu.be), YouTube Shorts, and embed links.
              </p>
            </form>

            {/* Live Video Preview Box */}
            {previewVideo && (
              <div className="rounded-2xl border border-border bg-card p-4 space-y-4 shadow-sm animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">Video Preview</span>
                  <a
                    href={previewVideo.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                  >
                    <span>Open in YouTube</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>

                {/* Embedded Player */}
                <div className="aspect-video w-full overflow-hidden rounded-xl bg-black border border-border">
                  <iframe
                    src={getYouTubeEmbedUrl(previewVideo.id)}
                    title={previewVideo.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="h-full w-full border-0"
                  />
                </div>

                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-foreground">{previewVideo.title}</h4>
                  <p className="text-xs text-muted-foreground">{previewVideo.authorName}</p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
                  <button
                    type="button"
                    onClick={() => handleSelect(previewVideo)}
                    className="flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-xs hover:bg-primary/90 transition-all cursor-pointer"
                  >
                    <Check className="h-4 w-4" />
                    <span>Apply to Article</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
