import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { SocialLinks } from "./site-header";
import { useLanguage } from "@/contexts/language-context";
import { useContact } from "@/contexts/contact-context";
import { Send, Mail, Phone, MapPin, ExternalLink } from "lucide-react";

export function SiteFooter() {
  const { t, categories } = useLanguage();
  const { contact } = useContact();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 600));
    toast.success(t("subscribedToast"), {
      description: t("subscribedDesc"),
    });
    setEmail("");
    setSubmitting(false);
  };

  const sections = categories.filter((n) => n.slug);
  const half = Math.ceil(sections.length / 2);

  return (
    <footer className="mt-20 border-t border-border bg-ink text-ink-foreground">
      <div className="mx-auto max-w-7xl px-4 py-14">
        {/* Top grid */}
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand & Mission */}
          <div className="lg:col-span-1">
            <Link to="/" className="group block">
              <p className="font-display text-2xl sm:text-3xl font-black text-ink-foreground group-hover:text-gold transition-colors">
                {t("siteName")}
              </p>
              <p className="mt-0.5 text-xs tracking-widest text-ink-foreground/50 uppercase font-semibold">
                {t("siteSubtitle")}
              </p>
            </Link>
            <p className="mt-3.5 text-xs sm:text-sm leading-relaxed text-ink-foreground/70">
              {t("tagline")}
            </p>
            <div className="mt-5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gold mb-2 block">
                {t("followUs")}
              </span>
              <SocialLinks />
            </div>
          </div>

          {/* Sections col 1 */}
          <div>
            <p className="kicker text-gold">{t("sections")}</p>
            <ul className="mt-3.5 space-y-2.5 text-xs sm:text-sm text-ink-foreground/75">
              {sections.slice(0, half).map((n) => (
                <li key={n.slug}>
                  <Link
                    to="/category/$slug"
                    params={{ slug: n.slug }}
                    className="transition-colors hover:text-gold font-medium"
                  >
                    {n.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Sections col 2 */}
          <div>
            <p className="kicker text-gold">{t("more")}</p>
            <ul className="mt-3.5 space-y-2.5 text-xs sm:text-sm text-ink-foreground/75">
              {sections.slice(half).map((n) => (
                <li key={n.slug}>
                  <Link
                    to="/category/$slug"
                    params={{ slug: n.slug }}
                    className="transition-colors hover:text-gold font-medium"
                  >
                    {n.label}
                  </Link>
                </li>
              ))}
              <li className="pt-1">
                <a
                  href="https://ethiopianreporter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-gold/80 transition-colors hover:text-gold font-medium"
                >
                  <span>Ethiopian Reporter</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
            </ul>
          </div>

          {/* Newsletter Box */}
          <div>
            <p className="kicker text-gold">{t("newsletterTitle")}</p>
            <h3 className="mt-3 text-sm sm:text-base font-bold text-ink-foreground">
              {t("newsletterHeading")}
            </h3>
            <p className="mt-1 text-xs text-ink-foreground/60 leading-relaxed">
              {t("newsletterDesc")}
            </p>
            <form onSubmit={handleNewsletter} className="mt-4 flex flex-col gap-2">
              <div className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 focus-within:border-gold/80 transition-colors">
                <Mail className="h-4 w-4 shrink-0 text-ink-foreground/40" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("newsletterPlaceholder")}
                  className="min-w-0 flex-1 bg-transparent text-xs sm:text-sm text-ink-foreground outline-none placeholder:text-ink-foreground/40"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs sm:text-sm font-bold text-primary-foreground shadow transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                <Send className="h-3.5 w-3.5" />
                <span>{submitting ? t("sending") : t("subscribe")}</span>
              </button>
            </form>

            {/* Quick Contact info */}
            <div className="mt-5 space-y-1.5 text-[11px] text-ink-foreground/50 border-t border-white/10 pt-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-3 w-3 text-gold/70 shrink-0" />
                <span>{contact.location || t("edition")}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-3 w-3 text-gold/70 shrink-0" />
                <a
                  href={`mailto:${contact.email || "otemesgen@gmail.com"}`}
                  className="hover:text-gold transition-colors font-medium truncate"
                >
                  {contact.email || "otemesgen@gmail.com"}
                </a>
              </div>
              {contact.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-3 w-3 text-gold/70 shrink-0" />
                  <a
                    href={`tel:${contact.phone}`}
                    className="hover:text-gold transition-colors font-medium"
                  >
                    {contact.phone}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center gap-3 border-t border-white/10 pt-6 text-xs text-ink-foreground/50 sm:flex-row sm:justify-between">
          <p>
            © {new Date().getFullYear()} {t("copyright")}
          </p>
          <div className="flex items-center gap-4 text-xs font-medium">
            <Link to="/" className="hover:text-gold transition-colors">
              {t("home")}
            </Link>
            <Link to="/admin" className="hover:text-gold transition-colors">
              {t("admin")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
