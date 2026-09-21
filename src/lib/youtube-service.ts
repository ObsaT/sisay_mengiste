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

// Curated default video list from Ethiopian Reporter / Sisay Mengiste Media
export const DEFAULT_YOUTUBE_VIDEOS: YouTubeVideoItem[] = [
  {
    id: "gU5n77mR-6I",
    title: "የኢትዮጵያ ሪፖርተር ሳምንታዊ የዜና እና ወቅታዊ ጉዳዮች ትንታኔ",
    authorName: "The Reporter Ethiopia",
    thumbnailUrl: "https://img.youtube.com/vi/gU5n77mR-6I/hqdefault.jpg",
    videoUrl: "https://www.youtube.com/watch?v=gU5n77mR-6I",
  },
  {
    id: "jNQXAC9IVRw",
    title: "የወቅታዊ የኢኮኖሚ እና ፖለቲካዊ ሁነቶች ዳሰሳ — ልዩ ቆይታ",
    authorName: "The Reporter Ethiopia",
    thumbnailUrl: "https://img.youtube.com/vi/jNQXAC9IVRw/hqdefault.jpg",
    videoUrl: "https://www.youtube.com/watch?v=jNQXAC9IVRw",
  },
  {
    id: "kJQP7kiw5Fk",
    title: "የቀጣናው የዲፕሎማሲ ግንኙነት እና የሰላም ስምምነት አፈጻጸም ሂደት",
    authorName: "The Reporter Ethiopia",
    thumbnailUrl: "https://img.youtube.com/vi/kJQP7kiw5Fk/hqdefault.jpg",
    videoUrl: "https://www.youtube.com/watch?v=kJQP7kiw5Fk",
  },
];

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
          authorName: data.author_name || "The Reporter Ethiopia",
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
    authorName: "The Reporter Ethiopia",
    thumbnailUrl: fallbackThumbnail,
    videoUrl: standardUrl,
  };
}

/**
 * Get saved list of YouTube videos from localStorage with defaults.
 */
export function getSavedYouTubeVideos(): YouTubeVideoItem[] {
  try {
    const raw = localStorage.getItem(YOUTUBE_LIST_STORAGE_KEY);
    if (!raw) return DEFAULT_YOUTUBE_VIDEOS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_YOUTUBE_VIDEOS;
  } catch {
    return DEFAULT_YOUTUBE_VIDEOS;
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
