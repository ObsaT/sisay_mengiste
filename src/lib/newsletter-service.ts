import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";
import { type Subscriber } from "./subscribers-service";

export interface ArticleForNewsletter {
  id?: string;
  title: string;
  excerpt: string;
  slug?: string;
  image?: string;
  section?: string;
  author?: string;
  readTime?: number;
}

/**
 * Generate a responsive, professional HTML newsletter email for an article.
 */
export function generateEmailHtml(article: ArticleForNewsletter, siteUrl?: string): string {
  const base = siteUrl || window.location.origin;
  const articleUrl = article.slug ? `${base}/sisay_mengiste/article/${article.slug}` : base;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${article.title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 20px; color: #18181b; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
    .header { background: #09090b; padding: 24px; text-align: center; border-bottom: 3px solid #d97706; }
    .header h1 { margin: 0; color: #ffffff; font-size: 24px; font-weight: 900; letter-spacing: -0.5px; }
    .header p { margin: 4px 0 0 0; color: #fbbf24; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 700; }
    .cover-image { width: 100%; max-height: 320px; object-fit: cover; display: block; }
    .content { padding: 32px 28px; }
    .kicker { display: inline-block; background: #fef3c7; color: #92400e; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 4px; text-transform: uppercase; margin-bottom: 12px; }
    .title { font-size: 22px; font-weight: 800; line-height: 1.35; margin: 0 0 12px 0; color: #09090b; }
    .meta { font-size: 12px; color: #71717a; margin-bottom: 20px; }
    .excerpt { font-size: 15px; line-height: 1.6; color: #3f3f46; margin: 0 0 28px 0; border-left: 3px solid #d97706; padding-left: 16px; font-style: italic; }
    .btn-container { text-align: center; margin-bottom: 12px; }
    .btn { display: inline-block; background: #d97706; color: #ffffff !important; font-weight: 700; font-size: 14px; padding: 14px 28px; text-decoration: none; border-radius: 8px; box-shadow: 0 2px 4px rgba(217, 119, 6, 0.3); }
    .footer { background: #f4f4f5; padding: 20px; text-align: center; font-size: 11px; color: #71717a; border-top: 1px solid #e4e4e7; }
    .footer a { color: #d97706; text-decoration: underline; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>የራስ · YERAS</h1>
      <p>የራስ ሚዲያ ኔትወርክ (YERAS Media Network) · Daily Morning Briefing</p>
    </div>
    ${article.image ? `<img src="${article.image}" alt="${article.title}" class="cover-image" />` : ""}
    <div class="content">
      ${article.section ? `<span class="kicker">${article.section}</span>` : ""}
      <h2 class="title">${article.title}</h2>
      <div class="meta">
        By ${article.author || "Editorial Desk"} · ~${article.readTime || 3} min read
      </div>
      <div class="excerpt">
        ${article.excerpt}
      </div>
      <div class="btn-container">
        <a href="${articleUrl}" class="btn" target="_blank">ሙሉውን ዜና ያንብቡ · Read Full Article</a>
      </div>
    </div>
    <div class="footer">
      <p>You received this because you subscribed to updates at <a href="${base}">YERAS Media Network</a>.</p>
      <p>© ${new Date().getFullYear()} YERAS Media Network. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Generate plain text fallback for email clients that do not render HTML.
 */
export function generateEmailText(article: ArticleForNewsletter, siteUrl?: string): string {
  const base = siteUrl || window.location.origin;
  const articleUrl = article.slug ? `${base}/sisay_mengiste/article/${article.slug}` : base;

  return `
[YERAS Media Network - Daily Briefing]

${article.title.toUpperCase()}
By: ${article.author || "Editorial Desk"} (${article.section || "News"})

${article.excerpt}

Read the full article online:
${articleUrl}

---
You received this because you subscribed to updates at ${base}
© ${new Date().getFullYear()} YERAS Media Network
  `.trim();
}

/**
 * Safely constructs a mailto: link with BCC populated with subscribers.
 * Enforces a conservative 1,800 character limit to prevent silent browser/OS drops
 * (especially when subject or excerpt contains multi-byte UTF-8 Ethiopic characters).
 */
export function buildMailtoUrl(
  recipients: string[],
  subject: string,
  body: string,
): { url: string; isTrimmed: boolean } {
  const bccPart = recipients.length > 0 ? `bcc=${encodeURIComponent(recipients.join(","))}` : "";
  const subPart = `subject=${encodeURIComponent(subject)}`;
  const prefix = `mailto:?${[bccPart, subPart].filter(Boolean).join("&")}&body=`;

  const MAX_SAFE_URL_LEN = 1800;
  const encodedBody = encodeURIComponent(body);

  if (prefix.length + encodedBody.length <= MAX_SAFE_URL_LEN) {
    return { url: `${prefix}${encodedBody}`, isTrimmed: false };
  }

  // If too long, trim body to fit within limit
  const allowedEncodedLen = Math.max(80, MAX_SAFE_URL_LEN - prefix.length - 80);
  let trimmed = body;
  while (encodeURIComponent(trimmed + "\n\n...").length > allowedEncodedLen && trimmed.length > 20) {
    trimmed = trimmed.slice(0, Math.floor(trimmed.length * 0.8));
  }

  const safeBody = `${trimmed}\n\n[Full story attached in clipboard]`;
  return {
    url: `${prefix}${encodeURIComponent(safeBody)}`,
    isTrimmed: true,
  };
}

/**
 * Builds direct Webmail Compose URLs for in-browser email creation.
 * These bypass OS desktop client limitations and work on any device.
 */
export function buildGmailWebUrl(recipients: string[], subject: string, body: string): string {
  const bcc = encodeURIComponent(recipients.join(","));
  const sub = encodeURIComponent(subject);
  const bod = encodeURIComponent(body);
  return `https://mail.google.com/mail/?view=cm&fs=1&bcc=${bcc}&su=${sub}&body=${bod}`;
}

export function buildOutlookWebUrl(recipients: string[], subject: string, body: string): string {
  const bcc = encodeURIComponent(recipients.join(","));
  const sub = encodeURIComponent(subject);
  const bod = encodeURIComponent(body);
  return `https://outlook.live.com/mail/0/deeplink/compose?bcc=${bcc}&subject=${sub}&body=${bod}`;
}

export function buildYahooWebUrl(recipients: string[], subject: string, body: string): string {
  const bcc = encodeURIComponent(recipients.join(","));
  const sub = encodeURIComponent(subject);
  const bod = encodeURIComponent(body);
  return `https://compose.mail.yahoo.com/?bcc=${bcc}&subject=${sub}&body=${bod}`;
}

/**
 * Safely triggers a mailto: link in the DOM without opening an unwanted about:blank tab.
 */
export function triggerMailto(url: string): void {
  const link = document.createElement("a");
  link.href = url;
  link.target = "_self";
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    if (document.body.contains(link)) {
      document.body.removeChild(link);
    }
  }, 400);
}

/**
 * Queue an email document into Firestore `mail` collection (Standard Firebase Trigger Email Extension schema).
 */
export async function queueFirebaseMail(
  recipients: string[],
  subject: string,
  html: string,
  text: string,
): Promise<void> {
  if (recipients.length === 0) return;

  try {
    const mailCol = collection(db, "mail");
    await addDoc(mailCol, {
      to: recipients,
      message: {
        subject,
        html,
        text,
      },
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn("Could not write to Firestore mail collection:", err);
  }
}

/**
 * Log broadcast to Firestore `newsletter_broadcasts`.
 */
export async function logNewsletterBroadcast(record: {
  articleId?: string;
  title: string;
  recipientCount: number;
  method: "mailto" | "firebase_mail" | "manual";
}): Promise<void> {
  try {
    const broadcastsCol = collection(db, "newsletter_broadcasts");
    await addDoc(broadcastsCol, {
      ...record,
      sentAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn("Could not log broadcast event:", err);
  }
}
