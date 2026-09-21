import { useState, useMemo } from "react";
import {
  type ArticleForNewsletter,
  generateEmailHtml,
  generateEmailText,
  buildMailtoUrl,
  buildGmailWebUrl,
  buildOutlookWebUrl,
  triggerMailto,
  queueFirebaseMail,
  logNewsletterBroadcast,
} from "@/lib/newsletter-service";
import { type Subscriber } from "@/lib/subscribers-service";
import {
  Mail,
  Send,
  ExternalLink,
  Copy,
  Check,
  Eye,
  Info,
  Sparkles,
  Users,
  CheckCircle2,
  X,
  Zap,
  Globe,
} from "lucide-react";
import { toast } from "sonner";

interface BroadcastModalProps {
  open: boolean;
  onClose: () => void;
  article: ArticleForNewsletter;
  subscribers: Subscriber[];
}

export function BroadcastModal({ open, onClose, article, subscribers }: BroadcastModalProps) {
  const [langFilter, setLangFilter] = useState("all");
  const [subject, setSubject] = useState(`📰 [YERAS Media Network] ${article.title}`);
  const [copiedEmails, setCopiedEmails] = useState(false);
  const [activeTab, setActiveTab] = useState<"preview" | "settings">("preview");
  const [queueing, setQueueing] = useState(false);

  const activeSubscribers = useMemo(() => {
    return subscribers.filter((s) => s.status === "active");
  }, [subscribers]);

  const targetSubscribers = useMemo(() => {
    if (langFilter === "all") return activeSubscribers;
    return activeSubscribers.filter((s) => (s.language || "am") === langFilter);
  }, [activeSubscribers, langFilter]);

  const emailList = useMemo(() => {
    return targetSubscribers.map((s) => s.email.trim()).filter(Boolean);
  }, [targetSubscribers]);

  if (!open) return null;

  const emailText = generateEmailText(article);
  const emailHtml = generateEmailHtml(article);

  const handleCopyEmails = () => {
    if (emailList.length === 0) {
      toast.error("No subscribers found for this selection.");
      return;
    }
    void navigator.clipboard.writeText(emailList.join(", "));
    setCopiedEmails(true);
    toast.success(`Copied ${emailList.length} subscriber emails to clipboard!`);
    setTimeout(() => setCopiedEmails(false), 2500);
  };

  const handleOpenEmailClient = () => {
    if (emailList.length === 0) {
      toast.error("No subscribers to send to. Try changing language filter.");
      return;
    }

    // Always copy the email text as fallback to clipboard
    try {
      void navigator.clipboard.writeText(emailText);
    } catch (_) {}

    const { url, isTrimmed } = buildMailtoUrl(emailList, subject, emailText);
    triggerMailto(url);

    void logNewsletterBroadcast({
      articleId: article.id,
      title: article.title,
      recipientCount: emailList.length,
      method: "mailto",
    });

    if (isTrimmed) {
      toast.success(`Opening mail client with ${emailList.length} BCC subscribers!`, {
        description: "Full story text was also copied to clipboard to avoid mail client character limits.",
      });
    } else {
      toast.success(`Opening mail client with ${emailList.length} BCC subscribers!`, {
        description: "Full text was also copied to clipboard for easy pasting.",
      });
    }
  };

  const handleOpenGmail = () => {
    if (emailList.length === 0) {
      toast.error("No subscribers to send to. Try changing language filter.");
      return;
    }

    const gmailUrl = buildGmailWebUrl(emailList, subject, emailText);
    window.open(gmailUrl, "_blank", "noopener,noreferrer");

    void logNewsletterBroadcast({
      articleId: article.id,
      title: article.title,
      recipientCount: emailList.length,
      method: "mailto",
    });

    toast.success(`Opening Gmail Web with ${emailList.length} BCC subscribers!`);
  };

  const handleOpenOutlook = () => {
    if (emailList.length === 0) {
      toast.error("No subscribers to send to. Try changing language filter.");
      return;
    }

    const outlookUrl = buildOutlookWebUrl(emailList, subject, emailText);
    window.open(outlookUrl, "_blank", "noopener,noreferrer");

    void logNewsletterBroadcast({
      articleId: article.id,
      title: article.title,
      recipientCount: emailList.length,
      method: "mailto",
    });

    toast.success(`Opening Outlook Web with ${emailList.length} BCC subscribers!`);
  };

  const handleCopyFullDraft = () => {
    const fullDraft = `Subject: ${subject}\nBCC: ${emailList.join(", ")}\n\n${emailText}`;
    void navigator.clipboard.writeText(fullDraft);
    toast.success("Complete draft (Subject + BCC + Body) copied to clipboard!");
  };

  const handleQueueFirebase = async () => {
    if (emailList.length === 0) {
      toast.error("No subscribers found.");
      return;
    }

    setQueueing(true);
    try {
      await queueFirebaseMail(emailList, subject, emailHtml, emailText);
      await logNewsletterBroadcast({
        articleId: article.id,
        title: article.title,
        recipientCount: emailList.length,
        method: "firebase_mail",
      });
      toast.success(`Broadcast queued in Firestore for ${emailList.length} subscribers!`, {
        description: "Sent to the 'mail' collection for Firebase Trigger Email delivery.",
      });
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Failed to queue broadcast.");
    } finally {
      setQueueing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in backdrop-blur-xs">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Send className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">
                Broadcast Article to Subscribers
              </h2>
              <p className="text-xs text-muted-foreground">
                Send this news story directly to your newsletter audience
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Target Audience Bar */}
          <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <span className="text-xs font-bold text-foreground">
                  Recipients: {emailList.length} Active Subscribers
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <label className="text-muted-foreground">Filter by Language:</label>
                <select
                  value={langFilter}
                  onChange={(e) => setLangFilter(e.target.value)}
                  className="rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-medium text-foreground outline-none focus:border-primary"
                >
                  <option value="all">All ({activeSubscribers.length})</option>
                  <option value="am">🇪🇹 አማርኛ ({activeSubscribers.filter((s) => (s.language || "am") === "am").length})</option>
                  <option value="om">🌳 Afaan Oromoo ({activeSubscribers.filter((s) => s.language === "om").length})</option>
                  <option value="en">🌐 English ({activeSubscribers.filter((s) => s.language === "en").length})</option>
                </select>
              </div>
            </div>

            {emailList.length === 0 && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                ⚠️ No subscribers registered under this language yet. Readers can subscribe via the website footer.
              </p>
            )}
          </div>

          {/* Subject line */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-foreground">
              Email Subject Line
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-xs font-medium text-foreground outline-none focus:border-primary"
            />
          </div>

          {/* Email Preview Card */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5 text-primary" /> Email Preview
              </span>
              <button
                type="button"
                onClick={handleCopyEmails}
                disabled={emailList.length === 0}
                className="flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline disabled:opacity-50"
              >
                {copiedEmails ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
                <span>{copiedEmails ? "Emails Copied!" : "Copy Subscriber Emails"}</span>
              </button>
            </div>

            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
              {/* Fake Email Client Header */}
              <div className="border-b border-border bg-muted/40 px-4 py-2.5 text-[11px] text-muted-foreground flex items-center justify-between">
                <span>From: <strong className="text-foreground">YERAS Media Network</strong> &lt;newsletter@yerasmedia.com&gt;</span>
                <span className="font-mono text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">BCC: {emailList.length} emails</span>
              </div>

              {/* Newsletter Body */}
              <div className="p-5 space-y-3">
                {article.image && (
                  <img
                    src={article.image}
                    alt={article.title}
                    className="h-44 w-full rounded-lg object-cover"
                  />
                )}
                {article.section && (
                  <span className="inline-block rounded bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary uppercase">
                    {article.section}
                  </span>
                )}
                <h3 className="text-base font-bold text-foreground leading-snug">
                  {article.title}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {article.excerpt}
                </p>
                <div className="pt-2">
                  <span className="inline-block rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground">
                    ሙሉውን ዜና ያንብቡ · Read Full Article
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Automated Delivery Information */}
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-xs space-y-2.5">
            <div className="flex items-center gap-2 font-bold text-foreground">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>How News Reaches Subscribers:</span>
            </div>
            <ul className="space-y-1.5 text-muted-foreground pl-1 leading-relaxed text-[11px]">
              <li>
                <strong className="text-foreground">🌐 Webmail (Most Reliable)</strong>: Click{" "}
                <strong className="text-primary">Gmail (Web)</strong> or{" "}
                <strong className="text-primary">Outlook (Web)</strong> to open a pre-filled compose window in your browser with all subscriber emails safely in BCC.
              </li>
              <li>
                <strong className="text-foreground">✉️ Desktop Mail App (mailto:)</strong>: Click{" "}
                <em>"Mail App"</em> to launch your system's default email client (e.g. Apple Mail, Thunderbird, Windows Outlook). <em>(Note: If nothing happens when clicking Mail App, your OS has no desktop mail app installed — use Gmail Web instead).</em>
              </li>
              <li>
                <strong className="text-foreground">⚡ Automated Firebase Delivery</strong>: Click{" "}
                <em>"Queue in Firebase"</em> to dispatch via the Firestore <code>mail</code> collection.
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col gap-3 border-t border-border bg-card px-6 py-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCopyFullDraft}
                disabled={emailList.length === 0}
                className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
                title="Copy Subject, BCCs, and Body to clipboard"
              >
                <Copy className="h-3.5 w-3.5" />
                <span>Copy Draft</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Webmail Direct Buttons */}
              <button
                type="button"
                onClick={handleOpenGmail}
                disabled={emailList.length === 0}
                className="flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3.5 py-1.5 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                title="Open directly in Gmail web browser"
              >
                <Globe className="h-3.5 w-3.5" />
                <span>Gmail (Web)</span>
              </button>

              <button
                type="button"
                onClick={handleOpenOutlook}
                disabled={emailList.length === 0}
                className="flex items-center gap-1.5 rounded-lg border border-sky-500/30 bg-sky-500/10 px-3.5 py-1.5 text-xs font-bold text-sky-600 dark:text-sky-400 hover:bg-sky-500/20 transition-colors disabled:opacity-50"
                title="Open directly in Outlook web browser"
              >
                <Globe className="h-3.5 w-3.5" />
                <span>Outlook (Web)</span>
              </button>

              {/* Standard OS Mail App */}
              <button
                type="button"
                onClick={handleOpenEmailClient}
                disabled={emailList.length === 0}
                className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs disabled:opacity-50"
                title="Open in system desktop mail client (Thunderbird, Apple Mail, Outlook)"
              >
                <Mail className="h-3.5 w-3.5" />
                <span>Mail App ({emailList.length})</span>
              </button>

              {/* Firebase Cloud Trigger */}
              <button
                type="button"
                onClick={handleQueueFirebase}
                disabled={queueing || emailList.length === 0}
                className="flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3.5 py-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-colors disabled:opacity-50"
                title="Queue for automated sending via Firebase"
              >
                <Zap className="h-3.5 w-3.5" />
                <span>Queue in Firebase</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
