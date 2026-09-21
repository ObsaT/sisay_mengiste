import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { getRouter } from "./router";
import { AuthProvider } from "./contexts/auth-context";
import { ThemeProvider } from "./contexts/theme-context";
import { LanguageProvider } from "./contexts/language-context";
import { SocialProvider } from "./contexts/social-context";
import { ContactProvider } from "./contexts/contact-context";
import { AdsProvider } from "./contexts/ads-context";
import { Toaster } from "sonner";

import "./styles.css";

const router = getRouter();

const rootElement = document.getElementById("root")!;

import { createRoot } from "react-dom/client";
createRoot(rootElement).render(
  <QueryClientProvider client={new QueryClient()}>
    <ThemeProvider>
      <LanguageProvider>
        <SocialProvider>
          <ContactProvider>
            <AdsProvider>
              <AuthProvider>
                <RouterProvider router={router} />
                <Toaster
                  position="bottom-right"
                  richColors
                  closeButton
                  toastOptions={{ duration: 4000 }}
                />
              </AuthProvider>
            </AdsProvider>
          </ContactProvider>
        </SocialProvider>
      </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>,
);
