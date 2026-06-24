import type { Metadata } from "next";
import { ThemeProvider } from "@/components/ThemeProvider";
import { GoalsSidebar } from "@/components/GoalsSidebar";
import { InboxPanel } from "@/components/InboxPanel";
import "./globals.css";

export const metadata: Metadata = {
  title: "Get Things Done",
  description: "Personal productivity planner",
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
          <div className="flex h-full">
            <GoalsSidebar />
            <div className="flex min-w-0 flex-1 gap-3 p-3">
              <InboxPanel />
              <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-[20px] border border-white/80 bg-white/60 shadow-none backdrop-blur-[20px] dark:border-white/[0.06] dark:bg-white/[0.03]">
                {children}
              </div>
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
