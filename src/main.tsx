import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { getRouter } from "./router";
import { AuthProvider } from "./contexts/auth-context";

import "./styles.css";

const router = getRouter();

const rootElement = document.getElementById("root")!;

import { createRoot } from "react-dom/client";
createRoot(rootElement).render(
  <QueryClientProvider client={new QueryClient()}>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </QueryClientProvider>,
);
