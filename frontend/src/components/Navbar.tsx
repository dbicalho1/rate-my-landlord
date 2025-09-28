"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { isAuthenticated, removeAuthToken } from "@/lib/api";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Only check authentication after component mounts (hydration)
    setIsLoggedIn(isAuthenticated());
    setIsHydrated(true);
  }, []);

  const handleLogout = () => {
    removeAuthToken();
    setIsLoggedIn(false);
    router.push('/?logout=1');
  };

  const goProtected = (target: string) => {
    if (!isLoggedIn) {
      router.push(`/signin?next=${encodeURIComponent(target)}`);
    } else {
      router.push(target);
    }
  };

  const isActive = (target: string) => {
    if (!pathname) return false;
    // Consider exact match or section match for nested routes
    if (target === "/") return pathname === "/";
    return pathname === target || pathname.startsWith(`${target}/`);
  };
  return (
    <header className="w-full fixed top-0 inset-x-0 z-50 border-b border-white/20 bg-white/30 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="h-16 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 hover:opacity-90">
            <img
              src="/favicon.ico"
              alt="Rate My Landlord Logo"
              className="w-8 h-8 rounded-md"
            />
            <span className="text-xl font-bold text-black">Rate My <span className="text-[#00ac64]">Philly</span> Landlord</span>
          </Link>

          <div className="flex items-center gap-2">
            {!isHydrated ? (
              // Show loading/neutral state during SSR/hydration
              <div className="w-20 h-9 bg-gray-100 rounded-md animate-pulse" />
            ) : isLoggedIn ? (
              <>
                <Link
                  href="/reviews"
                  aria-current={isActive("/reviews") ? "page" : undefined}
                  className={`inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium text-black hover:bg-white/60 transition-colors ${isActive("/reviews") ? "bg-white/60" : ""}`}
                >
                  Browse
                </Link>
                <Link
                  href="/my-reviews"
                  aria-current={isActive("/my-reviews") ? "page" : undefined}
                  className={`inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium text-black hover:bg-white/60 transition-colors ${isActive("/my-reviews") ? "bg-white/60" : ""}`}
                >
                  My Reviews
                </Link>
                <Link
                  href="/saved-reviews"
                  aria-current={isActive("/saved-reviews") ? "page" : undefined}
                  className={`inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium text-black hover:bg-white/60 transition-colors ${isActive("/saved-reviews") ? "bg-white/60" : ""}`}
                >
                  Saved
                </Link>
                <Link
                  href="/submit"
                  aria-current={isActive("/submit") ? "page" : undefined}
                  className={`inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-semibold text-white border-0 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${isActive("/submit") ? "bg-[#008a52]" : "bg-[#00ac64] hover:bg-[#008a52]"}`}
                >
                  Submit Review
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Link
                href="/signin"
                className={`inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-semibold text-white border-0 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${isActive("/signin") ? "bg-[#008a52]" : "bg-[#00ac64] hover:bg-[#008a52]"}`}
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
