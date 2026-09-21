import { createFileRoute, Link, Outlet, useNavigate, useMatches } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useLanguage } from "@/contexts/language-context";
import { type Language } from "@/lib/i18n";
import {
  LayoutDashboard,
  FileText,
  PlusCircle,
  LogOut,
  Newspaper,
  Share2,
  Mail,
  Cloud,
  Globe,
  Check,
  ExternalLink,
} from "lucide-react";

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
  const { t } = useLanguage();
  const navigate = useNavigate();
  const matches = useMatches();
  const isLoginPage = matches.some((m) => m.id.includes("login"));

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
      <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
        <div className="max-w-md rounded-xl border border-border bg-card p-8 text-center shadow-lg">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-yellow-100">
            <span className="text-2xl">⚠️</span>
          </div>
          <h1 className="text-xl font-bold text-foreground">Setup Required</h1>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
          <div className="mt-6 rounded-lg bg-muted p-4 text-left text-xs text-muted-foreground">
            <p className="mb-2 font-semibold">Steps:</p>
            <ol className="list-inside list-decimal space-y-1">
              <li>Create a Firebase project at console.firebase.google.com</li>
              <li>Enable Authentication (Email/Password) and Firestore</li>
              <li>
                Copy your web app config into the{" "}
                <code className="rounded bg-background px-1">.env</code> file
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
    { to: "/admin/social" as const, label: t("adminNavSocial"), icon: Share2 },
    { to: "/admin/contact" as const, label: t("adminNavContact"), icon: Mail },
    { to: "/admin/cloudinary" as const, label: t("adminNavCloudinary"), icon: Cloud },
  ];

  return (
    <div className="flex min-h-screen bg-muted/20">
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-border bg-card lg:flex lg:flex-col justify-between">
        <div>
          <div className="flex h-16 items-center justify-between border-b border-border px-5">
            <Link to="/admin" className="flex items-center gap-2">
              <Newspaper className="h-5 w-5 text-primary" />
              <span className="font-display text-lg font-bold text-foreground">Admin</span>
            </Link>
            <AdminLanguageSelect compact />
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
          <div className="rounded-lg bg-muted/40 p-2.5">
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Globe className="h-3 w-3 text-primary" />
              {t("adminLanguagePreference")}
            </div>
            <AdminLanguageSelect />
          </div>

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
            <Newspaper className="h-5 w-5 text-primary" />
            <span className="font-display text-lg font-bold">Admin</span>
          </Link>
          <div className="flex items-center gap-1.5">
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
