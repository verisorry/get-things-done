import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { ThemeProvider } from "@/components/ThemeProvider";
import { DemoWrapper } from "@/components/DemoWrapper";
import "./globals.css";

export const metadata: Metadata = {
  title: "Get Things Done",
  description: "Personal productivity planner",
  appleWebApp: {
    title: "Get Things Done",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="h-full overflow-hidden">
        <ThemeProvider>
          <Suspense>
            <DemoWrapper>
              {children}
            </DemoWrapper>
          </Suspense>
        </ThemeProvider>
      </body>
    </html>
  );
}
