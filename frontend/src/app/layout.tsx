import type { Metadata } from "next";
import { ScanHistoryProvider } from "@/viewmodels/scanHistoryStore";
import { AppShell } from "@/views/shell/AppShell";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Aegis — Content Moderation Console",
    template: "%s · Aegis",
  },
  description:
    "Operator console for the Aegis content moderation API: text, image, audio, and video analysis.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full">
        {/* Persistent scan history is shared by every analyzer. */}
        <ScanHistoryProvider>
          <AppShell>{children}</AppShell>
        </ScanHistoryProvider>
      </body>
    </html>
  );
}
