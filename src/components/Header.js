"use client";

import Link from "next/link";
import { useAuthenticator } from "@aws-amplify/ui-react";

export default function Header() {
  const { user } = useAuthenticator();

  return (
    <nav className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="text-xl font-semibold text-zinc-900 dark:text-zinc-50"
        >
          CloudHire
        </Link>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Link
                href="/admin"
                className="text-sm font-medium text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-50"
              >
                Admin
              </Link>
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                {user.signInDetails?.loginId || user.username}
              </span>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-100"
            >
              Đăng nhập
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

