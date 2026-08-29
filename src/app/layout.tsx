import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { UserProvider } from "@/lib/context/UserContext";
import { ThemeProvider } from "@/components/ui/ThemeProvider";
import ConditionalFooter from "@/components/layout/ConditionalFooter";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "JanGrievance — Your Voice Matters",
    template: "%s | JanGrievance",
  },
  description:
    "JanGrievance is an independent citizen grievance management platform. Raise, track, and resolve your grievances with ease.",
  keywords: ["grievance", "citizen", "complaint", "resolution", "tracking"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} h-full`} suppressHydrationWarning>
      <head>
        {/* Prevent flash of wrong theme on initial load */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('jan-theme');
                  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (stored === 'dark' || (!stored && prefersDark)) {
                    document.documentElement.classList.add('dark');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col font-sans bg-bg text-text-primary antialiased">
        <ThemeProvider>
          <UserProvider>
            <div className="flex-1 flex flex-col min-h-0 w-full">
              {children}
            </div>
            <ConditionalFooter />
          </UserProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
