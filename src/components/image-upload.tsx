import { useRef, useState, type DragEvent, type ChangeEvent } from "react";
import { Upload, X, ImageIcon, Loader2, Cloud, Settings, ExternalLink } from "lucide-react";
import { uploadArticleImage } from "@/lib/storage-service";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
}

export function ImageUpload({ value, onChange }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  // Local config override if user wants to set it directly in UI
  const [cloudName, setCloudName] = useState(
    () => localStorage.getItem("cloudinary_cloud_name") || "",
  );
  const [preset, setPreset] = useState(
    () => localStorage.getItem("cloudinary_upload_preset") || "",
  );

  const saveSettings = () => {
    if (cloudName.trim()) localStorage.setItem("cloudinary_cloud_name", cloudName.trim());
    if (preset.trim()) localStorage.setItem("cloudinary_upload_preset", preset.trim());
    setShowSettings(false);
  };

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file (JPG, PNG, WebP, etc.)");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("File too large. Maximum 10 MB.");
      return;
    }
    setError(null);
    setUploading(true);
    setProgress(0);
    try {
      const url = await uploadArticleImage(file, setProgress);
      onChange(url);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Upload failed.";
      setError(
        `${msg} Set your Cloudinary Cloud Name & Unsigned Preset in .env or click the settings cog above.`,
      );
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) void handleFile(file);
  };

  const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void handleFile(file);
  };

  return (
    <div className="space-y-3">
      {/* Provider badge and settings toggle */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Cloud className="h-3.5 w-3.5 text-primary" />
          <span className="font-semibold text-foreground">Cloudinary CDN Storage</span>
          <span className="text-[10px] text-green-600 font-bold bg-green-50 dark:bg-green-950/40 px-1.5 py-0.2 rounded">
            Auto-Optimized
          </span>
        </div>
        <button
          type="button"
          onClick={() => setShowSettings((v) => !v)}
          className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors"
        >
          <Settings className="h-3 w-3" />
          <span>Cloudinary Settings</span>
        </button>
      </div>

      {/* Cloudinary Inline Config Form */}
      {showSettings && (
        <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-3 text-xs animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="font-bold text-foreground">Cloudinary Configuration</span>
            <a
              href="https://cloudinary.com/documentation/upload_presets"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline flex items-center gap-0.5"
            >
              How to get an unsigned preset <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          <p className="text-muted-foreground text-[11px]">
            You can set these in <code className="bg-muted px-1 rounded">.env</code> as{" "}
            <code className="bg-muted px-1 rounded">VITE_CLOUDINARY_CLOUD_NAME</code> and{" "}
            <code className="bg-muted px-1 rounded">VITE_CLOUDINARY_UPLOAD_PRESET</code>, or enter
            them here:
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <label className="block mb-1 font-medium">Cloud Name:</label>
              <input
                type="text"
                placeholder="e.g. my-news-cloud"
                value={cloudName}
                onChange={(e) => setCloudName(e.target.value)}
                className="w-full rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-foreground outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block mb-1 font-medium">Unsigned Preset Name:</label>
              <input
                type="text"
                placeholder="e.g. ml_default or articles"
                value={preset}
                onChange={(e) => setPreset(e.target.value)}
                className="w-full rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-foreground outline-none focus:border-primary"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={saveSettings}
            className="rounded-lg bg-primary px-3 py-1 font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Save Settings
          </button>
        </div>
      )}

      {value ? (
        <div className="group relative overflow-hidden rounded-xl border border-border shadow-sm">
          <img
            src={value}
            alt="Cover preview"
            className="h-52 w-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-foreground shadow transition-transform hover:scale-105"
              >
                <Upload className="h-3.5 w-3.5" /> Replace
              </button>
              <button
                type="button"
                onClick={() => onChange("")}
                className="flex items-center gap-1.5 rounded-lg bg-destructive px-3 py-1.5 text-xs font-semibold text-white shadow transition-transform hover:scale-105"
              >
                <X className="h-3.5 w-3.5" /> Remove
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          onClick={() => !uploading && inputRef.current?.click()}
          className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-all cursor-pointer ${
            isDragging
              ? "border-primary bg-primary/10"
              : "border-border bg-card hover:border-primary/50 hover:bg-muted/30"
          } ${uploading ? "pointer-events-none opacity-60" : ""}`}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <div className="w-48">
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-primary transition-all duration-200"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="mt-1.5 text-xs font-bold text-primary">{progress}% uploaded...</p>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Cloud className="h-6 w-6" />
              </div>
              <p className="text-sm font-bold text-foreground">
                Drag & drop cover image here, or{" "}
                <span className="text-primary underline">browse</span>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                JPG, PNG, WebP or GIF up to 10 MB. Auto-compressed by Cloudinary.
              </p>
            </>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={onInputChange}
        className="hidden"
      />

      {/* URL Input Fallback */}
      <div className="flex items-center gap-2">
        <ImageIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          type="url"
          placeholder="Or paste an image URL directly (e.g. https://res.cloudinary.com/...)"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-border bg-card px-3 py-2 text-xs text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
        />
      </div>

      {error && <p className="text-xs font-medium text-destructive">{error}</p>}
    </div>
  );
}
