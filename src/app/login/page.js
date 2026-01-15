"use client";

import { Authenticator } from "@aws-amplify/ui-react";
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

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-12 dark:bg-black sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <Authenticator hideSignUp formFields={formFields} />
      </div>
    </div>
  );
}
