import { Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Search,
  Menu,
  X,
  Facebook,
  Send,
  Twitter,
  Youtube,
  Linkedin,
  Clock,
  ArrowUp,
  Moon,
  Sun,
  Globe,
  Sparkles,
} from "lucide-react";
import { SOCIALS } from "@/lib/news-data";
import { useTheme } from "@/contexts/theme-context";
import { useLanguage } from "@/contexts/language-context";
import { type Language } from "@/lib/i18n";
import {
  getPublishedArticles,
  searchArticles,
  articleSlug,
  type Article,
} from "@/lib/firestore-service";

/* ── Live clock & date by language ──────────────────────────────── */

function LiveClock() {
  const { language, t } = useLanguage();
  const [time, setTime] = useState("");
  const [date, setDate] = useState("");

  useEffect(() => {
    const localeMap = {
      am: "am-ET",
      om: "en-ET",
      en: "en-US",
    };
    const locale = localeMap[language] || "am-ET";

    const tick = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString(locale, {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      );
      setDate(
        now.toLocaleDateString(locale, {
          weekday: "long",
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [language]);

  return (
    <div className="flex items-center gap-2.5 text-[11px] text-ink-foreground/80 font-medium">
      <span className="flex items-center gap-1.5 text-gold/90">
        <Clock className="h-3 w-3" />
        <span suppressHydrationWarning className="tabular-nums font-mono">
          {time}
        </span>
      </span>
      <span className="text-ink-foreground/30">|</span>
      <span suppressHydrationWarning className="hidden sm:inline text-ink-foreground/75">
        {date}
      </span>
      <span className="hidden md:inline text-ink-foreground/30">·</span>
      <span className="hidden md:inline text-gold/80 font-semibold uppercase tracking-wider text-[10px]">
        {t("edition")}
      </span>
    </div>
  );
}

/* ── Language Switcher Component ─────────────────────────────────── */

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { language, setLanguage } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const languages: { code: Language; label: string; short: string; flag: string }[] = [
    { code: "am", label: "አማርኛ", short: "አማ", flag: "🇪🇹" },
    { code: "om", label: "Afaan Oromoo", short: "Orom", flag: "🌳" },
    { code: "en", label: "English", short: "ENG", flag: "🌐" },
  ];

  const current = languages.find((l) => l.code === language) ?? languages[0]!;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold text-ink-foreground hover:bg-white/20 transition-all border border-white/10"
        aria-label="Select language"
      >
        <Globe className="h-3.5 w-3.5 text-gold" />
        <span>{compact ? current.short : current.label}</span>
        <span className="text-[10px] opacity-60">▼</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-1.5 w-40 rounded-xl border border-border bg-card p-1 shadow-2xl z-50 animate-fade-in backdrop-blur-md">
          {languages.map((item) => (
            <button
              key={item.code}
              type="button"
              onClick={() => {
                setLanguage(item.code);
                setOpen(false);
              }}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                language === item.code
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "text-foreground hover:bg-muted"
              }`}
            >
              <span className="flex items-center gap-2">
                <span>{item.flag}</span>
                <span>{item.label}</span>
              </span>
              {language === item.code && <span className="text-xs">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Social icons ────────────────────────────────────────────────── */

const SOCIAL_ICONS: Record<string, React.FC<{ className?: string }>> = {
  Facebook,
  Telegram: Send,
  X: Twitter,
  YouTube: Youtube,
  TikTok: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.43v-7.15a8.16 8.16 0 005.58 2.18v-3.45a4.85 4.85 0 01-5.58-2.67z" />
    </svg>
  ),
  LinkedIn: Linkedin,
};

export function SocialLinks({ className = "" }: { className?: string }) {
  return (
    <ul className={`flex items-center gap-1.5 ${className}`}>
      {SOCIALS.map((s) => {
        const Icon = SOCIAL_ICONS[s.label];
        return (
          <li key={s.label}>
            <a
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={s.label}
              className="flex h-7 w-7 items-center justify-center rounded-full text-ink-foreground/60 transition-all hover:bg-white/10 hover:text-gold"
            >
              {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
            </a>
          </li>
        );
      })}
    </ul>
  );
}

/* ── Modern Search Overlay with Firestore Live Results ───────────── */

function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useLanguage();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Article[]>([]);
  const [allArticles, setAllArticles] = useState<Article[]>([]);
  const [fetched, setFetched] = useState(false);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 80);
      document.body.style.overflow = "hidden";
      if (!fetched) {
        getPublishedArticles(100)
          .then((a) => {
            setAllArticles(a);
            setFetched(true);
          })
          .catch(console.error);
      }
    } else {
      document.body.style.overflow = "";
      setQuery("");
      setResults([]);
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open, fetched]);

  useEffect(() => {
    if (query.trim().length >= 2) {
      setResults(searchArticles(allArticles, query).slice(0, 6));
    } else {
      setResults([]);
    }
  }, [query, allArticles]);

  return (
    <div
      className={`fixed inset-0 z-[70] bg-black/75 backdrop-blur-md transition-all duration-300 ${
        open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
      }`}
      onClick={onClose}
    >
      <div
        className={`mx-auto max-w-2xl px-4 pt-[12vh] transition-all duration-300 ${
          open ? "translate-y-0 opacity-100" : "-translate-y-6 opacity-0"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card shadow-2xl">
          <div className="flex items-center px-4 border-b border-border">
            <Search className="h-5 w-5 text-primary shrink-0" />
            <input
              ref={inputRef}
              type="search"
              placeholder={t("searchPlaceholder")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-transparent py-4 pl-3 pr-10 text-base sm:text-lg text-foreground outline-none placeholder:text-muted-foreground/60"
            />
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-muted text-muted-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {results.length > 0 && (
            <div className="max-h-[60vh] overflow-y-auto divide-y divide-border">
              {results.map((a) => (
                <Link
                  key={a.id}
                  to="/article/$slug"
                  params={{ slug: articleSlug(a.title) }}
                  onClick={onClose}
                  className="flex items-start gap-4 p-4 transition-colors hover:bg-muted/60"
                >
                  {a.image && (
                    <img
                      src={a.image}
                      alt={a.title}
                      className="h-16 w-20 shrink-0 rounded-md object-cover border border-border"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                      {a.section}
                    </span>
                    <p className="font-display text-sm font-semibold text-foreground line-clamp-2 mt-0.5">
                      {a.title}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">{a.author}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {query.trim().length >= 2 && results.length === 0 && (
            <div className="p-8 text-center text-sm text-muted-foreground">
              {t("searchNoResults")}
            </div>
          )}
        </div>

        <p className="mt-3 text-center text-xs text-white/60">{t("searchClose")}</p>
      </div>
    </div>
  );
}

/* ── Modern Mobile Menu Drawer ───────────────────────────────────── */

function MobileMenu({
  open,
  onClose,
  onOpenSearch,
}: {
  open: boolean;
  onClose: () => void;
  onOpenSearch: () => void;
}) {
  const { theme, toggleTheme } = useTheme();
  const { categories, t, language, setLanguage } = useLanguage();

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />

      <div
        className={`fixed inset-y-0 left-0 z-50 flex w-80 max-w-[85vw] flex-col bg-card shadow-2xl transition-transform duration-300 ease-out lg:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <Link
              to="/"
              onClick={onClose}
              className="font-display text-xl font-bold text-foreground"
            >
              {t("siteName")}
            </Link>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
              {t("siteSubtitle")}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={toggleTheme}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:bg-muted"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button
              type="button"
              aria-label="Close menu"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border transition-colors hover:bg-muted text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Language selector pills inside drawer */}
        <div className="px-5 pt-4 pb-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
            Language / ቋንቋ
          </p>
          <div className="grid grid-cols-3 gap-1.5">
            {(
              [
                { code: "am", label: "አማርኛ" },
                { code: "om", label: "Oromoo" },
                { code: "en", label: "English" },
              ] as const
            ).map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => setLanguage(lang.code)}
                className={`rounded-lg py-1.5 text-xs font-semibold border transition-all ${
                  language === lang.code
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "border-border bg-muted/40 text-foreground hover:bg-muted"
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search trigger */}
        <button
          type="button"
          onClick={() => {
            onClose();
            onOpenSearch();
          }}
          className="mx-5 mt-2 flex items-center gap-2.5 rounded-xl border border-border bg-muted/40 px-3.5 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Search className="h-4 w-4 text-primary" />
          <span>{t("search")}</span>
        </button>

        {/* Navigation list */}
        <nav aria-label="Mobile Navigation" className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">
            {categories.map((item) => (
              <li key={item.slug || "home"}>
                {item.slug ? (
                  <Link
                    to="/category/$slug"
                    params={{ slug: item.slug }}
                    onClick={onClose}
                    className="flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium text-foreground/80 transition-colors hover:bg-muted hover:text-foreground"
                    activeProps={{ className: "bg-primary/10 text-primary font-semibold" }}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <Link
                    to="/"
                    onClick={onClose}
                    activeOptions={{ exact: true }}
                    className="flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium text-foreground/80 transition-colors hover:bg-muted hover:text-foreground"
                    activeProps={{ className: "bg-primary/10 text-primary font-semibold" }}
                  >
                    {item.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>

        {/* Drawer footer */}
        <div className="border-t border-border px-5 py-4 bg-muted/20">
          <Link
            to="/admin"
            onClick={onClose}
            className="mb-3 block text-center rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow transition-colors hover:bg-primary/90"
          >
            {t("adminDashboard")}
          </Link>
          <SocialLinks className="justify-center" />
        </div>
      </div>
    </>
  );
}

/* ── Scroll-to-top button ────────────────────────────────────────── */

function ScrollToTop() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 350);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      type="button"
      aria-label="Back to top"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={`fixed bottom-6 right-6 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-foreground text-background shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 ${
        show
          ? "pointer-events-auto translate-y-0 opacity-100"
          : "pointer-events-none translate-y-4 opacity-0"
      }`}
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  );
}

/* ── Main Site Header Component ───────────────────────────────────── */

export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { t, categories } = useLanguage();

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const openSearch = useCallback(() => setSearchOpen(true), []);
  const closeSearch = useCallback(() => setSearchOpen(false), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
      if (e.key === "Escape") setSearchOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <header
        className={`sticky top-0 z-40 w-full bg-card transition-all duration-300 ${
          scrolled ? "shadow-lg border-b border-border" : ""
        }`}
      >
        {/* ── 1. Top Utility Bar ─────────────────────────────── */}
        <div className="border-b border-white/10 bg-ink text-ink-foreground">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-1.5 text-xs">
            <LiveClock />

            <div className="flex items-center gap-2.5">
              <SocialLinks className="hidden md:flex" />

              <span className="hidden sm:inline text-ink-foreground/20">|</span>

              {/* Language Switcher */}
              <LanguageSwitcher />

              {/* Dark mode toggle */}
              <button
                type="button"
                aria-label="Toggle dark mode"
                onClick={toggleTheme}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-ink-foreground/80 hover:text-gold transition-colors hover:bg-white/20"
              >
                {theme === "dark" ? (
                  <Sun className="h-3.5 w-3.5" />
                ) : (
                  <Moon className="h-3.5 w-3.5" />
                )}
              </button>

              {/* Search button */}
              <button
                type="button"
                aria-label="Search"
                onClick={openSearch}
                className="flex h-7 items-center gap-1.5 rounded-full bg-white/10 px-2.5 text-ink-foreground/80 hover:text-gold hover:bg-white/20 transition-all text-xs"
              >
                <Search className="h-3.5 w-3.5" />
                <span className="hidden sm:inline text-[10px] opacity-70">⌘K</span>
              </button>

              {/* Admin Portal Link */}
              <Link
                to="/admin"
                className="hidden sm:inline-flex items-center rounded-full bg-primary/80 px-2.5 py-0.5 text-[11px] font-semibold text-primary-foreground hover:bg-primary transition-colors"
              >
                {t("admin")}
              </Link>
            </div>
          </div>
        </div>

        {/* ── 2. Editorial Masthead ─────────────────────────── */}
        <div className="border-b border-border bg-card/95 backdrop-blur-md">
          <div
            className={`mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 transition-all duration-300 ${
              scrolled ? "py-2 sm:py-2.5" : "py-4 sm:py-6"
            }`}
          >
            {/* Mobile menu trigger */}
            <button
              type="button"
              aria-label="Open menu"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen(true)}
              className={`flex shrink-0 items-center justify-center rounded-xl border border-border hover:bg-muted text-foreground transition-all lg:hidden ${
                scrolled ? "h-8 w-8" : "h-10 w-10"
              }`}
            >
              <Menu className={scrolled ? "h-4 w-4" : "h-5 w-5"} />
            </button>

            {/* Publication Logo / Brand */}
            <Link to="/" className="flex-1 text-center group">
              <div className="inline-block">
                <span
                  className={`block font-display font-black tracking-tight text-foreground group-hover:text-primary transition-all duration-300 ${
                    scrolled ? "text-xl sm:text-2xl" : "text-3xl sm:text-5xl"
                  }`}
                >
                  {t("siteName")}
                </span>
                <span
                  className={`kicker mt-0.5 block text-muted-foreground text-xs sm:text-sm tracking-[0.25em] transition-all duration-300 ${
                    scrolled ? "hidden" : "block"
                  }`}
                >
                  {t("siteSubtitle")}
                </span>
              </div>
            </Link>

            {/* Right Quick Action for Desktop */}
            <div className="hidden w-10 shrink-0 lg:flex justify-end">
              <button
                type="button"
                aria-label="Search"
                onClick={openSearch}
                className={`flex items-center justify-center rounded-xl border border-border hover:bg-muted text-foreground transition-all ${
                  scrolled ? "h-8 w-8" : "h-10 w-10"
                }`}
              >
                <Search className={scrolled ? "h-3.5 w-3.5" : "h-4 w-4"} />
              </button>
            </div>
          </div>
        </div>

        {/* ── 3. Sticky Desktop Primary Navigation ──────────── */}
        <nav aria-label="Main Navigation" className="bg-card/95 backdrop-blur-md">
          <div className="mx-auto max-w-7xl">
            <ul
              className={`hidden items-center justify-center gap-1 overflow-x-auto px-4 font-bold tracking-wide transition-all duration-300 lg:flex ${
                scrolled ? "text-xs" : "text-[13px]"
              }`}
            >
              {categories.map((item) => (
                <li key={item.slug || "home"}>
                  {item.slug ? (
                    <Link
                      to="/category/$slug"
                      params={{ slug: item.slug }}
                      className="group relative block whitespace-nowrap px-3.5 py-3 text-foreground/75 hover:text-primary transition-colors"
                      activeProps={{ className: "text-primary font-extrabold" }}
                    >
                      {item.label}
                      <span className="absolute bottom-0 left-3 right-3 h-[2.5px] scale-x-0 rounded-full bg-primary transition-transform group-hover:scale-x-100 [&.active]:scale-x-100" />
                    </Link>
                  ) : (
                    <Link
                      to="/"
                      activeOptions={{ exact: true }}
                      className="group relative block whitespace-nowrap px-3.5 py-3 text-foreground/75 hover:text-primary transition-colors"
                      activeProps={{ className: "text-primary font-extrabold" }}
                    >
                      {item.label}
                      <span className="absolute bottom-0 left-3 right-3 h-[2.5px] scale-x-0 rounded-full bg-primary transition-transform group-hover:scale-x-100 [&.active]:scale-x-100" />
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </nav>
      </header>

      {/* ── Overlays & Modals ───────────────────────────────── */}
      <MobileMenu
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        onOpenSearch={openSearch}
      />
      <SearchOverlay open={searchOpen} onClose={closeSearch} />
      <ScrollToTop />
    </>
  );
}
