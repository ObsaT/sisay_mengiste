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
  ChevronRight,
  Radio,
  Clock,
  ArrowUp,
} from "lucide-react";
import { NAV, SOCIALS, BREAKING } from "@/lib/news-data";

/* ── Live clock ──────────────────────────────────────────────────── */

function LiveClock() {
  const [time, setTime] = useState("");
  const [date, setDate] = useState("");

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("am-ET", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      );
      setDate(
        now.toLocaleDateString("am-ET", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex items-center gap-3">
      <span className="flex items-center gap-1.5 text-ink-foreground/60">
        <Clock className="h-3 w-3" />
        <span suppressHydrationWarning className="tabular-nums">
          {time}
        </span>
      </span>
      <span className="hidden text-ink-foreground/40 sm:inline">|</span>
      <span suppressHydrationWarning className="hidden text-ink-foreground/70 sm:inline">
        {date}
      </span>
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
              className="flex h-7 w-7 items-center justify-center rounded-full text-ink-foreground/50 transition-all hover:bg-white/10 hover:text-white"
            >
              {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
            </a>
          </li>
        );
      })}
    </ul>
  );
}

/* ── Breaking ticker ─────────────────────────────────────────────── */

function BreakingTicker() {
  if (!BREAKING.length) return null;
  const doubled = [...BREAKING, ...BREAKING];
  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-[#b91c1c] to-[#991b1b] py-2">
      <div className="absolute left-0 top-0 bottom-0 z-10 flex items-center gap-1.5 bg-[#991b1b] px-4 text-xs font-bold uppercase tracking-widest text-white shadow-[4px_0_8px_-2px_rgba(0,0,0,0.3)]">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
        </span>
        በተቀኘ Breaking
      </div>
      <div className="ml-36 overflow-hidden">
        <div className="animate-ticker flex whitespace-nowrap">
          {doubled.map((item, i) => (
            <span
              key={`${item}-${i}`}
              className="mr-16 inline-flex items-center text-[13px] font-medium text-white/95"
            >
              <ChevronRight className="mr-1.5 h-3 w-3 text-white/50" />
              {item}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Search overlay ──────────────────────────────────────────────── */

function SearchOverlay({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div
      className={`fixed inset-0 z-[60] bg-black/70 backdrop-blur-md transition-all duration-300 ${
        open
          ? "pointer-events-auto opacity-100"
          : "pointer-events-none opacity-0"
      }`}
      onClick={onClose}
    >
      <div
        className={`mx-auto max-w-2xl px-4 pt-[20vh] transition-all duration-300 ${
          open ? "translate-y-0 opacity-100" : "-translate-y-8 opacity-0"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <input
            ref={inputRef}
            type="search"
            placeholder="Search news..."
            className="w-full rounded-xl border border-border bg-card py-4 pl-12 pr-14 text-lg text-foreground shadow-2xl outline-none ring-2 ring-primary/20 placeholder:text-muted-foreground/60 focus:ring-primary/40"
          />
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg transition-colors hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-3 text-center text-xs text-ink-foreground/40">
          Press <kbd className="rounded border border-white/20 bg-white/5 px-1.5 py-0.5 text-[10px]">ESC</kbd> to close
        </p>
      </div>
    </div>
  );
}

/* ── Mobile menu ─────────────────────────────────────────────────── */

function MobileMenu({
  open,
  onClose,
  onOpenSearch,
}: {
  open: boolean;
  onClose: () => void;
  onOpenSearch: () => void;
}) {
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
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          open
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`fixed inset-y-0 left-0 z-50 flex w-80 max-w-[85vw] flex-col bg-card shadow-2xl transition-transform duration-300 ease-out lg:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <Link to="/" onClick={onClose} className="font-display text-lg font-bold text-foreground">
            ሲሳይ መንግስቴ
          </Link>
          <button
            type="button"
            aria-label="ዝጋ"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-muted"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search in mobile */}
        <button
          type="button"
          onClick={() => {
            onClose();
            onOpenSearch();
          }}
          className="mx-4 mt-4 flex items-center gap-3 rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground transition-colors hover:bg-muted"
        >
          <Search className="h-4 w-4" />
          ፈልግ...
        </button>

        {/* Nav links */}
        <nav aria-label="ሞባይል ምናሌ" className="flex-1 overflow-y-auto px-3 py-4 overflow-hidden">
          <ul className="space-y-0.5">
            {NAV.map((item, idx) => (
              <li key={item.slug || "home"}>
                {item.slug ? (
                  <Link
                    to="/category/$slug"
                    params={{ slug: item.slug }}
                    onClick={onClose}
                    className="flex items-center gap-3 rounded-lg px-4 py-3 text-[15px] font-medium text-foreground/80 transition-colors hover:bg-muted hover:text-foreground"
                    activeProps={{ className: "bg-primary/10 text-primary font-semibold" }}
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-muted text-[10px] font-bold text-muted-foreground">
                      {idx}
                    </span>
                    {item.label}
                  </Link>
                ) : (
                  <Link
                    to="/"
                    onClick={onClose}
                    activeOptions={{ exact: true }}
                    className="flex items-center gap-3 rounded-lg px-4 py-3 text-[15px] font-medium text-foreground/80 transition-colors hover:bg-muted hover:text-foreground"
                    activeProps={{ className: "bg-primary/10 text-primary font-semibold" }}
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-muted text-[10px] font-bold text-muted-foreground">
                      &#8962;
                    </span>
                    {item.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>

        {/* Socials */}
        <div className="border-t border-border px-5 py-4">
          <Link
            to="/admin"
            onClick={onClose}
            className="mb-4 flex items-center gap-2 rounded-lg bg-primary/10 px-4 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
          >
            Admin Dashboard
          </Link>
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            Follow Us
          </p>
          <SocialLinks />
        </div>
      </div>
    </>
  );
}

/* ── Scroll-to-top button ────────────────────────────────────────── */

function ScrollToTop() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      type="button"
      aria-label="Back to top"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={`fixed bottom-6 right-6 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-foreground text-background shadow-lg transition-all duration-300 hover:scale-110 ${
        show
          ? "pointer-events-auto translate-y-0 opacity-100"
          : "pointer-events-none translate-y-4 opacity-0"
      }`}
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  );
}

/* ── Main header ─────────────────────────────────────────────────── */

export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    let lastScroll = 0;
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 10);
      setCompact(y > 120);
      lastScroll = y;
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
      {/* ── Sticky header wrapper ────────────────────────────── */}
      <div
        className={`sticky top-0 z-30 transition-shadow duration-300 ${
          scrolled ? "shadow-lg" : ""
        }`}
      >
        {/* ── Utility bar ──────────────────────────────────── */}
        <div className="bg-ink text-ink-foreground">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2 text-xs">
            <LiveClock />
            <div className="flex items-center gap-3">
              <SocialLinks className="hidden sm:flex" />
              <Link
                to="/admin"
                className="hidden rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-semibold text-ink-foreground/60 transition-all hover:bg-white/20 hover:text-white sm:inline"
              >
                Admin
              </Link>
              <button
                type="button"
                aria-label="Search"
                onClick={openSearch}
                className="flex h-7 items-center gap-1.5 rounded-full bg-white/10 px-2.5 text-ink-foreground/60 transition-all hover:bg-white/20 hover:text-white"
              >
                <Search className="h-3 w-3" />
                <span className="hidden text-[10px] sm:inline">⌘K</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── Masthead ─────────────────────────────────────── */}
        <header className="border-b border-border bg-card">
          <div
            className={`mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 transition-all duration-300 ${
              compact ? "py-3 sm:py-4" : "py-5 sm:py-8"
            }`}
          >
            {/* Hamburger (mobile) */}
            <button
              type="button"
              aria-label="ምናሌ"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen(true)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border transition-colors hover:bg-muted lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Branding */}
            <Link to="/" className="flex-1 text-center">
              <span
                className={`block font-display font-extrabold tracking-tight text-foreground transition-all duration-300 ${
                  compact ? "text-2xl sm:text-3xl" : "text-3xl sm:text-5xl"
                }`}
              >
                ሲሳይ መንግስቴ
              </span>
              <span
                className={`kicker mt-1 block text-muted-foreground transition-all duration-300 ${
                  compact ? "hidden sm:block" : "block"
                }`}
              >
                Sisay Mengiste
              </span>
            </Link>

            {/* Search (desktop) */}
            <div className="hidden w-10 shrink-0 lg:block">
              <button
                type="button"
                aria-label="Search"
                onClick={openSearch}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-border transition-colors hover:bg-muted"
              >
                <Search className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* ── Desktop nav ──────────────────────────────── */}
          <nav
            aria-label="ዋና ምናሌ"
            className="border-t border-border bg-muted/20"
          >
            <div className="mx-auto max-w-7xl">
              <ul className="hidden items-center overflow-x-auto px-4 text-sm font-semibold lg:flex">
                {NAV.map((item) => (
                  <li key={item.slug || "home"}>
                    {item.slug ? (
                      <Link
                        to="/category/$slug"
                        params={{ slug: item.slug }}
                        className="group relative whitespace-nowrap px-4 py-3 text-foreground/60 transition-colors hover:text-foreground"
                        activeProps={{ className: "text-primary" }}
                      >
                        {item.label}
                        <span className="absolute bottom-0 left-4 right-4 h-0.5 scale-x-0 bg-primary transition-transform group-hover:scale-x-100 [&.active]:scale-x-100" />
                      </Link>
                    ) : (
                      <Link
                        to="/"
                        activeOptions={{ exact: true }}
                        className="group relative whitespace-nowrap px-4 py-3 text-foreground/60 transition-colors hover:text-foreground"
                        activeProps={{ className: "text-primary" }}
                      >
                        {item.label}
                        <span className="absolute bottom-0 left-4 right-4 h-0.5 scale-x-0 bg-primary transition-transform group-hover:scale-x-100 [&.active]:scale-x-100" />
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </nav>

          {/* Breaking ticker */}
          <BreakingTicker />
        </header>
      </div>

      {/* ── Overlays ─────────────────────────────────────────── */}
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
