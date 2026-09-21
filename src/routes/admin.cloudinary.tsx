import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/language-context";
import {
  getLocalCloudinarySettings,
  saveCloudinarySettingsToFirestore,
  fetchCloudinarySettingsFromFirestore,
  type CloudinarySettings,
  DEFAULT_CLOUDINARY_SETTINGS,
} from "@/lib/cloudinary-settings";
import {
  Cloud,
  Save,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  RotateCcw,
  Sparkles,
  Zap,
  Info,
  ShieldCheck,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/cloudinary")({
  component: AdminCloudinaryPage,
});

function AdminCloudinaryPage() {
  const { t } = useLanguage();
  const [formData, setFormData] = useState<CloudinarySettings>(getLocalCloudinarySettings);
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    details?: string;
  } | null>(null);

  useEffect(() => {
    fetchCloudinarySettingsFromFirestore().then((settings) => {
      setFormData(settings);
      setHasChanges(false);
    });
  }, []);

  const handleChange = (field: keyof CloudinarySettings, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
    setTestResult(null);
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formData.cloudName.trim()) {
      toast.error("Cloud Name cannot be empty.");
      return;
    }
    if (!formData.uploadPreset.trim()) {
      toast.error("Upload Preset cannot be empty.");
      return;
    }

    setSaving(true);
    const toastId = toast.loading("Saving Cloudinary configuration...");
    try {
      await saveCloudinarySettingsToFirestore(formData);
      setHasChanges(false);
      toast.success("Cloudinary settings saved successfully!", { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error("Saved locally. (Firestore permission notice)", { id: toastId });
      setHasChanges(false);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setFormData(DEFAULT_CLOUDINARY_SETTINGS);
    setHasChanges(true);
    setTestResult(null);
    toast.info("Reset to default settings in form.");
  };

  const handleTestConnection = async () => {
    const cloudName = formData.cloudName.trim();
    const preset = formData.uploadPreset.trim();

    if (!cloudName || !preset) {
      toast.error("Please enter both Cloud Name and Upload Preset.");
      return;
    }

    setTesting(true);
    setTestResult(null);
    const toastId = toast.loading("Testing connection to Cloudinary...");

    try {
      // 1x1 transparent PNG sample for testing
      const base64Data =
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
      const res = await fetch(base64Data);
      const blob = await res.blob();
      const testFile = new File([blob], "test-connection.png", { type: "image/png" });

      const body = new FormData();
      body.append("file", testFile);
      body.append("upload_preset", preset);
      if (formData.folder) body.append("folder", formData.folder);

      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: "POST",
        body,
      });

      const data = await response.json();

      if (response.ok && data.secure_url) {
        setTestResult({
          success: true,
          message: "Connection Successful!",
          details: `Connected to "${cloudName}" using preset "${preset}". Auto CDN active.`,
        });
        toast.success("Cloudinary connection verified!", { id: toastId });
      } else {
        const errorMsg = data?.error?.message || `Failed with HTTP status ${response.status}`;
        setTestResult({
          success: false,
          message: "Connection Test Failed",
          details: errorMsg,
        });
        toast.error(`Test failed: ${errorMsg}`, { id: toastId });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: "Network or Configuration Error",
        details: err?.message || "Could not reach api.cloudinary.com.",
      });
      toast.error("Connection test failed.", { id: toastId });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* ── Header ────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Cloud className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Cloudinary Image Storage
              </h1>
              <p className="text-sm text-muted-foreground">
                Configure Cloud Name and Unsigned Upload Preset for optimized article image hosting.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3.5 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset Defaults
          </button>

          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testing}
            className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/5 px-3.5 py-2 text-xs font-bold text-primary transition-colors hover:bg-primary/10 disabled:opacity-50"
          >
            <Zap className={`h-3.5 w-3.5 ${testing ? "animate-pulse" : ""}`} />
            {testing ? "Testing..." : "Test Connection"}
          </button>

          <button
            type="button"
            onClick={() => handleSave()}
            disabled={saving || !hasChanges}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow transition-all hover:bg-primary/90 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : hasChanges ? "Save Changes *" : "Saved"}
          </button>
        </div>
      </div>

      {/* ── Test Result Banner (if tested) ────────────────────── */}
      {testResult && (
        <div
          className={`rounded-xl border p-4 flex items-start gap-3 text-xs ${
            testResult.success
              ? "border-green-500/30 bg-green-500/10 text-green-800 dark:text-green-300"
              : "border-destructive/30 bg-destructive/10 text-destructive dark:text-red-400"
          }`}
        >
          {testResult.success ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600 mt-0.5" />
          ) : (
            <AlertCircle className="h-5 w-5 shrink-0 text-destructive mt-0.5" />
          )}
          <div className="space-y-1">
            <h4 className="font-bold text-sm">{testResult.message}</h4>
            <p>{testResult.details}</p>
            {!testResult.success && testResult.details?.includes("unsigned") && (
              <div className="mt-2 text-[11px] rounded bg-background/80 p-2 border border-border">
                <strong>Fix:</strong> In Cloudinary Console &rarr; <strong>Settings (⚙️)</strong> &rarr;{" "}
                <strong>Upload Presets</strong> &rarr; Edit <code>{formData.uploadPreset}</code> &rarr;
                Change <em>Signing Mode</em> to <strong>Unsigned</strong> &rarr; Save.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Config Form Card ──────────────────────────────────── */}
      <form
        onSubmit={handleSave}
        className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-6"
      >
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h2 className="text-base font-bold text-foreground">API Credentials</h2>
          </div>
          <span className="text-xs text-muted-foreground">Changes take effect immediately</span>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {/* Cloud Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground flex items-center justify-between">
              <span>Cloud Name *</span>
              <span className="text-[10px] text-muted-foreground font-normal">
                from Cloudinary Dashboard
              </span>
            </label>
            <input
              type="text"
              required
              value={formData.cloudName}
              onChange={(e) => handleChange("cloudName", e.target.value)}
              placeholder="e.g. obsapersonal"
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <p className="text-[11px] text-muted-foreground">
              Your unique Cloudinary environment username.
            </p>
          </div>

          {/* Upload Preset */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground flex items-center justify-between">
              <span>Upload Preset (Unsigned) *</span>
              <span className="text-[10px] text-muted-foreground font-normal">
                Settings &rarr; Upload
              </span>
            </label>
            <input
              type="text"
              required
              value={formData.uploadPreset}
              onChange={(e) => handleChange("uploadPreset", e.target.value)}
              placeholder="e.g. sisay_mengiste"
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <p className="text-[11px] text-muted-foreground">
              Must be configured with <strong>Signing Mode: Unsigned</strong> in Cloudinary.
            </p>
          </div>

          {/* Target Folder */}
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-bold text-foreground">
              Destination Folder in Cloudinary (Optional)
            </label>
            <input
              type="text"
              value={formData.folder || ""}
              onChange={(e) => handleChange("folder", e.target.value)}
              placeholder="sisay_mengiste_news"
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <p className="text-[11px] text-muted-foreground">
              All article uploads will be organized inside this folder in your Cloudinary Media Library.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-green-600" />
            <span>Secure client-side direct upload without exposing API secrets</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testing}
              className="rounded-lg border border-border px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors disabled:opacity-50"
            >
              Test Connection
            </button>
            <button
              type="submit"
              disabled={saving || !hasChanges}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-all disabled:opacity-50"
            >
              <Save className="h-3.5 w-3.5" />
              {saving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </div>
      </form>

      {/* ── Quick Setup Guide Card ────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">
              How to configure your Cloudinary Preset
            </h3>
          </div>
          <a
            href="https://console.cloudinary.com/settings/upload"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
          >
            Open Cloudinary Upload Settings <ExternalLink className="h-3 w-3" />
          </a>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 text-xs">
          <div className="rounded-xl border border-border bg-muted/20 p-3.5 space-y-1">
            <div className="font-bold text-foreground flex items-center gap-1.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px]">
                1
              </span>
              <span>Create / Open Preset</span>
            </div>
            <p className="text-muted-foreground text-[11px]">
              In Cloudinary Console &rarr; <strong>Settings (⚙️)</strong> &rarr; <strong>Upload</strong>.
              Scroll to <em>Upload presets</em> and click <strong>Add upload preset</strong> or Edit existing.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-muted/20 p-3.5 space-y-1">
            <div className="font-bold text-foreground flex items-center gap-1.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px]">
                2
              </span>
              <span>Set to "Unsigned"</span>
            </div>
            <p className="text-muted-foreground text-[11px]">
              Change <strong>Signing Mode</strong> from <em>Signed</em> to <strong>Unsigned</strong>.
              This allows safe, direct client-side uploads.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-muted/20 p-3.5 space-y-1">
            <div className="font-bold text-foreground flex items-center gap-1.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px]">
                3
              </span>
              <span>Copy Preset Name</span>
            </div>
            <p className="text-muted-foreground text-[11px]">
              Save the preset, then copy the <strong>Upload preset name</strong> (e.g.{" "}
              <code>sisay_mengiste</code>) and paste it into the field above.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
