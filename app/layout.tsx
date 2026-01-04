import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Tonnenheld - Dein Müll-Service",
  description: "Bequeme Mülltonnen-Abholung für die Nachbarschaft.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body className={cn(inter.className, "min-h-screen bg-background antialiased flex flex-col")}>
        <main className="flex-1">
          {children}
        </main>
        <footer className="py-6 text-center text-sm text-muted-foreground border-t bg-muted/30">
          <p>© <a href="/login" className="hover:text-primary transition-colors">{new Date().getFullYear()}</a> Tonnenheld. <span className="text-xs opacity-50">v1.2</span></p>
        </footer>
      </body>
    </html>
  );
}
