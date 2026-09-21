import { useState, useMemo } from "react";
import { type ArticleForNewsletter, generateEmailHtml, generateEmailText, buildMailtoUrl, queueFirebaseMail, logNewsletterBroadcast } from "@/lib/newsletter-service";
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
  const [subject, setSubject] = useState(`📰 [Sisay Mengiste News] ${article.title}`);
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

    const mailto = buildMailtoUrl(emailList, subject, emailText);
    window.open(mailto, "_blank");

    void logNewsletterBroadcast({
      articleId: article.id,
      title: article.title,
      recipientCount: emailList.length,
      method: "mailto",
    });

    toast.success(`Opening mail client with ${emailList.length} BCC subscribers!`);
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
                <span>From: <strong className="text-foreground">Sisay Mengiste News</strong> &lt;newsletter@sisaymengiste.com&gt;</span>
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
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-foreground">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>How News Reaches Subscribers:</span>
            </div>
            <ol className="list-decimal list-inside space-y-1.5 text-muted-foreground pl-1 leading-relaxed text-[11px]">
              <li>
                <strong className="text-foreground">Instant Option (Gmail / Mail App)</strong>: Click{" "}
                <em>"Send via Mail App"</em> to open Gmail or Outlook with all subscriber emails placed in <strong>BCC</strong> for reader privacy.
              </li>
              <li>
                <strong className="text-foreground">Automated Cloud Delivery</strong>: Click{" "}
                <em>"Queue in Firebase"</em> to write to the Firestore <code>mail</code> collection, which connects with the free <strong>Trigger Email from Firestore</strong> extension.
              </li>
            </ol>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border bg-card px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto rounded-lg border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
          >
            Cancel
          </button>

          <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleQueueFirebase}
              disabled={queueing || emailList.length === 0}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-4 py-2 text-xs font-bold text-primary hover:bg-primary/20 transition-colors disabled:opacity-50"
            >
              <Zap className="h-3.5 w-3.5" />
              <span>Queue in Firebase</span>
            </button>

            <button
              type="button"
              onClick={handleOpenEmailClient}
              disabled={emailList.length === 0}
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs disabled:opacity-50"
            >
              <Mail className="h-3.5 w-3.5" />
              <span>Send via Mail App ({emailList.length})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
