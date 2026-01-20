"use client";

import Link from "next/link";
import { useAuthenticator } from "@aws-amplify/ui-react";

export default function Home() {
  const { user} = useAuthenticator();

 

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 font-sans dark:bg-black">
    

      {/* Main Content */}
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
        <div className="w-full max-w-3xl text-center">
          <h1 className="text-4xl font-bold leading-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl">
            Tìm kiếm công việc mơ ước của bạn
          </h1>
          <p className="mt-6 text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            CloudHire - Nền tảng tuyển dụng serverless trên AWS. 
            Kết nối ứng viên với cơ hội nghề nghiệp tốt nhất.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/jobs"
              className="rounded-md bg-zinc-900 px-6 py-3 text-base font-medium text-white hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-100"
            >
              Xem danh sách việc làm
            </Link>
            {!user && (
              <Link
                href="/signup"
                className="rounded-md border border-zinc-300 bg-white px-6 py-3 text-base font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Đăng ký ngay
              </Link>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
