import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useSocialLinks } from "@/contexts/social-context";
import { type SocialLinkItem } from "@/lib/social-links";
import { SocialIcon } from "@/components/social-icons";
import { ConfirmDialog } from "@/components/confirm-dialog";
import {
  Share2,
  Save,
  Plus,
  RotateCcw,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  Trash2,
  CheckCircle2,
  Sparkles,
  Eye,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/social")({
  component: AdminSocialPage,
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

function AdminSocialPage() {
  const { links, saveAllLinks, resetToDefaults, loading } = useSocialLinks();
  const [draftLinks, setDraftLinks] = useState<SocialLinkItem[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // New platform form state
  const [newLabel, setNewLabel] = useState("");
  const [newHref, setNewHref] = useState("");
  const [newIcon, setNewIcon] = useState("Website");

  // Keep draft in sync with context initially
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

    const next = [...draftLinks];
    const temp = next[index]!;
    next[index] = next[targetIndex]!;
    next[targetIndex] = temp;

    // Reassign order
    next.forEach((item, idx) => {
      item.order = idx + 1;
    });

    setDraftLinks(next);
    setHasChanges(true);
  };

  const handleDelete = (id: string) => {
    setDraftLinks((prev) => prev.filter((item) => item.id !== id));
    setHasChanges(true);
    toast.info("Channel removed from list (click Save to apply)");
  };

  const handleAddChannel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim() || !newHref.trim()) {
      toast.error("Please enter a name and URL for the channel.");
      return;
    }

    const id = `${newLabel.toLowerCase().replace(/[^a-z0-9]/g, "")}_${Date.now().toString(36)}`;
    const newChannel: SocialLinkItem = {
      id,
      label: newLabel.trim(),
      href: newHref.trim(),
      enabled: true,
      icon: newIcon,
      order: draftLinks.length + 1,
    };

    setDraftLinks((prev) => [...prev, newChannel]);
    setHasChanges(true);
    setNewLabel("");
    setNewHref("");
    setNewIcon("Website");
    setShowAddForm(false);
    toast.success(`Added ${newChannel.label}. Click Save to apply.`);
  };

  const handleSave = async () => {
    setSaving(true);
    const toastId = toast.loading("Saving social media channels...");
    try {
      await saveAllLinks(draftLinks);
      setHasChanges(false);
      toast.success("Social media channels saved successfully!", { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error("Failed to save changes. Please try again.", { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmReset = async () => {
    const toastId = toast.loading("Resetting to default channels...");
    try {
      await resetToDefaults();
      setHasChanges(false);
      toast.success("Reset to defaults successfully!", { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error("Failed to reset.", { id: toastId });
    }
  };

  const activeDraftLinks = draftLinks.filter((l) => l.enabled);

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* ── Page Header ────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Share2 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Social Media Channels
              </h1>
              <p className="text-sm text-muted-foreground">
                Manage, toggle, and edit social platforms (Facebook, Telegram, X, etc.)
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => setResetDialogOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3.5 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset Defaults
          </button>

          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground shadow-xs transition-colors hover:bg-muted"
          >
            <Plus className="h-3.5 w-3.5 text-primary" />
            Add Channel
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow transition-all hover:bg-primary/90 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : hasChanges ? "Save Changes *" : "Saved"}
          </button>
        </div>
      </div>

      {/* ── Live Preview Card ──────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-bold text-foreground">Live Public Site Preview</h2>
          </div>
          <span className="text-xs text-muted-foreground font-medium">
            {activeDraftLinks.length} active channel{activeDraftLinks.length === 1 ? "" : "s"}
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Header Preview (Dark Navy/Ink theme) */}
          <div className="rounded-xl bg-[#090b10] p-4 text-white border border-neutral-800">
            <span className="text-[10px] font-bold tracking-widest text-gold uppercase block mb-2">
              Header Top Bar Preview:
            </span>
            {activeDraftLinks.length === 0 ? (
              <p className="text-xs text-neutral-400 italic">No active channels enabled.</p>
            ) : (
              <div className="flex items-center gap-2 flex-wrap">
                {activeDraftLinks.map((s) => (
                  <a
                    key={s.id}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={s.label}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-neutral-300 transition-all hover:bg-white/15 hover:text-gold"
                  >
                    <SocialIcon name={s.icon || s.label} className="h-4 w-4" />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Footer Preview (Card theme) */}
          <div className="rounded-xl bg-muted/40 p-4 border border-border">
            <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase block mb-2">
              Footer Follow Bar Preview:
            </span>
            {activeDraftLinks.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No active channels enabled.</p>
            ) : (
              <div className="flex items-center gap-2 flex-wrap">
                {activeDraftLinks.map((s) => (
                  <a
                    key={s.id}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={s.label}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-card border border-border text-foreground transition-all hover:border-primary hover:text-primary"
                  >
                    <SocialIcon name={s.icon || s.label} className="h-4 w-4" />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Add New Channel Drawer / Card ──────────────────────── */}
      {showAddForm && (
        <form
          onSubmit={handleAddChannel}
          className="rounded-2xl border border-primary/30 bg-primary/5 p-5 shadow-sm animate-fade-in"
        >
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">Add New Social Channel</h3>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                Platform Name
              </label>
              <input
                type="text"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="e.g. WhatsApp Channel"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                Icon Type
              </label>
              <select
                value={newIcon}
                onChange={(e) => setNewIcon(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
              >
                {ICON_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                Destination URL
              </label>
              <input
                type="url"
                value={newHref}
                onChange={(e) => setNewHref(e.target.value)}
                placeholder="https://..."
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="rounded-lg border border-border px-3.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary/90"
            >
              Add Channel
            </button>
          </div>
        </form>
      )}

      {/* ── Channel List ───────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Configured Channels ({draftLinks.length})
          </span>
          {hasChanges && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-500">
              <AlertCircle className="h-3 w-3" /> Unsaved changes
            </span>
          )}
        </div>

        <div className="divide-y divide-border rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
          {draftLinks.map((item, index) => {
            const isFirst = index === 0;
            const isLast = index === draftLinks.length - 1;

            return (
              <div
                key={item.id}
                className={`p-4 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  item.enabled ? "bg-card" : "bg-muted/20 opacity-70"
                }`}
              >
                {/* Left: Reorder + Icon + Info */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {/* Up / Down Reorder */}
                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      disabled={isFirst}
                      onClick={() => handleMove(index, "up")}
                      className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-20"
                      title="Move Up"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={isLast}
                      onClick={() => handleMove(index, "down")}
                      className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-20"
                      title="Move Down"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Icon badge */}
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
                      item.enabled
                        ? "border-primary/30 bg-primary/10 text-primary"
                        : "border-border bg-muted text-muted-foreground"
                    }`}
                  >
                    <SocialIcon name={item.icon || item.label} className="h-5 w-5" />
                  </div>

                  {/* Label & URL inputs */}
                  <div className="flex-1 grid gap-2 sm:grid-cols-2 min-w-0">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-0.5">
                        Name
                      </span>
                      <input
                        type="text"
                        value={item.label}
                        onChange={(e) => handleLabelChange(item.id, e.target.value)}
                        className="w-full rounded-md border border-border bg-background px-2.5 py-1 text-sm font-semibold text-foreground focus:border-primary focus:outline-none"
                      />
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-0.5">
                        URL Link
                      </span>
                      <div className="flex items-center gap-1">
                        <input
                          type="url"
                          value={item.href}
                          onChange={(e) => handleHrefChange(item.id, e.target.value)}
                          className="flex-1 rounded-md border border-border bg-background px-2.5 py-1 text-xs text-foreground focus:border-primary focus:outline-none truncate font-mono"
                        />
                        <a
                          href={item.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-primary transition-colors shrink-0"
                          title="Open URL in new tab"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Enable/Disable Toggle + Delete */}
                <div className="flex items-center justify-end gap-3 sm:border-l sm:border-border sm:pl-4">
                  {/* Status indicator & Toggle button */}
                  <button
                    type="button"
                    onClick={() => handleToggle(item.id)}
                    className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold transition-all ${
                      item.enabled
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${
                        item.enabled ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground/40"
                      }`}
                    />
                    <span>{item.enabled ? "Active" : "Disabled"}</span>
                  </button>

                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                    title="Delete channel"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Save Banner when dirty */}
      {hasChanges && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border border-primary/30 bg-card p-4 shadow-2xl animate-rise">
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-ping" />
            <span>You have unsaved changes!</span>
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow hover:bg-primary/90 transition-colors"
          >
            <Save className="h-3.5 w-3.5" />
            {saving ? "Saving..." : "Save Now"}
          </button>
        </div>
      )}

      {/* Reset Confirmation Dialog */}
      <ConfirmDialog
        open={resetDialogOpen}
        onOpenChange={setResetDialogOpen}
        title="Reset Social Media Channels?"
        description="This will restore the default list of social media channels (Facebook, Telegram, X, YouTube, TikTok, LinkedIn) and discard any custom configurations. Are you sure?"
        confirmLabel="Reset to Defaults"
        onConfirm={handleConfirmReset}
      />
    </div>
  );
}
