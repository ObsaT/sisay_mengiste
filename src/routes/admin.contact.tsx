import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useContact } from "@/contexts/contact-context";
import { type ContactSettings, DEFAULT_CONTACT_SETTINGS } from "@/lib/contact-settings";
import { ConfirmDialog } from "@/components/confirm-dialog";
import {
  Mail,
  Phone,
  MapPin,
  Send,
  Save,
  RotateCcw,
  Sparkles,
  Eye,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Copy,
  Globe,
} from "lucide-react";
import { triggerMailto } from "@/lib/newsletter-service";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/contact")({
  component: AdminContactPage,
});

function AdminContactPage() {
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
      toast.error("Failed to save contact settings.", { id: toastId });
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
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* ── Header ────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Contact & Media Info
              </h1>
              <p className="text-sm text-muted-foreground">
                Configure primary editorial email, advertising inquiries, phone, and office details.
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
            onClick={() => handleSave()}
            disabled={saving || !hasChanges}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow transition-all hover:bg-primary/90 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : hasChanges ? "Save Changes *" : "Saved"}
          </button>
        </div>
      </div>

      {/* ── Live Public Preview ───────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-bold text-foreground">Live Public Site Preview</h2>
          </div>
          <span className="text-xs text-muted-foreground font-medium">
            Updates in footer and ad banners in real-time
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Footer Card Preview */}
          <div className="rounded-xl bg-[#090b10] p-4 text-white border border-neutral-800">
            <span className="text-[10px] font-bold tracking-widest text-gold uppercase block mb-2">
              Footer Contact Bar:
            </span>
            <div className="space-y-2 text-xs text-neutral-300">
              <div className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-gold" />
                <span>{formData.location || DEFAULT_CONTACT_SETTINGS.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-gold" />
                <a
                  href={`mailto:${formData.email}`}
                  className="text-neutral-100 underline hover:text-gold"
                >
                  {formData.email || DEFAULT_CONTACT_SETTINGS.email}
                </a>
              </div>
              {formData.phone ? (
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-gold" />
                  <span>{formData.phone}</span>
                </div>
              ) : null}
            </div>
          </div>

          {/* Ad Banner Inquiries Preview */}
          <div className="rounded-xl bg-muted/40 p-4 border border-border">
            <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase block mb-2">
              Ad Banner Inquiry Action:
            </span>
            <p className="text-xs text-foreground font-medium mb-2">
              Prospective advertisers clicking &ldquo;Contact / Advertise&rdquo; will email:
            </p>
            <div className="flex items-center gap-2 rounded-lg bg-card p-2.5 border border-border text-xs font-mono text-primary font-semibold">
              <Mail className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{formData.advertisingEmail || formData.email}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Form ──────────────────────────────────────────────── */}
      <form onSubmit={handleSave} className="space-y-6">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-base font-bold text-foreground">Contact Email & Addresses</h3>
            {hasChanges && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-500">
                <AlertCircle className="h-3 w-3" /> Unsaved changes
              </span>
            )}
          </div>

          {/* Primary Email */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-foreground">
                Primary Contact Email <span className="text-destructive">*</span>
              </label>
              {formData.email && (
                <div className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      triggerMailto(`mailto:${formData.email}`);
                      toast.success("Opening default mail app...");
                    }}
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    <Mail className="h-3 w-3" /> Mail App
                  </button>
                  <span className="text-muted-foreground/40">·</span>
                  <a
                    href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(formData.email)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    <Globe className="h-3 w-3" /> Gmail
                  </a>
                  <span className="text-muted-foreground/40">·</span>
                  <button
                    type="button"
                    onClick={() => {
                      void navigator.clipboard.writeText(formData.email);
                      toast.success("Email copied to clipboard!");
                    }}
                    className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground hover:underline"
                  >
                    <Copy className="h-3 w-3" /> Copy
                  </button>
                </div>
              )}
            </div>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                <Mail className="h-4 w-4" />
              </div>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="otemesgen@gmail.com"
                required
                className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-sm font-medium text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary font-mono"
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              Displayed in the website footer for reader feedback, editorial inquiries, and press releases.
            </p>
          </div>

          {/* Advertising Inquiries Email */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-foreground">
                Advertising & Sponsorship Email
              </label>
              {formData.advertisingEmail && (
                <div className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      triggerMailto(`mailto:${formData.advertisingEmail}?subject=Advertising%20Inquiry`);
                      toast.success("Opening default mail app...");
                    }}
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    <Mail className="h-3 w-3" /> Mail App
                  </button>
                  <span className="text-muted-foreground/40">·</span>
                  <a
                    href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(formData.advertisingEmail)}&su=Advertising%20Inquiry`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    <Globe className="h-3 w-3" /> Gmail
                  </a>
                  <span className="text-muted-foreground/40">·</span>
                  <button
                    type="button"
                    onClick={() => {
                      void navigator.clipboard.writeText(formData.advertisingEmail);
                      toast.success("Advertising email copied to clipboard!");
                    }}
                    className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground hover:underline"
                  >
                    <Copy className="h-3 w-3" /> Copy
                  </button>
                </div>
              )}
            </div>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <input
                type="email"
                value={formData.advertisingEmail || ""}
                onChange={(e) => handleChange("advertisingEmail", e.target.value)}
                placeholder="otemesgen@gmail.com"
                className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-sm font-medium text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary font-mono"
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              Used when prospective partners and sponsors click on advertisement banners across the site.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 pt-2">
            {/* Phone */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-foreground">
                Phone Number (Optional)
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                  <Phone className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  value={formData.phone || ""}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  placeholder="+251 91 123 4567"
                  className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-sm font-medium text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Optional office line or hotline displayed in the footer.
              </p>
            </div>

            {/* Location / Edition */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-foreground">
                Office / Edition Location
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  value={formData.location || ""}
                  onChange={(e) => handleChange("location", e.target.value)}
                  placeholder="Addis Ababa, Ethiopia"
                  className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-sm font-medium text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Location or edition subtitle (e.g. Addis Ababa, Ethiopia).
              </p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="submit"
            disabled={saving || !hasChanges}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-md transition-all hover:bg-primary/90 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving Changes..." : "Save Contact Info"}
          </button>
        </div>
      </form>

      {/* Floating Save Banner */}
      {hasChanges && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border border-primary/30 bg-card p-4 shadow-2xl animate-rise">
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-ping" />
            <span>Unsaved changes in contact info</span>
          </div>
          <button
            type="button"
            onClick={() => handleSave()}
            disabled={saving}
            className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow hover:bg-primary/90 transition-colors"
          >
            <Save className="h-3.5 w-3.5" />
            {saving ? "Saving..." : "Save Now"}
          </button>
        </div>
      )}

      {/* Reset Confirmation */}
      <ConfirmDialog
        open={resetDialogOpen}
        onOpenChange={setResetDialogOpen}
        title="Reset Contact Settings?"
        description="This will restore the default contact email (otemesgen@gmail.com) and standard edition location. Are you sure?"
        confirmLabel="Reset to Defaults"
        onConfirm={handleConfirmReset}
      />
    </div>
  );
}
