"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Authenticator, useAuthenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";

const formFields = {
  signUp: {
    name: {
      label: "Full Name",
      placeholder: "Nhập họ và tên của bạn",
      required: true,
      order: 1,
    },
  },
};

function LoginContent() {
  const { user } = useAuthenticator();
  const router = useRouter();

  // Hook này sẽ chạy ngay lập tức khi user đăng nhập xong
  useEffect(() => {
    if (user) {
      console.log("Login thành công, đang chuyển trang...");
      router.push("/"); // Lệnh chuyển về trang chủ
    }
  }, [user, router]); // Chạy lại nếu user thay đổi

  // Trong lúc chờ chuyển trang, hiện thông báo này
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12  sm:px-6 lg:px-8">
      <div className="text-center">
        <p className="text-lg text-zinc-600 dark:text-zinc-400">
          Đăng nhập thành công! Đang chuyển trang...
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <Authenticator hideSignUp formFields={formFields}>
          <LoginContent />
        </Authenticator>
      </div>
    </div>
  );
}
