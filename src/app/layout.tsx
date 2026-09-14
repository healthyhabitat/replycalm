import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl =
  process.env.NEXT_PUBLIC_APP_URL || "https://replycalm.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "ReplyCalm — Rough email → 3 calm professional replies",
  description:
    "Paste an angry, awkward, or high-stakes email. Get firm, warm, and brief paste-ready replies plus subject lines and a don't-say note. Free preview. Full unlock $1.",
  openGraph: {
    title: "ReplyCalm — send the calm version",
    description:
      "Paste a rough email. Get 3 professional replies in seconds. Free preview · $1 unlock.",
    type: "website",
    url: siteUrl,
    siteName: "ReplyCalm",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "ReplyCalm — Rough email → calm replies",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ReplyCalm",
    description:
      "Paste a rough email → get 3 calm professional replies. Free preview. $1 unlock.",
    images: ["/og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <div className="flex min-h-screen flex-col">
          <nav className="print:hidden border-b border-white/5 bg-[#070b14]/80 backdrop-blur-md">
            <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
              <Link
                href="/"
                className="text-sm font-bold tracking-tight text-sky-100"
              >
                Reply<span className="text-sky-400">Calm</span>
              </Link>
              <div className="flex items-center gap-4 text-sm">
                <Link
                  href="/create"
                  className="text-slate-300 transition hover:text-sky-200"
                >
                  Compose
                </Link>
                <Link
                  href="/create"
                  className="rounded-lg bg-sky-500 px-3 py-1.5 text-xs font-semibold text-[#070b14] hover:bg-sky-400"
                >
                  Try free
                </Link>
              </div>
            </div>
          </nav>
          <div className="flex-1">{children}</div>
          <footer className="print:hidden border-t border-white/5 py-8 text-center text-xs text-slate-500">
            <p>
              ReplyCalm · Paste-ready replies when the stakes are high ·{" "}
              <a
                href="https://github.com/healthyhabitat/replycalm"
                className="text-slate-400 underline-offset-2 hover:text-sky-300 hover:underline"
                target="_blank"
                rel="noreferrer"
              >
                GitHub
              </a>
            </p>
          </footer>
        </div>
      </body>
    </html>
  );
}
