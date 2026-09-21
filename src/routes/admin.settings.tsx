import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { useLanguage } from "@/contexts/language-context";
import { useSocialLinks } from "@/contexts/social-context";
import { useContact } from "@/contexts/contact-context";
import { useAds } from "@/contexts/ads-context";
import { type SocialLinkItem } from "@/lib/social-links";
import { type ContactSettings, DEFAULT_CONTACT_SETTINGS } from "@/lib/contact-settings";
import {
  getLocalCloudinarySettings,
  saveCloudinarySettingsToFirestore,
  fetchCloudinarySettingsFromFirestore,
  type CloudinarySettings,
  DEFAULT_CLOUDINARY_SETTINGS,
} from "@/lib/cloudinary-settings";
import {
  type AdsSettings,
  type AdSlotConfig,
  DEFAULT_ADS_SETTINGS,
} from "@/lib/ads-settings";
import { uploadToCloudinary } from "@/lib/cloudinary-service";
import { SocialIcon } from "@/components/social-icons";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { AdBanner } from "@/components/ad-banner";
import {
  Settings,
  Cloud,
  Share2,
  Mail,
  Phone,
  MapPin,
  Save,
  RotateCcw,
  Plus,
  ArrowUp,
  ArrowDown,
  Trash2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Zap,
  ShieldCheck,
  Eye,
  Sparkles,
  Info,
  Globe,
  Megaphone,
  Upload,
  Image as ImageIcon,
  Check,
  X,
  Layers,
} from "lucide-react";
import { toast } from "sonner";

type SettingsTab = "cloudinary" | "social" | "contact" | "ads";

export const Route = createFileRoute("/admin/settings")({
  component: AdminSettingsPage,
});

const ICON_OPTIONS = [
  "Facebook",
  "Telegram",
  "X",
  "YouTube",
  "TikTok",
  "LinkedIn",
  "Instagram",
  "WhatsApp",
  "Website",
];

function AdminSettingsPage() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<SettingsTab>("cloudinary");

  // Read URL query or hash if tab is provided
  useEffect(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash.replace("#", "");
      if (hash === "social" || hash === "contact" || hash === "cloudinary" || hash === "ads") {
        setActiveTab(hash as SettingsTab);
      }
    }
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* ── Page Header ───────────────────────────────────────── */}
      <div className="flex flex-col gap-2 border-b border-border pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Settings className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {t("adminNavSettings")}
            </h1>
            <p className="text-sm text-muted-foreground">
              Configure image storage, social media channels, contact details, and advertising banners.
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 pt-4 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("cloudinary")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all border ${
              activeTab === "cloudinary"
                ? "bg-primary text-primary-foreground border-primary shadow-xs"
                : "bg-card text-muted-foreground border-border hover:bg-muted hover:text-foreground"
            }`}
          >
            <Cloud className="h-4 w-4" />
            <span>Cloudinary Storage</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("social")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all border ${
              activeTab === "social"
                ? "bg-primary text-primary-foreground border-primary shadow-xs"
                : "bg-card text-muted-foreground border-border hover:bg-muted hover:text-foreground"
            }`}
          >
            <Share2 className="h-4 w-4" />
            <span>Social Media</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("contact")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all border ${
              activeTab === "contact"
                ? "bg-primary text-primary-foreground border-primary shadow-xs"
                : "bg-card text-muted-foreground border-border hover:bg-muted hover:text-foreground"
            }`}
          >
            <Mail className="h-4 w-4" />
            <span>Contact Information</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("ads")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all border ${
              activeTab === "ads"
                ? "bg-primary text-primary-foreground border-primary shadow-xs"
                : "bg-card text-muted-foreground border-border hover:bg-muted hover:text-foreground"
            }`}
          >
            <Megaphone className="h-4 w-4" />
            <span>Advertisements</span>
          </button>
        </div>
      </div>

      {/* ── Active Tab Content ─────────────────────────────────── */}
      {activeTab === "cloudinary" && <CloudinarySettingsTab />}
      {activeTab === "social" && <SocialSettingsTab />}
      {activeTab === "contact" && <ContactSettingsTab />}
      {activeTab === "ads" && <AdsSettingsTab />}
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════════
   TAB 1: CLOUDINARY SETTINGS
