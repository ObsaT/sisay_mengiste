import { useLanguage } from "@/contexts/language-context";
import { useContact } from "@/contexts/contact-context";
import { ExternalLink, Sparkles } from "lucide-react";

export type AdVariant = "leaderboard" | "sidebar" | "in-article" | "billboard";

interface AdBannerProps {
  variant?: AdVariant;
  imageUrl?: string;
  linkUrl?: string;
  title?: string;
  sponsorName?: string;
  className?: string;
}

export function AdBanner({
  variant = "leaderboard",
  imageUrl,
  linkUrl,
  title,
  sponsorName,
  className = "",
}: AdBannerProps) {
  const { language } = useLanguage();
  const { contact } = useContact();

  const effectiveLinkUrl =
    linkUrl ||
    `mailto:${contact.advertisingEmail || contact.email || "otemesgen@gmail.com"}?subject=Advertising%20Inquiry`;

  const labelMap = {
    am: "ማስታወቂያ",
    om: "Beeksisa",
    en: "Advertisement",
  };

  const adLabel = labelMap[language] || "Advertisement";

  // ── 1. Leaderboard (Top Billboard: 728x90 / responsive) ───
  if (variant === "leaderboard") {
    return (
      <div className={`mx-auto max-w-7xl px-4 py-4 ${className}`}>
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-1">
            {adLabel}
          </span>
          <a
            href={effectiveLinkUrl}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="group relative flex w-full items-center justify-between overflow-hidden rounded-xl border border-border/80 bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900 p-4 sm:p-5 text-white shadow-sm transition-all hover:border-primary/50 hover:shadow-md"
          >
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={title || adLabel}
                className="h-20 w-full object-cover rounded-lg"
              />
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold/20 text-gold border border-gold/30">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gold">
                      {sponsorName || "Sponsored Partner"}
                    </span>
                    <h4 className="font-display text-sm sm:text-base font-bold text-white group-hover:text-gold transition-colors">
                      {title || (language === "am"
                        ? "እዚህ ጋር ማስታወቂያዎን ያስተዋውቁ — ከ500,000+ በላይ አንባቢዎች ጋር ይገናኙ"
                        : language === "om"
                        ? "Beeksisa keessan asirratti beeksisaa — Dubbistoota 500,000+ bira ga'aa"
                        : "Advertise with Sisay Mengiste Media — Reach 500,000+ Engaged Readers")}
                    </h4>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 self-start sm:self-center rounded-lg bg-primary px-3.5 py-1.5 text-xs font-bold text-primary-foreground shadow transition-transform group-hover:scale-105 shrink-0">
                  <span>{language === "am" ? "ያግኙን" : language === "om" ? "Nu Qunnamaa" : "Advertise"}</span>
                  <ExternalLink className="h-3 w-3" />
                </span>
              </div>
            )}
          </a>
        </div>
      </div>
    );
  }

  // ── 2. Sidebar Ad Unit (Medium Rectangle: 300x250) ────────
  if (variant === "sidebar") {
    return (
      <div className={`flex flex-col items-center ${className}`}>
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-1">
          {adLabel}
        </span>
        <a
          href={effectiveLinkUrl}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="group relative flex flex-col justify-between w-full min-h-[220px] rounded-2xl border border-border/80 bg-gradient-to-b from-card to-muted/40 p-5 shadow-xs transition-all hover:border-primary/40 hover:shadow-md"
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={title || adLabel}
              className="h-44 w-full object-cover rounded-xl"
            />
          ) : (
            <>
              <div className="space-y-2">
                <span className="inline-block rounded bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                  {sponsorName || "Media Partnership"}
                </span>
                <h4 className="font-display text-base font-bold text-foreground group-hover:text-primary transition-colors leading-snug">
                  {title || (language === "am"
                    ? "ንግድዎን በሲሳይ መንግስቴ ድረ-ገጽ ላይ ያሳድጉ"
                    : language === "om"
                    ? "Daldala keessan marsariitii Siisaay Mangistee irratti beeksisaa"
                    : "Grow Your Brand with Sisay Mengiste Media")}
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {language === "am"
                    ? "ለዋና ዋና ቢዝነሶችና ድርጅቶች ተደራሽ የማስታወቂያ ቦታዎች።"
                    : language === "om"
                    ? "Iddoo beeksisaa qulqullina qabu dhaabbilee daldalaatiif."
                    : "Targeted digital display placements across all editorial sections."}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs font-bold text-primary">
                <span>{language === "am" ? "ዝርዝሩን ይመልከቱ" : language === "om" ? "Bal'ina Ilaali" : "Learn More"}</span>
                <ExternalLink className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </div>
            </>
          )}
        </a>
      </div>
    );
  }

  // ── 3. In-Article Ad Unit (Fluid Inline Banner) ───────────
  if (variant === "in-article") {
    return (
      <div className={`my-8 border-y border-border/80 bg-muted/20 py-4 px-4 sm:px-6 rounded-2xl ${className}`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
            {adLabel}
          </span>
          <span className="text-[10px] text-muted-foreground font-medium">
            {sponsorName || "Sponsored"}
          </span>
        </div>
        <a
          href={effectiveLinkUrl}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-border/60 bg-card p-4 transition-all hover:border-primary/40 hover:shadow-sm"
        >
          <div className="flex items-center gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                {title || (language === "am"
                  ? "የንግድዎን ማስታወቂያ በዚህ ክፍል ማስተዋወቅ ይፈልጋሉ?"
                  : language === "om"
                  ? "Beeksisa daldala keessanii asirratti beeksisuu barbaadduu?"
                  : "Looking to feature your brand inside our top editorial stories?")}
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                {language === "am"
                  ? "የማስታወቂያ ቡድናችንን አሁኑኑ ያነጋግሩ።"
                  : language === "om"
                  ? "Gareen beeksisaa keenya isin gargaaruuf qophiidha."
                  : "Connect with our advertising team for high-visibility spots."}
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors shrink-0">
            <span>{language === "am" ? "አግኙን" : language === "om" ? "Nu Qunnamaa" : "Inquire"}</span>
            <ExternalLink className="h-3 w-3" />
          </span>
        </a>
      </div>
    );
  }

  // ── 4. Billboard / Mid-Page Spotlight ─────────────────────
  return (
    <div className={`my-10 ${className}`}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
          {adLabel}
        </span>
      </div>
      <a
        href={effectiveLinkUrl}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="group relative block overflow-hidden rounded-2xl border border-border/80 bg-ink p-6 sm:p-8 text-white shadow-lg transition-all hover:shadow-xl"
      >
        <div className="relative z-10 max-w-xl">
          <span className="rounded-full bg-gold/20 px-3 py-0.5 text-xs font-bold text-gold border border-gold/30">
            {sponsorName || "Special Feature"}
          </span>
          <h3 className="mt-3 font-display text-xl sm:text-2xl font-black text-white group-hover:text-gold transition-colors">
            {title || (language === "am"
              ? "የኢትዮጵያን ግንባር ቀደም ሚዲያ መድረክ ይቀላቀሉ"
              : language === "om"
              ? "Maddawwan oduu beekamoo Itoophiyaa waliin hojjedhaa"
              : "Partner with Ethiopia's Leading Independent News Platform")}
          </h3>
          <p className="mt-2 text-xs sm:text-sm text-ink-foreground/75 leading-relaxed">
            {language === "am"
              ? "በቴሌግራም፣ ፌስቡክና ድረ-ገጻችን ላይ ሰፊ ሽፋን ያግኙ።"
              : language === "om"
              ? "Telegram, Facebook fi marsariitii keenya irratti beekamtii bal'aa argadhaa."
              : "Amplify your message with omnichannel coverage across web, Telegram, and social."}
          </p>
          <div className="mt-4 flex items-center gap-2 text-xs font-bold text-gold">
            <span>{language === "am" ? "የማስታወቂያ መረጃ" : language === "om" ? "Odeeffannoo Beeksisaa" : "Media Kit & Rates"}</span>
            <ExternalLink className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      </a>
    </div>
  );
}
