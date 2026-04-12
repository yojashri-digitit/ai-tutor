import Header from "@/components/Header";
import { Toaster } from "react-hot-toast";
import Providers from "./providers";

export const metadata = {
  title: "AI Tutor",
  description: "AI Tutor Assistant",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Tailwind CDN */}
        <script src="https://cdn.tailwindcss.com"></script>

        {/* Optional: Custom Tailwind config */}
        <script>
          {`
            tailwind.config = {
              theme: {
                extend: {
                  colors: {
                    primary: '#2563eb',
                    secondary: '#4f46e5',
                  }
                }
              }
            }
          `}
        </script>
      </head>

      <body className="bg-gray-50 text-gray-900">

        <Providers>

          {/* HEADER */}
          {/* <Header /> */}

          {/* MAIN */}
          <main className=" min-h-screen">
            {children}
          </main>

          {/* TOASTER */}
          <Toaster position="top-center" />

        </Providers>

      </body>
    </html>
  );
}