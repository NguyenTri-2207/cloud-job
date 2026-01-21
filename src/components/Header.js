"use client";

import Link from "next/link";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { useMemo, useState } from "react";

export default function Header() {
  const { user, signOut } = useAuthenticator();
  const [open, setOpen] = useState(false);

  const displayName = useMemo(() => {
    return user?.signInDetails?.loginId || user?.username || "User";
  }, [user]);

  const initials = useMemo(() => {
    const name = displayName || "";
    const parts = name.split("@")[0].split(/[\s._-]+/);
    const letters = parts.slice(0, 2).map((p) => p.charAt(0).toUpperCase());
    return letters.join("") || "U";
  }, [displayName]);

  return (
    <nav className="absolute top-0 left-0 right-0 z-40">
      <div className="mx-auto mt-4 flex max-w-7xl items-center justify-between rounded-full border border-white/60 bg-white/70 px-4 py-3 shadow-lg shadow-black/5 backdrop-blur-md transition dark:border-white/10 dark:bg-white/10 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="text-xl font-semibold text-zinc-900 hover:text-black dark:text-zinc-50"
        >
          CloudHire
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/jobs"
            className="rounded-full px-4 py-2 text-sm font-medium text-zinc-800 transition hover:bg-white hover:shadow-sm dark:text-zinc-100 dark:hover:bg-white/10"
          >
            Jobs
          </Link>

          {user ? (
            <div className="relative">
              <button
                onClick={() => setOpen((v) => !v)}
                className="flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-800 shadow-sm transition hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-linear-to-br from-blue-500 to-indigo-600 text-xs font-semibold text-white">
                  {initials}
                </span>
                <span className="hidden sm:inline">{displayName}</span>
                <span className="text-zinc-400">▾</span>
              </button>

              {open && (
                <div className="absolute right-0 mt-2 w-48 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl ring-1 ring-black/5 dark:border-zinc-700 dark:bg-zinc-900">
                  <div className="px-4 py-3 border-b border-zinc-100 text-sm text-zinc-700 dark:border-zinc-800 dark:text-zinc-200">
                    <p className="font-semibold">{displayName}</p>
                  </div>
                  <Link
                    href="/admin"
                    onClick={() => setOpen(false)}
                    className="block px-4 py-2 text-sm text-zinc-800 hover:bg-zinc-50 dark:text-zinc-100 dark:hover:bg-zinc-800"
                  >
                    Admin
                  </Link>
                  <button
                    onClick={() => {
                      setOpen(false);
                      signOut();
                    }}
                    className="flex w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="rounded-full bg-black px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

