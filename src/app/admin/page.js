"use client";

import { Authenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import { useAuthenticator } from "@aws-amplify/ui-react";
import Link from "next/link";

function AdminContent() {
  const { user, signOut } = useAuthenticator();

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      {/* Header */}
      <nav className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="text-xl font-semibold text-zinc-900 dark:text-zinc-50"
          >
            CloudHire
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              {user.signInDetails?.loginId || user.username}
            </span>
            <Link
              href="/"
              className="text-sm font-medium text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-50"
            >
              Trang chủ
            </Link>
            <button
              onClick={signOut}
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-100"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </nav>

      {/* Admin Content */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-lg bg-white p-8 shadow-sm dark:bg-zinc-900">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            Trang Admin
          </h1>
          <p className="mt-4 text-zinc-600 dark:text-zinc-400">
            Chào mừng đến trang quản trị. Bạn đã đăng nhập thành công.
          </p>
          <div className="mt-6">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              Thông tin tài khoản
            </h2>
            <div className="mt-4 space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
              <p>
                <strong>Username:</strong> {user.username}
              </p>
              <p>
                <strong>User ID:</strong> {user.userId}
              </p>
              {user.signInDetails?.loginId && (
                <p>
                  <strong>Email:</strong> {user.signInDetails.loginId}
                </p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function AdminPage() {
  return (
    <Authenticator socialProviders={["google"]}>
      <AdminContent />
    </Authenticator>
  );
}

