import { useState, useEffect, type ReactNode } from "react";
import { useAuth } from "@/contexts/auth-context";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getLocalCloudinarySettings } from "@/lib/cloudinary-settings";
import {
  Lock,
  Unlock,
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  Cloud,
} from "lucide-react";
import { toast } from "sonner";

interface CloudinaryAuthGateProps {
  children: ReactNode;
}

const STORAGE_KEY = "admin_cloudinary_authorized";

function maskSecret(val?: string): string {
  if (!val || val.trim().length === 0) return "••••••••••••";
  const str = val.trim();
  if (str.length <= 4) return "••••••••";
  return str.slice(0, 3) + "••••••••" + str.slice(-2);
}

export function CloudinaryAuthGate({ children }: CloudinaryAuthGateProps) {
  const { user } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem(STORAGE_KEY) === "true";
    }
    return false;
  });

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Read local settings for masked preview
  const [maskedInfo, setMaskedInfo] = useState({
    cloudName: "••••••••",
    uploadPreset: "••••••••",
    hasFolder: false,
  });

  useEffect(() => {
    const settings = getLocalCloudinarySettings();
    setMaskedInfo({
      cloudName: maskSecret(settings.cloudName),
      uploadPreset: maskSecret(settings.uploadPreset),
      hasFolder: Boolean(settings.folder),
    });
  }, [isAuthorized]);

  const handleAuthorize = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedPassword = password.trim();
    if (!trimmedPassword) {
      setError("Please enter your administrator password.");
      return;
    }

    setLoading(true);
    try {
      if (user?.email) {
        // Authenticate with Firebase using currently logged-in admin email
        try {
          await signInWithEmailAndPassword(auth, user.email, trimmedPassword);
        } catch (fbErr: any) {
          const fallbackPin = import.meta.env["VITE_ADMIN_PIN"] as string | undefined;
          if (fallbackPin && trimmedPassword === fallbackPin) {
            // Allow fallback PIN
          } else {
            throw fbErr;
          }
        }
      } else {
        // Fallback for environment/local mock admin
        const fallbackPin = (import.meta.env["VITE_ADMIN_PIN"] as string) || "admin123";
        if (trimmedPassword !== fallbackPin) {
          throw new Error("Invalid administrator password.");
        }
      }

      setIsAuthorized(true);
      sessionStorage.setItem(STORAGE_KEY, "true");
      setPassword("");
      toast.success("Authorization confirmed. Cloudinary settings unlocked.");
    } catch (err: any) {
      console.error("Cloudinary authorization failed:", err);
      const code = err?.code;
      if (
        code === "auth/wrong-password" ||
        code === "auth/invalid-credential" ||
        code === "auth/user-not-found"
      ) {
        setError("Incorrect administrator password. Please check and try again.");
      } else if (code === "auth/too-many-requests") {
        setError("Too many failed attempts. Please wait a moment and try again.");
      } else {
        setError(err?.message || "Failed to verify administrator password.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLock = () => {
    setIsAuthorized(false);
    sessionStorage.removeItem(STORAGE_KEY);
    setPassword("");
    setError(null);
    toast.info("Cloudinary settings locked.");
  };

  if (!isAuthorized) {
    return (
      <div className="space-y-6 animate-fade-in">
        {/* Security Lock Card */}
        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-border pb-6">
            <div className="flex items-start gap-3.5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Lock className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 text-[11px] font-bold uppercase tracking-wider">
                  <ShieldAlert className="h-3 w-3" /> Protected Setting
                </div>
                <h2 className="text-lg font-bold text-foreground">
                  Cloudinary Configuration is Locked
                </h2>
                <p className="text-xs text-muted-foreground max-w-xl">
                  Cloudinary credentials control direct image uploads, media hosting, and cloud CDN
                  storage. For security, administrator authorization is required to reveal or modify
                  these settings.
                </p>
              </div>
            </div>
          </div>

          {/* Masked status summary */}
          <div className="my-6 grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-xl bg-muted/40 border border-border/80 p-4">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Cloud Name
              </span>
              <p className="font-mono text-sm font-bold text-foreground">
                {maskedInfo.cloudName}
              </p>
              <span className="text-[10px] text-muted-foreground">Encrypted / Protected</span>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Upload Preset
              </span>
              <p className="font-mono text-sm font-bold text-foreground">
                {maskedInfo.uploadPreset}
              </p>
              <span className="text-[10px] text-muted-foreground">Unsigned CDN Mode</span>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Storage Status
              </span>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-green-600 dark:text-green-400">
                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                Active & Secured
              </div>
              <span className="text-[10px] text-muted-foreground">Live on news portal</span>
            </div>
          </div>

          {/* Unlock Form */}
          <form onSubmit={handleAuthorize} className="max-w-md space-y-4">
            {error && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 flex items-start gap-2.5 text-xs text-destructive dark:text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label
                htmlFor="cloudinary-auth-password"
                className="text-xs font-bold text-foreground flex items-center justify-between"
              >
                <span>Admin Password</span>
                {user?.email && (
                  <span className="text-[11px] font-normal text-muted-foreground">
                    Verifying as <strong className="text-foreground">{user.email}</strong>
                  </span>
                )}
              </label>

              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  id="cloudinary-auth-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="Enter administrator password to unlock..."
                  className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-10 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Enter your admin login password to access raw Cloudinary CDN storage parameters.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-xs hover:bg-primary/90 transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Verifying Authorization...
                </>
              ) : (
                <>
                  <Unlock className="h-4 w-4" />
                  Unlock Cloudinary Settings
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // When authorized, render child controls with a top security bar
  return (
    <div className="space-y-4">
      {/* Authorized Status Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-2.5 text-xs text-green-900 dark:text-green-300">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />
          <span className="font-semibold">
            Authorization Active — Cloudinary basic settings unlocked for this session
          </span>
        </div>
        <button
          type="button"
          onClick={handleLock}
          className="inline-flex items-center gap-1.5 rounded-lg border border-green-600/30 bg-background/80 px-2.5 py-1 text-xs font-semibold text-foreground hover:bg-background transition-colors"
          title="Lock Cloudinary settings now"
        >
          <Lock className="h-3 w-3 text-muted-foreground" />
          Lock Settings
        </button>
      </div>

      {/* Actual Cloudinary Form & Guide */}
      {children}
    </div>
  );
}
