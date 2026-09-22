import { createFileRoute, Link, Outlet, useNavigate, useMatches } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useLanguage } from "@/contexts/language-context";
import { useTheme } from "@/contexts/theme-context";
import { type Language } from "@/lib/i18n";
import {
  LayoutDashboard,
  FileText,
  PlusCircle,
  LogOut,
  Newspaper,
  Settings,
  Globe,
  Check,
  ExternalLink,
  Users,
  Sun,
  Moon,
} from "lucide-react";
import logoImg from "@/assets/logo.jpg";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

/* ── Admin Language Selector Widget ───────────────────────────── */
function AdminLanguageSelect({ compact = false }: { compact?: boolean }) {
  const { language, setLanguage, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const languages: { code: Language; label: string; short: string; flag: string }[] = [
    { code: "am", label: "አማርኛ (Amharic)", short: "አማ", flag: "🇪🇹" },
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
        className="flex items-center gap-1.5 rounded-lg border border-border bg-background/80 px-2.5 py-1.5 text-xs font-semibold text-foreground transition-all hover:bg-muted"
        title={t("adminLanguagePreference")}
      >
        <Globe className="h-3.5 w-3.5 text-primary" />
        <span>{compact ? current.short : current.label}</span>
        <span className="text-[9px] opacity-60">▼</span>
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-1.5 w-44 rounded-xl border border-border bg-card p-1 shadow-xl animate-fade-in">
          <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border mb-1">
            {t("adminLanguage")}
          </div>
          {languages.map((item) => (
            <button
              key={item.code}
              type="button"
              onClick={() => {
                setLanguage(item.code);
                setOpen(false);
              }}
              className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                language === item.code
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "text-foreground hover:bg-muted"
              }`}
            >
              <span className="flex items-center gap-1.5">
                <span>{item.flag}</span>
                <span>{item.label}</span>
              </span>
              {language === item.code && <Check className="h-3.5 w-3.5" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function AdminLayout() {
  const { user, loading, error, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const matches = useMatches();
  const isLoginPage =
    matches.some((m) => m.id.includes("login")) ||
    (typeof window !== "undefined" && window.location.pathname.includes("/admin/login"));

  useEffect(() => {
    if (!loading && !user && !error && !isLoginPage) {
      navigate({ to: "/admin/login" });
    }
  }, [user, loading, error, isLoginPage, navigate]);

  if (loading && !isLoginPage) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error && !isLoginPage) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <span className="text-xl font-bold">!</span>
          </div>
          <h2 className="text-lg font-bold text-foreground">Configuration Required</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Firebase is not configured. Please add your credentials to the .env file.
          </p>
          <div className="mt-4 rounded-lg bg-muted p-4 text-left text-xs font-mono text-muted-foreground">
            <p className="font-semibold text-foreground mb-2">Required .env variables:</p>
            <ul className="space-y-1">
              <li>VITE_FIREBASE_API_KEY</li>
              <li>VITE_FIREBASE_AUTH_DOMAIN</li>
              <li>VITE_FIREBASE_PROJECT_ID</li>
              <li>VITE_FIREBASE_STORAGE_BUCKET</li>
              <li>VITE_FIREBASE_MESSAGING_SENDER_ID</li>
              <li>VITE_FIREBASE_APP_ID</li>
            </ul>
          </div>
          <div className="mt-4 text-xs text-muted-foreground">
            <p>After creating or updating your .env file:</p>
            <ol className="list-decimal list-inside mt-1 space-y-1">
              <li>
                Copy from <code className="bg-muted px-1 py-0.5 rounded">.env.example</code>
              </li>
              <li>Restart the dev server</li>
            </ol>
          </div>
          <a
            href="/"
            className="mt-6 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Back to News Site
          </a>
        </div>
      </div>
    );
  }

  if (!user && !isLoginPage) return null;

  // For login page without auth, just render the child
  if (!user && isLoginPage) {
    return <Outlet />;
  }

  if (!user) return null;

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/admin/login" });
  };

  const navItems = [
    { to: "/admin" as const, label: t("adminNavDashboard"), icon: LayoutDashboard, exact: true },
    { to: "/admin/articles/" as const, label: t("adminNavArticles"), icon: FileText },
    { to: "/admin/subscribers" as const, label: t("adminNavSubscribers"), icon: Users },
    { to: "/admin/settings" as const, label: t("adminNavSettings"), icon: Settings },
  ];

  return (
    <div className="flex min-h-screen bg-muted/20">
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-border bg-card lg:flex lg:flex-col justify-between">
        <div>
          <div className="flex h-16 items-center justify-between border-b border-border px-4">
            <Link to="/admin" className="flex items-center gap-2 group min-w-0">
              <img
                src={logoImg}
                alt="የራስ"
                className="h-8 w-auto object-contain bg-white rounded p-0.5 shadow-xs shrink-0"
              />
              <span className="font-display text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate">
                የራስ Admin
              </span>
            </Link>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={toggleTheme}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background/80 text-foreground transition-all hover:bg-muted"
                title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
                aria-label="Toggle theme mode"
              >
                {theme === "dark" ? (
                  <Sun className="h-4 w-4 text-amber-500" />
                ) : (
                  <Moon className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
              <AdminLanguageSelect compact />
            </div>
          </div>

          <nav className="px-3 py-4">
            <ul className="space-y-1">
              {navItems.map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    {...(item.exact ? { activeOptions: { exact: true } } : {})}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground/70 transition-colors hover:bg-muted hover:text-foreground"
                    activeProps={{
                      className: "bg-primary/10 text-primary font-semibold",
                    }}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  to="/admin/articles/$id"
                  params={{ id: "new" }}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground/70 transition-colors hover:bg-muted hover:text-foreground"
                >
                  <PlusCircle className="h-4 w-4" />
                  {t("adminNavNewArticle")}
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        <div className="border-t border-border p-4 space-y-3">
          {/* User profile & View site */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2 truncate">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                {user.email?.charAt(0).toUpperCase() ?? "A"}
              </div>
              <span className="truncate text-xs text-muted-foreground">{user.email ?? ""}</span>
            </div>
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary p-1"
              title={t("adminViewSite")}
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>

          {/* Theme Mode Switcher */}
          <div className="flex items-center justify-between rounded-xl border border-border bg-muted/40 px-3 py-2">
            <span className="flex items-center gap-2 text-xs font-semibold text-foreground">
              {theme === "dark" ? (
                <Moon className="h-3.5 w-3.5 text-primary" />
              ) : (
                <Sun className="h-3.5 w-3.5 text-amber-500" />
              )}
              <span>{theme === "dark" ? "Dark Theme" : "Light Theme"}</span>
            </span>
            <button
              type="button"
              onClick={toggleTheme}
              className="rounded-lg border border-border bg-card px-2.5 py-1 text-[11px] font-bold text-foreground hover:bg-muted transition-colors shadow-2xs"
            >
              {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
            </button>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-foreground/70 transition-colors hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
          >
            <LogOut className="h-3.5 w-3.5" />
            {t("adminSignOut")}
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-border bg-card px-4 lg:hidden">
          <Link to="/admin" className="flex items-center gap-2">
            <img
              src={logoImg}
              alt="የራስ"
              className="h-7 w-auto object-contain bg-white rounded p-0.5 shadow-xs"
            />
            <span className="font-display text-sm font-bold">የራስ Admin</span>
          </Link>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={toggleTheme}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background text-foreground transition-all hover:bg-muted"
              title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
              aria-label="Toggle theme mode"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4 text-amber-500" />
              ) : (
                <Moon className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
            <AdminLanguageSelect compact />
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                {...(item.exact ? { activeOptions: { exact: true } } : {})}
                className="rounded-lg p-2 text-foreground/60 transition-colors hover:bg-muted hover:text-foreground"
                activeProps={{ className: "text-primary" }}
              >
                <item.icon className="h-4 w-4" />
              </Link>
            ))}
            <Link
              to="/admin/articles/$id"
              params={{ id: "new" }}
              className="rounded-lg p-2 text-foreground/60 transition-colors hover:bg-muted hover:text-foreground"
            >
              <PlusCircle className="h-4 w-4" />
            </Link>
            <button
              type="button"
              onClick={handleSignOut}
              className="rounded-lg p-2 text-foreground/60 transition-colors hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
