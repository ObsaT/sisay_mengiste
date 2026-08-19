import { Link } from "@tanstack/react-router";
import { NAV } from "@/lib/news-data";
import { SocialLinks } from "./site-header";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border bg-ink text-ink-foreground">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <p className="font-display text-2xl">ሲሳይ መንግስቴ</p>
          <p className="mt-1 text-xs text-ink-foreground/60">
            ሚዲያና ኮሙዩኒኬሽንስ ሴንተር · አዲስ አበባ
          </p>
          <SocialLinks className="mt-4 text-ink-foreground/80" />
        </div>
        <nav aria-label="ክፍሎች">
          <p className="kicker text-gold">ክፍሎች</p>
          <ul className="mt-3 grid grid-cols-2 gap-2 text-sm text-ink-foreground/75">
            {NAV.filter((n) => n.slug).map((n) => (
              <li key={n.slug}>
                <Link
                  to="/category/$slug"
                  params={{ slug: n.slug }}
                  className="transition-colors hover:text-gold"
                >
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div>
          <p className="kicker text-gold">ስለ እኛ</p>
          <p className="mt-3 text-sm text-ink-foreground/70">
            ገለልተኛ፣ ጥልቅና ተዓማኒ ዘገባ — በየዕለቱ።
          </p>
          <p className="mt-6 text-xs text-ink-foreground/50">
            © {new Date().getFullYear()} ሲሳይ መንግስቴ። መብቱ በሕግ የተጠበቀ ነው።
          </p>
        </div>
      </div>
    </footer>
  );
}
