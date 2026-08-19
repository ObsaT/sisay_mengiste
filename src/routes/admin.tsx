import { createFileRoute, Link, Outlet, useNavigate, useMatches } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import {
  LayoutDashboard,
  FileText,
  PlusCircle,
  LogOut,
  Newspaper,
} from "lucide-react";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const { user, loading, error, signOut } = useAuth();
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
              <li>Copy your web app config into the <code className="rounded bg-background px-1">.env</code> file</li>
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
    { to: "/admin" as const, label: "Dashboard", icon: LayoutDashboard, exact: true },
    { to: "/admin/articles" as const, label: "Articles", icon: FileText },
  ];

  return (
    <div className="flex min-h-screen bg-muted/20">
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-border bg-card lg:block">
        <div className="flex h-16 items-center gap-2 border-b border-border px-6">
          <Newspaper className="h-5 w-5 text-primary" />
          <span className="font-display text-lg font-bold text-foreground">Admin</span>
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
                New Article
              </Link>
            </li>
          </ul>
        </nav>

        <div className="absolute bottom-0 w-64 border-t border-border p-4">
          <div className="mb-3 flex items-center gap-2 px-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
              {user.email?.charAt(0).toUpperCase() ?? "A"}
            </div>
            <span className="truncate text-xs text-muted-foreground">{user.email ?? ""}</span>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground/70 transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
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
          <div className="flex items-center gap-2">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                {...(item.exact ? { activeOptions: { exact: true } } : {})}
                className="rounded-lg p-2 text-foreground/60 transition-colors hover:bg-muted hover:text-foreground"
                activeProps={{ className: "text-primary" }}
              >
                <item.icon className="h-5 w-5" />
              </Link>
            ))}
            <Link
              to="/admin/articles/$id"
              params={{ id: "new" }}
              className="rounded-lg p-2 text-foreground/60 transition-colors hover:bg-muted hover:text-foreground"
            >
              <PlusCircle className="h-5 w-5" />
            </Link>
            <button
              type="button"
              onClick={handleSignOut}
              className="rounded-lg p-2 text-foreground/60 transition-colors hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="h-5 w-5" />
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
