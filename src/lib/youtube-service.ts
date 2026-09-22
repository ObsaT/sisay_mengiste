/**
 * YouTube integration service for video news and articles.
 * Allows fetching metadata, thumbnails, embed URLs, and managing video lists.
 */

export interface YouTubeVideoItem {
  id: string; // 11-char video ID
  title: string;
  authorName?: string;
  thumbnailUrl: string;
  videoUrl: string;
  publishedDate?: string;
}

// Saved YouTube video list (starts empty so user only adds their own channel content)
export const DEFAULT_YOUTUBE_VIDEOS: YouTubeVideoItem[] = [];

const YOUTUBE_LIST_STORAGE_KEY = "reporter_youtube_video_list";

/**
 * Extracts 11-character YouTube video ID from various YouTube URL formats.
 */
export function extractYouTubeVideoId(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();

  // If already an 11-char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // Regex covering standard watch?v=, youtu.be, embed, shorts, live
  const match = trimmed.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/|live\/))([a-zA-Z0-9_-]{11})/i,
  );

  return match ? match[1] : null;
}

/**
 * Get YouTube embed URL with privacy enhancements.
 */
export function getYouTubeEmbedUrl(videoId: string, autoplay = false): string {
  return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=${autoplay ? 1 : 0}&rel=0`;
}

/**
 * Get YouTube thumbnail image URL.
 */
export function getYouTubeThumbnailUrl(
  videoId: string,
  quality: "max" | "hq" | "mq" = "max",
): string {
  const qualityMap = {
    max: "maxresdefault",
    hq: "hqdefault",
    mq: "mqdefault",
  };
  return `https://img.youtube.com/vi/${videoId}/${qualityMap[quality]}.jpg`;
}

/**
 * Fetch video metadata (title, author, thumbnail) using public oEmbed without API key.
 */
export async function fetchYouTubeVideoDetails(urlOrId: string): Promise<YouTubeVideoItem> {
  const videoId = extractYouTubeVideoId(urlOrId);
  if (!videoId) {
    throw new Error("Invalid YouTube video URL or ID.");
  }

  const standardUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const fallbackThumbnail = getYouTubeThumbnailUrl(videoId, "hq");

  try {
    const oembedUrl = `https://noembed.com/embed?url=${encodeURIComponent(standardUrl)}`;
    const res = await fetch(oembedUrl);
    if (res.ok) {
      const data = await res.json();
      if (data && !data.error) {
        return {
          id: videoId,
          title: data.title || "YouTube Video",
          authorName: data.author_name || "YERAS Media Network",
          thumbnailUrl: data.thumbnail_url || fallbackThumbnail,
          videoUrl: standardUrl,
        };
      }
    }
  } catch {
    // ignore, fall through to fallback
  }

  return {
    id: videoId,
    title: `YouTube Video (${videoId})`,
    authorName: "YERAS Media Network",
    thumbnailUrl: fallbackThumbnail,
    videoUrl: standardUrl,
  };
}

/**
 * Get saved list of YouTube videos from localStorage.
 */
export function getSavedYouTubeVideos(): YouTubeVideoItem[] {
  try {
    const raw = localStorage.getItem(YOUTUBE_LIST_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Save custom list of YouTube videos to localStorage.
 */
export function saveYouTubeVideos(videos: YouTubeVideoItem[]): void {
  try {
    localStorage.setItem(YOUTUBE_LIST_STORAGE_KEY, JSON.stringify(videos));
  } catch {
    // ignore
  }
}
