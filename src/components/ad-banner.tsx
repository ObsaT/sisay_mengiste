import { useState, useEffect, useRef } from "react";
import { useLanguage } from "@/contexts/language-context";
import { useContact } from "@/contexts/contact-context";
import { useAds } from "@/contexts/ads-context";
import { getActiveAds, type AdItem, type AdSlotConfig } from "@/lib/ads-settings";
import {
  ExternalLink,
  Sparkles,
  Tag,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Film,
} from "lucide-react";

export type AdVariant = "leaderboard" | "sidebar" | "in-article" | "billboard";

interface AdBannerProps {
  variant?: AdVariant;
  customSlot?: AdSlotConfig;
  imageUrl?: string;
  linkUrl?: string;
  title?: string;
  sponsorName?: string;
  description?: string;
  ctaText?: string;
  displayStyle?: "card" | "banner";
  className?: string;
}

function CarouselControls({
  count,
  current,
  isPaused,
  isSlideshow,
  onTogglePause,
  onPrev,
  onNext,
  onSelect,
  className = "",
}: {
  count: number;
  current: number;
  isPaused: boolean;
  isSlideshow: boolean;
  onTogglePause: (e: React.MouseEvent) => void;
  onPrev: (e: React.MouseEvent) => void;
  onNext: (e: React.MouseEvent) => void;
  onSelect: (idx: number, e: React.MouseEvent) => void;
  className?: string;
}) {
  if (count <= 1) return null;

  return (
    <div
      className={`inline-flex items-center gap-1.5 bg-background/90 backdrop-blur-xs px-2 py-0.5 rounded-full border border-border/70 text-[10px] font-bold text-muted-foreground shadow-2xs ${className}`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      {isSlideshow && (
        <button
          type="button"
          onClick={onTogglePause}
          aria-label={isPaused ? "Resume slideshow" : "Pause slideshow"}
          className="p-0.5 rounded-full hover:bg-muted text-foreground/70 hover:text-foreground transition-colors cursor-pointer"
          title={isPaused ? "Play Slideshow" : "Pause Slideshow"}
        >
          {isPaused ? (
            <Play className="h-2.5 w-2.5 text-primary fill-primary" />
          ) : (
            <Pause className="h-2.5 w-2.5 text-muted-foreground" />
          )}
        </button>
      )}

      <button
        type="button"
        onClick={onPrev}
        aria-label="Previous advertisement"
        className="p-0.5 rounded-full hover:bg-muted text-foreground/70 hover:text-foreground transition-colors cursor-pointer"
        title="Previous Ad"
      >
        <ChevronLeft className="h-3 w-3" />
      </button>

      <div className="flex items-center gap-1 px-0.5">
        {Array.from({ length: count }).map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={(e) => onSelect(i, e)}
            aria-label={`Go to advertisement ${i + 1}`}
            className={`transition-all duration-300 rounded-full cursor-pointer ${
              i === current
                ? "h-1.5 w-3.5 bg-primary"
                : "h-1.5 w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/60"
            }`}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={onNext}
        aria-label="Next advertisement"
        className="p-0.5 rounded-full hover:bg-muted text-foreground/70 hover:text-foreground transition-colors cursor-pointer"
        title="Next Ad"
      >
        <ChevronRight className="h-3 w-3" />
      </button>
    </div>
  );
}

export function AdBanner({
  variant = "leaderboard",
  customSlot,
  imageUrl,
  linkUrl,
  title,
  sponsorName,
  description,
  ctaText,
  displayStyle,
  className = "",
}: AdBannerProps) {
  const { language } = useLanguage();
  const { contact } = useContact();
  const { ads } = useAds();
  const [imgLoadError, setImgLoadError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isManualPaused, setIsManualPaused] = useState(false);
  const [slideDirection, setSlideDirection] = useState<"right" | "left">("right");

  // Combined pause state
  const isPaused = isHovered || isManualPaused;

  // Allow custom slot override (e.g. for Admin Live Simulator)
  const slot = customSlot || ads.slots[variant];

  // If slot is disabled by admin, hide completely
  if (slot && !slot.enabled) {
    return null;
  }

  // Active ads for this slot
  const activeAds = getActiveAds(slot);
  const rotationStrategy = slot?.rotationStrategy || "slideshow";
  const rotationInterval = Math.max(3, slot?.rotationIntervalSeconds || 6) * 1000;
  const isSlideshow = rotationStrategy === "slideshow";

  const [currentIndex, setCurrentIndex] = useState(0);
  const randomizedRef = useRef(false);

  // Keep index within bounds & trigger initial random ad if configured
  useEffect(() => {
    if (activeAds.length === 0) {
      setCurrentIndex(0);
      return;
    }

    if (rotationStrategy === "random" && !randomizedRef.current) {
      randomizedRef.current = true;
      setCurrentIndex(Math.floor(Math.random() * activeAds.length));
    } else if (currentIndex >= activeAds.length) {
      setCurrentIndex(0);
    }
  }, [activeAds.length, rotationStrategy, currentIndex]);

  // Timed auto-rotation (for slideshow and carousel modes)
  useEffect(() => {
    if (activeAds.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      setSlideDirection("right");
      setCurrentIndex((prev) => {
        if (rotationStrategy === "random") {
          if (activeAds.length === 2) {
            return prev === 0 ? 1 : 0;
          }
          let next = Math.floor(Math.random() * activeAds.length);
          if (next === prev) {
            next = (prev + 1) % activeAds.length;
          }
          return next;
        }
        return (prev + 1) % activeAds.length;
      });
    }, rotationInterval);

    return () => clearInterval(timer);
  }, [activeAds.length, rotationStrategy, rotationInterval, isPaused]);

  // Reset img error on ad change
  useEffect(() => {
    setImgLoadError(false);
  }, [currentIndex]);

  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (activeAds.length <= 1) return;
    setSlideDirection("left");
    setCurrentIndex((prev) => (prev - 1 + activeAds.length) % activeAds.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (activeAds.length <= 1) return;
    setSlideDirection("right");
    setCurrentIndex((prev) => (prev + 1) % activeAds.length);
  };

  const handleSelect = (idx: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSlideDirection(idx >= currentIndex ? "right" : "left");
    setCurrentIndex(idx);
  };

  const handleTogglePause = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsManualPaused((prev) => !prev);
  };

  // Current active ad
  const activeAd: AdItem | undefined = activeAds[currentIndex] || activeAds[0];

  const effectiveImageUrl = !imgLoadError
    ? (imageUrl || activeAd?.imageUrl || slot?.imageUrl || "")
    : "";
  const effectiveSponsorName = sponsorName || activeAd?.sponsorName || slot?.sponsorName;
  const effectiveTitle = title || activeAd?.title || slot?.title;
  const effectiveDescription = description || activeAd?.description || slot?.description;
  const effectiveCtaText = ctaText || activeAd?.ctaText || slot?.ctaText;
  const effectiveDisplayStyle =
    displayStyle || activeAd?.displayStyle || slot?.displayStyle || "card";
  const openInNewTab = (activeAd?.openInNewTab ?? slot?.openInNewTab) !== false;

  const effectiveLinkUrl =
    linkUrl ||
    activeAd?.linkUrl ||
    slot?.linkUrl ||
    `mailto:${contact.advertisingEmail || contact.email || "otemesgen@gmail.com"}?subject=Advertising%20Inquiry`;

  const isMailto = effectiveLinkUrl.startsWith("mailto:");
  const linkTarget = isMailto ? undefined : (openInNewTab ? "_blank" : undefined);

  // Standardized Ad Disclosures (FTC / IAB Compliance)
  const labelMap = {
    am: "ማስታወቂያ",
    om: "Beeksisa",
    en: "Advertisement",
  };
  const adLabel = labelMap[language] || "Advertisement";

  const defaultCtaMap = {
    am: "ዝርዝሩን ይመልከቱ",
    om: "Bal'ina Ilaali",
    en: "Visit Sponsor",
  };
  const fallbackCta = defaultCtaMap[language] || "Visit Sponsor";
  const actionButtonText = effectiveCtaText || fallbackCta;

  const hasMultipleAds = activeAds.length > 1;

  // Determine transition animation class
  const transitionClass = isSlideshow
    ? slideDirection === "right"
      ? "animate-ad-slide-right w-full"
      : "animate-ad-slide-left w-full"
    : "transition-all duration-300 animate-in fade-in w-full";

  // ─────────────────────────────────────────────────────────────
  // 1. LEADERBOARD (Top Billboard Banner: 728×90 / responsive)
  // ─────────────────────────────────────────────────────────────
  if (variant === "leaderboard") {
    return (
      <div
        className={`mx-auto max-w-7xl px-4 py-3 ${className}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* IAB Disclosure Header */}
        <div className="flex items-center justify-between px-1 mb-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 flex items-center gap-1">
              <Tag className="h-2.5 w-2.5 text-primary/70" />
              <span>{adLabel}</span>
            </span>
            {hasMultipleAds && (
              <CarouselControls
                count={activeAds.length}
                current={currentIndex}
                isPaused={isPaused}
                isSlideshow={isSlideshow}
                onTogglePause={handleTogglePause}
                onPrev={handlePrev}
                onNext={handleNext}
                onSelect={handleSelect}
              />
            )}
          </div>
          {effectiveSponsorName && (
            <span className="text-[10px] font-medium text-muted-foreground/80">
              Sponsored by <span className="font-semibold text-foreground/90">{effectiveSponsorName}</span>
            </span>
          )}
        </div>

        <a
          href={effectiveLinkUrl}
          target={linkTarget}
          rel="noopener noreferrer sponsored"
          className="group relative flex w-full flex-col sm:flex-row sm:items-center justify-between overflow-hidden rounded-2xl border border-border/80 bg-card hover:bg-muted/30 p-3.5 sm:p-4 text-foreground shadow-xs transition-all hover:border-primary/50 hover:shadow-md gap-4"
        >
          <div
            key={activeAd?.id || `leaderboard-${currentIndex}`}
            className={`flex flex-col sm:flex-row sm:items-center justify-between w-full gap-4 ${transitionClass}`}
          >
            {effectiveDisplayStyle === "banner" && effectiveImageUrl ? (
              // Full Graphic Banner with Hover Badge
              <div className="relative w-full overflow-hidden rounded-xl bg-neutral-950">
                <img
                  src={effectiveImageUrl}
                  alt={effectiveTitle || effectiveSponsorName || adLabel}
                  loading="lazy"
                  decoding="async"
                  onError={() => setImgLoadError(true)}
                  className="h-20 sm:h-24 w-full object-cover rounded-xl transition-transform duration-300 group-hover:scale-[1.01]"
                />
                <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-lg bg-black/75 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-md transition-transform group-hover:scale-105">
                  <span>{actionButtonText}</span>
                  <ExternalLink className="h-3 w-3" />
                </div>
              </div>
            ) : (
              // Native Ad Unit: Image Thumbnail + Sponsor + Headline + Description + Button
              <>
                <div className="flex items-center gap-3.5 min-w-0">
                  {effectiveImageUrl ? (
                    <div className="relative h-16 w-24 sm:h-20 sm:w-32 shrink-0 overflow-hidden rounded-xl border border-border/60 bg-muted">
                      <img
                        src={effectiveImageUrl}
                        alt={effectiveTitle || effectiveSponsorName || adLabel}
                        loading="lazy"
                        decoding="async"
                        onError={() => setImgLoadError(true)}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                  ) : (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gold/15 text-gold border border-gold/30">
                      <Sparkles className="h-6 w-6" />
                    </div>
                  )}

                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                        {effectiveSponsorName || "Featured Partner"}
                      </span>
                    </div>
                    <h4 className="font-display text-sm sm:text-base font-bold text-foreground group-hover:text-primary transition-colors truncate">
                      {effectiveTitle || (language === "am"
                        ? "እዚህ ጋር ማስታወቂያዎን ያስተዋውቁ — ከ500,000+ በላይ አንባቢዎች ጋር ይገናኙ"
                        : language === "om"
                        ? "Beeksisa keessan asirratti beeksisaa — Dubbistoota 500,000+ bira ga'aa"
                        : "Advertise with YERAS Media Network — Reach 500,000+ Engaged Readers")}
                    </h4>
                    {effectiveDescription ? (
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {effectiveDescription}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground/80 line-clamp-1">
                        {language === "am"
                          ? "ተደራሽ የዲጂታል ማስታወቂያዎች በድረ-ገጻችን እና ማህበራዊ ገጾቻችን።"
                          : language === "om"
                          ? "Iddoo beeksisaa qulqullina qabu dhaabbilee daldalaatiif."
                          : "High-impact digital display across all editorial news sections."}
                      </p>
                    )}
                  </div>
                </div>

                {/* Action Button */}
                <span className="inline-flex items-center gap-1.5 self-start sm:self-center rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-xs transition-all group-hover:scale-105 shrink-0">
                  <span>{actionButtonText}</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </span>
              </>
            )}
          </div>

          {/* Slideshow Progress Bar */}
          {isSlideshow && hasMultipleAds && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/5 dark:bg-white/10 overflow-hidden">
              <div
                key={`bar-leaderboard-${currentIndex}-${isPaused}`}
                className="h-full bg-primary"
                style={{
                  animation: isPaused ? "none" : `adProgressBarAnim ${rotationInterval}ms linear forwards`,
                  width: isPaused ? "100%" : undefined,
                }}
              />
            </div>
          )}
        </a>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 2. SIDEBAR (Medium Rectangle: 300×250 / 336×280)
  // ─────────────────────────────────────────────────────────────
  if (variant === "sidebar") {
    return (
      <div
        className={`flex flex-col w-full ${className}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Disclosure Bar */}
        <div className="flex items-center justify-between px-1 mb-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 flex items-center gap-1">
              <Tag className="h-2.5 w-2.5 text-primary/70" />
              <span>{adLabel}</span>
            </span>
            {hasMultipleAds && (
              <CarouselControls
                count={activeAds.length}
                current={currentIndex}
                isPaused={isPaused}
                isSlideshow={isSlideshow}
                onTogglePause={handleTogglePause}
                onPrev={handlePrev}
                onNext={handleNext}
                onSelect={handleSelect}
              />
            )}
          </div>
          {effectiveSponsorName && (
            <span className="text-[10px] text-muted-foreground/80 truncate max-w-[130px]">
              {effectiveSponsorName}
            </span>
          )}
        </div>

        <a
          href={effectiveLinkUrl}
          target={linkTarget}
          rel="noopener noreferrer sponsored"
          className="group relative flex flex-col justify-between w-full overflow-hidden rounded-2xl border border-border/80 bg-card hover:bg-muted/20 shadow-xs transition-all hover:border-primary/40 hover:shadow-md"
        >
          <div
            key={activeAd?.id || `sidebar-${currentIndex}`}
            className={`w-full ${transitionClass}`}
          >
            {effectiveImageUrl ? (
              <div>
                {/* Image banner */}
                <div className="relative h-44 w-full overflow-hidden bg-muted">
                  <img
                    src={effectiveImageUrl}
                    alt={effectiveTitle || effectiveSponsorName || adLabel}
                    loading="lazy"
                    decoding="async"
                    onError={() => setImgLoadError(true)}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <span className="absolute top-2.5 left-2.5 rounded-md bg-black/70 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
                    {effectiveSponsorName || "Sponsored"}
                  </span>
                </div>

                {/* Text info & Button */}
                <div className="p-4 space-y-2">
                  <h4 className="font-display text-sm font-bold text-foreground group-hover:text-primary transition-colors leading-snug line-clamp-2">
                    {effectiveTitle || (language === "am"
                      ? "ንግድዎን በየራስ ሚዲያ ኔትወርክ ላይ ያሳድጉ"
                      : language === "om"
                      ? "Daldala keessan Midiyaa YERAS irratti beeksisaa"
                      : "Grow Your Brand with YERAS Media Network")}
                  </h4>
                  {effectiveDescription && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {effectiveDescription}
                    </p>
                  )}

                  <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs font-bold text-primary">
                    <span>{actionButtonText}</span>
                    <ExternalLink className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </div>
            ) : (
              // Rich editorial fallback card
              <div className="p-5 space-y-3">
                <span className="inline-block rounded bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                  {effectiveSponsorName || "Media Partnership"}
                </span>
                <h4 className="font-display text-base font-bold text-foreground group-hover:text-primary transition-colors leading-snug">
                  {effectiveTitle || (language === "am"
                    ? "ንግድዎን በየራስ ሚዲያ ኔትወርክ ላይ ያሳድጉ"
                    : language === "om"
                    ? "Daldala keessan Midiyaa YERAS irratti beeksisaa"
                    : "Grow Your Brand with YERAS Media Network")}
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {effectiveDescription || (language === "am"
                    ? "ለዋና ዋና ቢዝነሶችና ድርጅቶች ተደራሽ የማስታወቂያ ቦታዎች።"
                    : language === "om"
                    ? "Iddoo beeksisaa qulqullina qabu dhaabbilee daldalaatiif."
                    : "Targeted digital display placements across all editorial sections.")}
                </p>
                <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs font-bold text-primary">
                  <span>{actionButtonText}</span>
                  <ExternalLink className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            )}
          </div>

          {/* Slideshow Progress Bar */}
          {isSlideshow && hasMultipleAds && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/5 dark:bg-white/10 overflow-hidden">
              <div
                key={`bar-sidebar-${currentIndex}-${isPaused}`}
                className="h-full bg-primary"
                style={{
                  animation: isPaused ? "none" : `adProgressBarAnim ${rotationInterval}ms linear forwards`,
                  width: isPaused ? "100%" : undefined,
                }}
              />
            </div>
          )}
        </a>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 3. IN-ARTICLE (Inline Fluid Interstitial Unit)
  // ─────────────────────────────────────────────────────────────
  if (variant === "in-article") {
    return (
      <div
        className={`my-8 border-y border-border/80 bg-muted/20 py-4 px-4 sm:px-6 rounded-2xl ${className}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Disclosure */}
        <div className="flex items-center justify-between mb-2 px-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 flex items-center gap-1">
              <Tag className="h-2.5 w-2.5 text-primary/70" />
              <span>{adLabel}</span>
            </span>
            {hasMultipleAds && (
              <CarouselControls
                count={activeAds.length}
                current={currentIndex}
                isPaused={isPaused}
                isSlideshow={isSlideshow}
                onTogglePause={handleTogglePause}
                onPrev={handlePrev}
                onNext={handleNext}
                onSelect={handleSelect}
              />
            )}
          </div>
          <span className="text-[10px] text-muted-foreground font-medium">
            {effectiveSponsorName ? `Sponsored • ${effectiveSponsorName}` : "Sponsored Story"}
          </span>
        </div>

        <a
          href={effectiveLinkUrl}
          target={openInNewTab ? "_blank" : undefined}
          rel="noopener noreferrer sponsored"
          className="group relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-border/70 bg-card p-4 transition-all hover:border-primary/50 hover:shadow-sm"
        >
          <div
            key={activeAd?.id || `in-article-${currentIndex}`}
            className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full ${transitionClass}`}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3.5 flex-1 min-w-0">
              {effectiveImageUrl ? (
                <img
                  src={effectiveImageUrl}
                  alt={effectiveTitle || effectiveSponsorName || adLabel}
                  loading="lazy"
                  decoding="async"
                  onError={() => setImgLoadError(true)}
                  className="h-28 sm:h-20 w-full sm:w-32 object-cover rounded-xl border border-border/60 shrink-0 transition-transform group-hover:scale-105"
                />
              ) : (
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Sparkles className="h-5 w-5" />
                </div>
              )}

              <div className="min-w-0 space-y-0.5">
                {effectiveSponsorName && (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                    {effectiveSponsorName}
                  </span>
                )}
                <h4 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                  {effectiveTitle || (language === "am"
                    ? "የንግድዎን ማስታወቂያ በዚህ ክፍል ማስተዋወቅ ይፈልጋሉ?"
                    : language === "om"
                    ? "Beeksisa daldala keessanii asirratti beeksisuu barbaadduu?"
                    : "Feature your brand inside Ethiopia's most engaged stories")}
                </h4>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {effectiveDescription || (language === "am"
                    ? "የማስታወቂያ ቡድናችንን አሁኑኑ ያነጋግሩ።"
                    : language === "om"
                    ? "Gareen beeksisaa keenya isin gargaaruuf qophiidha."
                    : "Connect with our advertising team for premium sponsorship opportunities.")}
                </p>
              </div>
            </div>

            <span className="inline-flex items-center gap-1 rounded-xl bg-primary/10 px-3.5 py-2 text-xs font-bold text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors shrink-0 self-start sm:self-center">
              <span>{actionButtonText}</span>
              <ExternalLink className="h-3 w-3" />
            </span>
          </div>

          {/* Slideshow Progress Bar */}
          {isSlideshow && hasMultipleAds && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/5 dark:bg-white/10 overflow-hidden">
              <div
                key={`bar-article-${currentIndex}-${isPaused}`}
                className="h-full bg-primary"
                style={{
                  animation: isPaused ? "none" : `adProgressBarAnim ${rotationInterval}ms linear forwards`,
                  width: isPaused ? "100%" : undefined,
                }}
              />
            </div>
          )}
        </a>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 4. BILLBOARD (Bottom Wide Spotlight Unit: 970×250)
  // ─────────────────────────────────────────────────────────────
  return (
    <div
      className={`my-10 ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Disclosure */}
      <div className="flex items-center justify-between mb-1.5 px-1">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 flex items-center gap-1">
            <Tag className="h-2.5 w-2.5 text-primary/70" />
            <span>{adLabel}</span>
          </span>
          {hasMultipleAds && (
            <CarouselControls
              count={activeAds.length}
              current={currentIndex}
              isPaused={isPaused}
              isSlideshow={isSlideshow}
              onTogglePause={handleTogglePause}
              onPrev={handlePrev}
              onNext={handleNext}
              onSelect={handleSelect}
            />
          )}
        </div>
        {effectiveSponsorName && (
          <span className="text-[10px] font-semibold text-muted-foreground/80">
            Sponsored by {effectiveSponsorName}
          </span>
        )}
      </div>

      <a
        href={effectiveLinkUrl}
        target={openInNewTab ? "_blank" : undefined}
        rel="noopener noreferrer sponsored"
        className="group relative block overflow-hidden rounded-2xl border border-border/80 bg-neutral-900 p-6 sm:p-8 text-white shadow-lg transition-all hover:border-primary/50 hover:shadow-xl"
      >
        <div
          key={activeAd?.id || `billboard-${currentIndex}`}
          className={`relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 ${transitionClass}`}
        >
          <div className="max-w-xl space-y-2.5">
            <span className="inline-block rounded-full bg-gold/20 px-3 py-0.5 text-xs font-bold text-gold border border-gold/30">
              {effectiveSponsorName || "Special Feature"}
            </span>
            <h3 className="font-display text-xl sm:text-2xl font-black text-white group-hover:text-gold transition-colors leading-tight">
              {effectiveTitle || (language === "am"
                ? "የኢትዮጵያን ግንባር ቀደም ሚዲያ መድረክ ይቀላቀሉ"
                : language === "om"
                ? "Maddawwan oduu beekamoo Itoophiyaa waliin hojjedhaa"
                : "Partner with Ethiopia's Leading Independent News Platform")}
            </h3>
            <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
              {effectiveDescription || (language === "am"
                ? "በቴሌግራም፣ ፌስቡክና ድረ-ገጻችን ላይ ሰፊ ሽፋን ያግኙ።"
                : language === "om"
                ? "Telegram, Facebook fi marsariitii keenya irratti beekamtii bal'aa argadhaa."
                : "Amplify your reach with multi-channel coverage across our web portal, Telegram, and social channels.")}
            </p>
            <div className="pt-2 flex items-center gap-2 text-xs font-bold text-gold group-hover:underline">
              <span>{actionButtonText}</span>
              <ExternalLink className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </div>

          {effectiveImageUrl && (
            <div className="w-full md:w-80 lg:w-96 shrink-0 overflow-hidden rounded-xl border border-white/10 shadow-md">
              <img
                src={effectiveImageUrl}
                alt={effectiveTitle || effectiveSponsorName || adLabel}
                loading="lazy"
                decoding="async"
                onError={() => setImgLoadError(true)}
                className="h-44 sm:h-48 w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
          )}
        </div>

        {/* Slideshow Progress Bar */}
        {isSlideshow && hasMultipleAds && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 overflow-hidden z-20">
            <div
              key={`bar-billboard-${currentIndex}-${isPaused}`}
              className="h-full bg-gold"
              style={{
                animation: isPaused ? "none" : `adProgressBarAnim ${rotationInterval}ms linear forwards`,
                width: isPaused ? "100%" : undefined,
              }}
            />
          </div>
        )}
      </a>
    </div>
  );
}
