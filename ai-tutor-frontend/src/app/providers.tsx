"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster } from "react-hot-toast";
import { useState } from "react";

export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  // 🔥 IMPORTANT: create client inside component (avoids SSR issues)
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}

      {/* 🔥 GLOBAL TOAST */}
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 2000,
          style: {
            borderRadius: "8px",
            padding: "10px",
          },
        }}
      />

      {/* 🔧 DEVTOOLS (optional but useful) */}
      {/* <ReactQueryDevtools initialIsOpen={false} /> */}
    </QueryClientProvider>
  );
}