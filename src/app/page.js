"use client";

import Link from "next/link";
import { useAuthenticator } from "@aws-amplify/ui-react";

export default function Home() {
  const { user} = useAuthenticator();

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50 font-sans dark:from-black dark:via-zinc-900 dark:to-slate-900">
      {/* Animated blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-10 -top-20 h-72 w-72 rounded-full bg-blue-200/40 blur-3xl animate-pulse-slow" />
        <div className="absolute right-0 top-10 h-80 w-80 rounded-full bg-indigo-200/30 blur-3xl animate-pulse-slower" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-cyan-200/25 blur-3xl animate-pulse-slowest" />
      </div>

      {/* Main Content */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
        <div className="w-full max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-sm font-medium text-blue-700 shadow-sm backdrop-blur dark:bg-white/10 dark:text-blue-100">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            Serverless hiring on AWS
          </div>
          <h1 className="mt-6 text-4xl font-bold leading-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl">
            Find your dream job
          </h1>
          <p className="mt-6 text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            CloudHire — connect with the best opportunities, fast and secure.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/jobs"
              className="rounded-lg bg-black px-7 py-3 text-base font-semibold text-white shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            >
              Browse jobs
            </Link>
            {!user && (
              <Link
                href="/signup"
                className="rounded-lg border border-zinc-300 bg-white px-7 py-3 text-base font-semibold text-zinc-800 shadow-sm transition hover:-translate-y-0.5 hover:border-zinc-400 hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-300 focus:ring-offset-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
              >
                Sign up
              </Link>
            )}
          </div>

          {/* Feature pills */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-xs font-medium text-zinc-600 dark:text-zinc-400">
            <span className="rounded-full bg-white/70 px-3 py-1 shadow-sm backdrop-blur dark:bg-white/10">
              🔒 Secure by AWS Cognito
            </span>
            <span className="rounded-full bg-white/70 px-3 py-1 shadow-sm backdrop-blur dark:bg-white/10">
              ⚡ CDN by CloudFront
            </span>
            <span className="rounded-full bg-white/70 px-3 py-1 shadow-sm backdrop-blur dark:bg-white/10">
              📄 CV uploads to S3
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}
