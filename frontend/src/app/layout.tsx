import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";

export const metadata: Metadata = {
  title: "TICKETFLOW // TRANSACTIONAL CORE GATEWAY",
  description: "High-concurrency, ultra-fast brutalist ticket reservation console for real-time seat lock and checkout settlement.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full bg-black">
      <body className="min-h-full bg-black text-white font-mono antialiased selection:bg-white selection:text-black">
        <div className="relative min-h-screen flex flex-col terminal-grid">
          {/* CRT Scanline Overlay Effect */}
          <div className="pointer-events-none fixed inset-0 z-50 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.15)_100%)]" />
          <AppProvider>
            <main className="flex-1 flex flex-col p-4 md:p-6 lg:p-8">
              {children}
            </main>
          </AppProvider>
        </div>
      </body>
    </html>
  );
}