═════════════════════════════════════════════════════════════════ */
function CloudinarySettingsTab() {
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
    toast.info("Reset to default settings.");
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
        const errorMsg = data?.error?.message || `Failed with status ${response.status}`;
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
        message: "Network Error",
        details: err?.message || "Could not reach api.cloudinary.com.",
      });
      toast.error("Connection test failed.", { id: toastId });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Test Result Banner */}
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

      {/* Cloudinary Form */}
      <form
        onSubmit={handleSave}
        className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-6"
      >
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-2">
            <Cloud className="h-4 w-4 text-primary" />
            <h2 className="text-base font-bold text-foreground">Cloudinary CDN Credentials</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted"
            >
              <RotateCcw className="h-3 w-3" />
              Reset
            </button>
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testing}
              className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/10 disabled:opacity-50"
            >
              <Zap className="h-3.5 w-3.5" />
              {testing ? "Testing..." : "Test Connection"}
            </button>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {/* Cloud Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground flex items-center justify-between">
              <span>Cloud Name *</span>
              <span className="text-[10px] text-muted-foreground font-normal">Dashboard</span>
            </label>
            <input
              type="text"
              required
              value={formData.cloudName}
              onChange={(e) => handleChange("cloudName", e.target.value)}
              placeholder="e.g. obsapersonal"
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <p className="text-[11px] text-muted-foreground">Your Cloudinary account cloud name.</p>
          </div>

          {/* Upload Preset */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground flex items-center justify-between">
              <span>Upload Preset (Unsigned) *</span>
              <span className="text-[10px] text-muted-foreground font-normal">Upload Presets</span>
            </label>
            <input
              type="text"
              required
              value={formData.uploadPreset}
              onChange={(e) => handleChange("uploadPreset", e.target.value)}
              placeholder="e.g. sisay_mengiste"
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <p className="text-[11px] text-muted-foreground">
              Must have <strong>Signing Mode: Unsigned</strong>.
            </p>
          </div>

          {/* Target Folder */}
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-bold text-foreground">
              Cloudinary Destination Folder (Optional)
            </label>
            <input
              type="text"
              value={formData.folder || ""}
              onChange={(e) => handleChange("folder", e.target.value)}
              placeholder="sisay_mengiste_news"
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-green-600" />
            <span>Direct client uploads without exposing private API secrets</span>
          </div>

          <button
            type="submit"
            disabled={saving || !hasChanges}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-all disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" />
            {saving ? "Saving..." : hasChanges ? "Save Changes *" : "Saved"}
          </button>
        </div>
      </form>

      {/* Guide Card */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">
              How to create an Unsigned Preset in Cloudinary
            </h3>
          </div>
          <a
            href="https://console.cloudinary.com/settings/upload"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
          >
            Cloudinary Settings &rarr; Upload <ExternalLink className="h-3 w-3" />
          </a>
        </div>
        <p className="text-xs text-muted-foreground">
          1. Go to <strong>Cloudinary Console &rarr; Settings (⚙️) &rarr; Upload</strong>.<br />
          2. Scroll down to <strong>Upload presets</strong> and click <strong>Add upload preset</strong>.<br />
          3. Change <strong>Signing Mode</strong> to <strong>Unsigned</strong>.<br />
          4. Set the Preset Name to <code>{formData.uploadPreset || "sisay_mengiste"}</code> and save.
        </p>
      </div>
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════════
   TAB 2: SOCIAL MEDIA SETTINGS
═════════════════════════════════════════════════════════════════ */
function SocialSettingsTab() {
  const { links, saveAllLinks, resetToDefaults, loading } = useSocialLinks();
  const [draftLinks, setDraftLinks] = useState<SocialLinkItem[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  const [newLabel, setNewLabel] = useState("");
  const [newHref, setNewHref] = useState("");
  const [newIcon, setNewIcon] = useState("Website");

  useEffect(() => {
    if (!loading && links.length > 0) {
      setDraftLinks(links);
      setHasChanges(false);
    }
  }, [links, loading]);

  const handleToggle = (id: string) => {
    setDraftLinks((prev) =>
      prev.map((item) => (item.id === id ? { ...item, enabled: !item.enabled } : item)),
    );
    setHasChanges(true);
  };

  const handleHrefChange = (id: string, href: string) => {
    setDraftLinks((prev) =>
      prev.map((item) => (item.id === id ? { ...item, href } : item)),
    );
    setHasChanges(true);
  };

  const handleLabelChange = (id: string, label: string) => {
    setDraftLinks((prev) =>
      prev.map((item) => (item.id === id ? { ...item, label } : item)),
    );
    setHasChanges(true);
  };

  const handleMove = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= draftLinks.length) return;
    const updated = [...draftLinks];
    const temp = updated[index]!;
    updated[index] = updated[targetIndex]!;
    updated[targetIndex] = temp;
    setDraftLinks(updated);
    setHasChanges(true);
  };

  const handleDelete = (id: string) => {
    setDraftLinks((prev) => prev.filter((item) => item.id !== id));
    setHasChanges(true);
  };

  const handleAddChannel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim()) {
      toast.error("Please provide a name for the channel.");
      return;
    }
    const id = newLabel.toLowerCase().replace(/[^a-z0-9]/g, "-") + "-" + Date.now();
    const newItem: SocialLinkItem = {
      id,
      label: newLabel.trim(),
      href: newHref.trim() || "https://",
      icon: newIcon,
      enabled: true,
    };
    setDraftLinks((prev) => [...prev, newItem]);
    setHasChanges(true);
    setNewLabel("");
    setNewHref("");
    setNewIcon("Website");
    setShowAddForm(false);
    toast.success(`Added ${newItem.label}! Click "Save Changes" to publish.`);
  };

  const handleSave = async () => {
    setSaving(true);
    const toastId = toast.loading("Saving social channels...");
    try {
      await saveAllLinks(draftLinks);
      setHasChanges(false);
      toast.success("Social channels updated successfully!", { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error("Saved locally. (Firestore permission notice)", { id: toastId });
      setHasChanges(false);
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmReset = async () => {
    const toastId = toast.loading("Resetting to default channels...");
    try {
      await resetToDefaults();
      setHasChanges(false);
      toast.success("Reset to default social links!", { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error("Failed to reset.", { id: toastId });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          Toggle switch to show or hide channels on the website.
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setResetDialogOpen(true)}
            className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted"
          >
            <RotateCcw className="h-3 w-3" />
            Reset
          </button>
          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted"
          >
            <Plus className="h-3.5 w-3.5 text-primary" />
            Add Channel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" />
            {saving ? "Saving..." : hasChanges ? "Save Changes *" : "Saved"}
          </button>
        </div>
      </div>

      {/* Add form modal/drawer inline */}
      {showAddForm && (
        <form
          onSubmit={handleAddChannel}
          className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3"
        >
          <h4 className="text-xs font-bold text-foreground">Add New Platform</h4>
          <div className="grid gap-3 sm:grid-cols-3">
            <input
              type="text"
              required
              placeholder="Label (e.g. Threads)"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              className="rounded-lg border border-border bg-card px-3 py-2 text-xs"
            />
            <input
              type="url"
              required
              placeholder="URL (https://...)"
              value={newHref}
              onChange={(e) => setNewHref(e.target.value)}
              className="rounded-lg border border-border bg-card px-3 py-2 text-xs"
            />
            <select
              value={newIcon}
              onChange={(e) => setNewIcon(e.target.value)}
              className="rounded-lg border border-border bg-card px-3 py-2 text-xs"
            >
              {ICON_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1 text-xs text-muted-foreground"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-primary px-4 py-1 text-xs font-bold text-primary-foreground"
            >
              Add Channel
            </button>
          </div>
        </form>
      )}

      {/* Links List */}
      <div className="space-y-3">
        {draftLinks.map((item, index) => (
          <div
            key={item.id}
            className={`flex items-center gap-3 rounded-xl border p-3 bg-card transition-all ${
              item.enabled ? "border-border" : "border-border/50 opacity-60 bg-muted/20"
            }`}
          >
            {/* Toggle */}
            <button
              type="button"
              onClick={() => handleToggle(item.id)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                item.enabled ? "bg-primary" : "bg-neutral-300 dark:bg-neutral-700"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform ${
                  item.enabled ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>

            {/* Icon */}
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted/60 text-foreground">
              <SocialIcon name={item.icon || item.label} className="h-4 w-4" />
            </div>

            {/* Inputs */}
            <div className="grid flex-1 gap-2 sm:grid-cols-2">
              <input
                type="text"
                value={item.label}
                onChange={(e) => handleLabelChange(item.id, e.target.value)}
                className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium"
              />
              <input
                type="url"
                value={item.href}
                onChange={(e) => handleHrefChange(item.id, e.target.value)}
                className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleMove(index, "up")}
                disabled={index === 0}
                className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
              >
                <ArrowUp className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleMove(index, "down")}
                disabled={index === draftLinks.length - 1}
                className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
              >
                <ArrowDown className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleDelete(item.id)}
                className="p-1 text-destructive hover:bg-destructive/10 rounded"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={resetDialogOpen}
        onOpenChange={setResetDialogOpen}
        title="Reset Social Media Links?"
        description="This will restore default platforms (Facebook, Telegram, X, YouTube, TikTok, LinkedIn, Instagram, WhatsApp)."
        confirmLabel="Reset to Defaults"
        onConfirm={handleConfirmReset}
      />
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════════
   TAB 3: CONTACT SETTINGS
═════════════════════════════════════════════════════════════════ */
function ContactSettingsTab() {
  const { contact, saveContact, resetToDefaults, loading } = useContact();
  const [formData, setFormData] = useState<ContactSettings>(contact);
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);

  useEffect(() => {
    if (!loading) {
      setFormData(contact);
      setHasChanges(false);
    }
  }, [contact, loading]);

  const handleChange = (field: keyof ContactSettings, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formData.email.trim()) {
      toast.error("Contact email cannot be empty.");
      return;
    }

    setSaving(true);
    const toastId = toast.loading("Saving contact settings...");
    try {
      await saveContact(formData);
      setHasChanges(false);
      toast.success("Contact details updated successfully!", { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error("Saved locally. (Firestore permission notice)", { id: toastId });
      setHasChanges(false);
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmReset = async () => {
    const toastId = toast.loading("Resetting to default contact info...");
    try {
      await resetToDefaults();
      setHasChanges(false);
      toast.success("Reset to defaults successfully!", { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error("Failed to reset.", { id: toastId });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <form
        onSubmit={handleSave}
        className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-6"
      >
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-primary" />
            <h2 className="text-base font-bold text-foreground">Contact & Advertising Details</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setResetDialogOpen(true)}
              className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted"
            >
              <RotateCcw className="h-3 w-3" />
              Reset
            </button>
            <button
              type="submit"
              disabled={saving || !hasChanges}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-5 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              <Save className="h-3.5 w-3.5" />
              {saving ? "Saving..." : hasChanges ? "Save Changes *" : "Saved"}
            </button>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {/* Main Contact Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">Primary Editorial Email *</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              placeholder="otemesgen@gmail.com"
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <p className="text-[11px] text-muted-foreground">Appears in site footer.</p>
          </div>

          {/* Advertising Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">Advertising Inquiries Email</label>
            <input
              type="email"
              value={formData.advertisingEmail || ""}
              onChange={(e) => handleChange("advertisingEmail", e.target.value)}
              placeholder="otemesgen@gmail.com"
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <p className="text-[11px] text-muted-foreground">Linked in advertisement banners.</p>
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">Contact Phone (Optional)</label>
            <input
              type="tel"
              value={formData.phone || ""}
              onChange={(e) => handleChange("phone", e.target.value)}
              placeholder="+251 911 000 000"
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Location */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">Office Location</label>
            <input
              type="text"
              value={formData.location || ""}
              onChange={(e) => handleChange("location", e.target.value)}
              placeholder="Addis Ababa, Ethiopia"
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>
      </form>

      <ConfirmDialog
        open={resetDialogOpen}
        onOpenChange={setResetDialogOpen}
        title="Reset Contact Info?"
        description="This will restore default email (otemesgen@gmail.com) and office location."
        confirmLabel="Reset to Defaults"
        onConfirm={handleConfirmReset}
      />
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════════
   TAB 4: ADVERTISEMENTS SETTINGS
═════════════════════════════════════════════════════════════════ */
const AD_SLOT_DEFINITIONS: Array<{
  id: "leaderboard" | "sidebar" | "in-article" | "billboard";
  title: string;
  badge: string;
  location: string;
  recommendedSize: string;
  aspectDesc: string;
}> = [
  {
    id: "leaderboard",
    title: "Top Leaderboard Banner",
    badge: "Top Billboard",
    location: "Appears across the top of Homepage & Category Pages",
    recommendedSize: "728 × 90 px (or responsive banner 1200 × 200)",
    aspectDesc: "Horizontal wide banner",
  },
  {
    id: "sidebar",
    title: "Sidebar Medium Rectangle",
    badge: "Sidebar Box",
    location: "Appears on Homepage sidebar and article reading sidebars",
    recommendedSize: "300 × 250 px (or 336 × 280)",
    aspectDesc: "Standard rectangular box",
  },
  {
    id: "in-article",
    title: "In-Article Interstitial Banner",
    badge: "Inline Article",
    location: "Appears inline between story paragraphs in every article",
    recommendedSize: "600 × 200 px (or responsive)",
    aspectDesc: "Fluid inline card banner",
  },
  {
    id: "billboard",
    title: "Bottom Billboard Banner",
    badge: "Footer Spotlight",
    location: "High-impact wide banner displayed right above the footer",
    recommendedSize: "970 × 250 px (or 1200 × 300)",
    aspectDesc: "Full-width spotlight billboard",
  },
];

function AdsSettingsTab() {
  const { ads, saveAds } = useAds();
  const [formData, setFormData] = useState<AdsSettings>(ads);
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [uploadingSlot, setUploadingSlot] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [activePreview, setActivePreview] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    setFormData(ads);
    setHasChanges(false);
  }, [ads]);

  const handleSlotFieldChange = (
    slotId: "leaderboard" | "sidebar" | "in-article" | "billboard",
    field: keyof AdSlotConfig,
    value: any
  ) => {
    setFormData((prev) => ({
      ...prev,
      slots: {
        ...prev.slots,
        [slotId]: {
          ...(prev.slots[slotId] || DEFAULT_ADS_SETTINGS.slots[slotId]),
          [field]: value,
        },
      },
    }));
    setHasChanges(true);
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    const toastId = toast.loading("Saving advertisement placements...");
    try {
      await saveAds(formData);
      setHasChanges(false);
      toast.success("Advertisement settings saved successfully!", { id: toastId });
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Failed to save advertisement settings.", { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmReset = async () => {
    setFormData(DEFAULT_ADS_SETTINGS);
    setHasChanges(true);
    setResetDialogOpen(false);
    toast.info("Reset to default ad configurations. Click 'Save Changes' to apply.");
  };

  const handleImageFileSelected = async (
    slotId: "leaderboard" | "sidebar" | "in-article" | "billboard",
    file: File
  ) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose a valid image file (JPG, PNG, WebP, GIF).");
      return;
    }
    setUploadingSlot(slotId);
    setUploadProgress(0);
    const toastId = toast.loading(`Uploading image for ${slotId}...`);
    try {
      const url = await uploadToCloudinary(file, (pct) => setUploadProgress(pct));
      handleSlotFieldChange(slotId, "imageUrl", url);
      toast.success("Banner image uploaded successfully!", { id: toastId });
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Failed to upload image. Please check Cloudinary settings.", { id: toastId });
    } finally {
      setUploadingSlot(null);
      setUploadProgress(0);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner & Save Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-border bg-card p-5 shadow-xs">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Megaphone className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">
              Advertisement Placements & Sponsorships
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Manage client banner ads across 4 strategic placement zones. Real-time updates sync directly to the live site.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          <button
            type="button"
            onClick={() => setResetDialogOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset</span>
          </button>
          <button
            type="button"
            onClick={() => handleSave()}
            disabled={saving || !hasChanges}
            className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white shadow-xs transition-all ${
              hasChanges
                ? "bg-primary hover:bg-primary/90 cursor-pointer"
                : "bg-muted text-muted-foreground cursor-not-allowed opacity-60"
            }`}
          >
            <Save className="h-3.5 w-3.5" />
            <span>{saving ? "Saving..." : "Save All Changes"}</span>
          </button>
        </div>
      </div>

      {/* Info helper */}
      <div className="flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4">
        <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div className="text-xs text-muted-foreground leading-relaxed">
          <strong className="text-foreground font-semibold">How it works: </strong>
          Each slot can either display a sponsor’s custom banner image or a branded editorial inquiry card. If an ad slot has an image, clicking it will take the reader to the destination URL. If no custom image or sponsor is provided, it automatically falls back to inviting advertisers to contact your email.
        </div>
      </div>

      {/* ── 4 Ad Slots Grid / Cards ─────────────────────────────── */}
      <div className="space-y-6">
        {AD_SLOT_DEFINITIONS.map((def) => {
          const slot = formData.slots[def.id] || DEFAULT_ADS_SETTINGS.slots[def.id];
          const isEnabled = slot.enabled;
          const isUploading = uploadingSlot === def.id;
          const isPreviewOpen = activePreview === def.id;

          return (
            <div
              key={def.id}
              className={`rounded-2xl border transition-all ${
                isEnabled
                  ? "border-border bg-card shadow-xs"
                  : "border-border/60 bg-muted/20 opacity-80"
              }`}
            >
              {/* Card Top Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/70 p-4 sm:px-5">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-xl border font-bold text-xs ${
                      isEnabled
                        ? "bg-primary/10 border-primary/30 text-primary"
                        : "bg-muted border-border text-muted-foreground"
                    }`}
                  >
                    <Layers className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-foreground">{def.title}</h3>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        {def.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{def.location}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  {/* Enable/Disable Toggle */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      {isEnabled ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                          <Check className="h-3 w-3" /> Active
                        </span>
                      ) : (
                        <span className="text-muted-foreground flex items-center gap-1">
                          <X className="h-3 w-3" /> Disabled
                        </span>
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleSlotFieldChange(def.id, "enabled", !isEnabled)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        isEnabled ? "bg-primary" : "bg-muted-foreground/30"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          isEnabled ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 sm:p-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Sponsor Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">
                      Sponsor / Client Name
                    </label>
                    <input
                      type="text"
                      value={slot.sponsorName || ""}
                      onChange={(e) => handleSlotFieldChange(def.id, "sponsorName", e.target.value)}
                      placeholder="e.g. Ethiopian Airlines, Safaricom, CBE"
                      disabled={!isEnabled}
                      className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs sm:text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Displayed on the badge label above or inside the ad.
                    </p>
                  </div>

                  {/* Headline / Title */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">
                      Ad Headline / Campaign Title
                    </label>
                    <input
                      type="text"
                      value={slot.title || ""}
                      onChange={(e) => handleSlotFieldChange(def.id, "title", e.target.value)}
                      placeholder="e.g. Fly direct to 130+ destinations with award-winning comfort"
                      disabled={!isEnabled}
                      className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs sm:text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Prominent headline displayed in the native ad card.
                    </p>
                  </div>
                </div>

                {/* Description & CTA text */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Campaign Tagline / Description */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">
                      Campaign Tagline / Description
                    </label>
                    <input
                      type="text"
                      value={slot.description || ""}
                      onChange={(e) => handleSlotFieldChange(def.id, "description", e.target.value)}
                      placeholder="e.g. Book now to receive 20% discount on flights across Africa and Europe."
                      disabled={!isEnabled}
                      className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs sm:text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Short supporting message that gives readers context about the offer.
                    </p>
                  </div>

                  {/* CTA Button Text */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">
                      Action Button Text
                    </label>
                    <input
                      type="text"
                      value={slot.ctaText || ""}
                      onChange={(e) => handleSlotFieldChange(def.id, "ctaText", e.target.value)}
                      placeholder="e.g. Visit Sponsor, Learn More, Book Now, Shop Now"
                      disabled={!isEnabled}
                      className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs sm:text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Text displayed on the call-to-action button (defaults to "Visit Sponsor").
                    </p>
                  </div>
                </div>

                {/* Target URL, Display Format & Open New Tab */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">
                      Destination Click Link (URL)
                    </label>
                    <input
                      type="url"
                      value={slot.linkUrl || ""}
                      onChange={(e) => handleSlotFieldChange(def.id, "linkUrl", e.target.value)}
                      placeholder="https://example.com/promotion"
                      disabled={!isEnabled}
                      className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs sm:text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Where readers are redirected when clicking the ad.
                    </p>
                  </div>

                  {/* Display Format selector */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">
                      Display Format
                    </label>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleSlotFieldChange(def.id, "displayStyle", "card")}
                        disabled={!isEnabled}
                        className={`flex-1 rounded-lg px-2.5 py-2 text-[11px] font-bold border transition-all ${
                          (slot.displayStyle || "card") === "card"
                            ? "bg-primary text-primary-foreground border-primary shadow-xs"
                            : "bg-muted/40 border-border text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        Native Card
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSlotFieldChange(def.id, "displayStyle", "banner")}
                        disabled={!isEnabled}
                        className={`flex-1 rounded-lg px-2.5 py-2 text-[11px] font-bold border transition-all ${
                          slot.displayStyle === "banner"
                            ? "bg-primary text-primary-foreground border-primary shadow-xs"
                            : "bg-muted/40 border-border text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        Full Banner
                      </button>
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      Native Card (image + text + CTA) vs Full Banner graphic.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 pb-2">
                    <input
                      type="checkbox"
                      id={`newtab-${def.id}`}
                      checked={slot.openInNewTab !== false}
                      onChange={(e) => handleSlotFieldChange(def.id, "openInNewTab", e.target.checked)}
                      disabled={!isEnabled}
                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <label
                      htmlFor={`newtab-${def.id}`}
                      className="text-xs font-medium text-foreground cursor-pointer select-none"
                    >
                      Open link in new tab
                    </label>
                  </div>
                </div>

                {/* Banner Image URL & Cloudinary Upload */}
                <div className="space-y-2 pt-1 border-t border-border/60">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <ImageIcon className="h-3.5 w-3.5 text-primary" />
                      <span>Banner Image (Recommended: {def.recommendedSize})</span>
                    </label>
                    <span className="text-[10px] text-muted-foreground">{def.aspectDesc}</span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-2">
                    <input
                      type="url"
                      value={slot.imageUrl || ""}
                      onChange={(e) => handleSlotFieldChange(def.id, "imageUrl", e.target.value)}
                      placeholder="https://res.cloudinary.com/... or paste image URL"
                      disabled={!isEnabled}
                      className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs sm:text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                    />

                    {/* Hidden file input for Cloudinary upload */}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      ref={(el) => {
                        fileInputRefs.current[def.id] = el;
                      }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageFileSelected(def.id, file);
                        e.target.value = "";
                      }}
                    />

                    <button
                      type="button"
                      onClick={() => fileInputRefs.current[def.id]?.click()}
                      disabled={!isEnabled || isUploading}
                      className="flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 px-3.5 py-2 text-xs font-bold text-primary hover:bg-primary/20 transition-colors shrink-0 disabled:opacity-50 cursor-pointer"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      <span>{isUploading ? `Uploading ${uploadProgress}%` : "Upload Image"}</span>
                    </button>

                    {slot.imageUrl && (
                      <button
                        type="button"
                        onClick={() => handleSlotFieldChange(def.id, "imageUrl", "")}
                        disabled={!isEnabled}
                        className="rounded-xl border border-border p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                        title="Remove image"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Image Preview & Details */}
                  {slot.imageUrl && (
                    <div className="relative mt-2 rounded-xl border border-border overflow-hidden bg-neutral-900/50 p-2 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <img
                          src={slot.imageUrl}
                          alt="Banner preview"
                          className="h-14 max-w-[180px] object-cover rounded-lg border border-border/60"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-foreground truncate">
                            {slot.sponsorName || "Custom Banner"}
                          </p>
                          <p className="text-[10px] text-muted-foreground truncate">
                            {slot.imageUrl}
                          </p>
                        </div>
                      </div>
                      <a
                        href={slot.imageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[11px] font-bold text-primary hover:underline shrink-0 pr-2"
                      >
                        <span>View original</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                </div>

                {/* Live Preview Accordion Toggle */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setActivePreview(isPreviewOpen ? null : def.id)}
                    className="flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>{isPreviewOpen ? "Hide Live Banner Preview" : "Show Live Banner Preview"}</span>
                  </button>

                  {isPreviewOpen && (
                    <div className="mt-3 rounded-2xl border border-border/80 bg-neutral-950/20 p-4 sm:p-6 overflow-hidden">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          Simulated Site Render (Live Component)
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          Slot ID: {def.id}
                        </span>
                      </div>
                      <div className="bg-background rounded-xl border border-border/60 p-2">
                        {/* Real live AdBanner component */}
                        <AdBanner
                          variant={def.id}
                          imageUrl={slot.imageUrl}
                          linkUrl={slot.linkUrl}
                          title={slot.title}
                          sponsorName={slot.sponsorName}
                          description={slot.description}
                          ctaText={slot.ctaText}
                          displayStyle={slot.displayStyle}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating or bottom Save Button */}
      {hasChanges && (
        <div className="sticky bottom-6 z-20 flex items-center justify-between gap-4 rounded-2xl border border-primary/30 bg-card p-4 shadow-lg ring-1 ring-primary/20 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>You have unsaved changes in your advertisement configuration.</span>
          </div>
          <button
            type="button"
            onClick={() => handleSave()}
            disabled={saving}
            className="flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow transition-transform hover:scale-105"
          >
            <Save className="h-3.5 w-3.5" />
            <span>{saving ? "Saving..." : "Save All Changes"}</span>
          </button>
        </div>
      )}

      {/* Reset Confirmation Dialog */}
      <ConfirmDialog
        open={resetDialogOpen}
        onOpenChange={setResetDialogOpen}
        title="Reset All Advertisements?"
        description="This will restore default advertising slots and editorial inquiry placeholders. Any custom banner URLs and campaign headlines will be reset."
        confirmLabel="Reset to Defaults"
        onConfirm={handleConfirmReset}
      />
    </div>
  );
}
