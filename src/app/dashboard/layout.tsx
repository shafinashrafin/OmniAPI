"use client";

import { useEffect, useState, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Zap,
  LayoutDashboard,
  Plug,
  Box,
  Key,
  BarChart3,
  Terminal,
  ScrollText,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { auth, signOut } from "@/lib/firebase";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Overview" },
  { href: "/dashboard/providers", icon: Plug, label: "Providers" },
  { href: "/dashboard/models", icon: Box, label: "Models" },
  { href: "/dashboard/keys", icon: Key, label: "API Keys" },
  { href: "/dashboard/playground", icon: Terminal, label: "Playground" },
  { href: "/dashboard/logs", icon: ScrollText, label: "Logs" },
  { href: "/dashboard/analytics", icon: BarChart3, label: "Analytics" },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="flex items-center gap-3">
          <Zap className="w-5 h-5 text-text-muted animate-pulse" />
          <span className="text-text-muted text-sm">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Mobile header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 border-b border-border bg-surface-2/95 backdrop-blur-lg flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-base font-bold tracking-tight">OmniAPI</span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 -mr-2 text-text-muted hover:text-text transition-colors"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full border-r border-border bg-surface-2 z-50 flex flex-col w-64 transition-transform duration-200 ease-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 lg:w-56 xl:w-60`}
      >
        {/* Logo — hidden on mobile since we have the header */}
        <div className="h-14 sm:h-16 items-center px-4 border-b border-border gap-2 hidden lg:flex">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-base font-bold tracking-tight">OmniAPI</span>
        </div>

        {/* Spacer for mobile header */}
        <div className="h-14 lg:hidden" />

        {/* Nav */}
        <nav className="flex-1 py-3 space-y-0.5 px-2.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary text-white"
                    : "text-text-muted hover:text-text hover:bg-surface-3"
                }`}
              >
                <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* User + sign out */}
        <div className="p-3 border-t border-border space-y-2">
          {user && (
            <div className="px-3 py-2">
              <p className="text-sm font-medium truncate">{user.displayName || "User"}</p>
              <p className="text-xs text-text-muted truncate">{user.email}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-text-muted hover:text-error hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="pt-14 lg:pt-0 lg:ml-56 xl:ml-60 min-h-screen">
        <div className="max-w-6xl mx-auto p-4 sm:p-6">{children}</div>
      </main>
    </div>
  );
}
