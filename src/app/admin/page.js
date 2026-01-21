"use client";

import { useState } from "react";
import { Authenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import { useAuthenticator } from "@aws-amplify/ui-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import CreateJobForm from "../../components/CreateJobForm";
import JobsListAdmin from "../../components/JobsListAdmin";

const formFields = {
  signUp: {
    "name.formatted": {
      label: "Full Name",
      placeholder: "Enter your full name",
      required: true,
      order: 1,
    },
  },
};

function AdminContent() {
  const { user, signOut } = useAuthenticator();
  const router = useRouter();
  const [successMessage, setSuccessMessage] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCreateJobSuccess = (result) => {
    setSuccessMessage("Tạo công việc thành công!");
    // Clear message sau 3 giây
    setTimeout(() => {
      setSuccessMessage("");
    }, 3000);
    // Trigger refresh jobs list
    setRefreshKey((prev) => prev + 1);
  };

  const handleCreateJobError = (error) => {
    // Error đã được handle trong form component
    console.error("Error creating job:", error);
  };

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
    

      {/* Admin Content */}
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Header Section */}
          <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-zinc-900">
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
              Trang Admin
            </h1>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              Quản lý và tạo các công việc mới
            </p>
          </div>

          {/* Create Job Form */}
          <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-zinc-900">
            <h2 className="mb-6 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              Tạo công việc mới
            </h2>

            {/* Success Message */}
            {successMessage && (
              <div className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-400">
                {successMessage}
              </div>
            )}

            <CreateJobForm
              onSuccess={handleCreateJobSuccess}
              onError={handleCreateJobError}
            />
          </div>

          {/* Jobs List với Edit/Delete */}
          <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-zinc-900">
            <h2 className="mb-6 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              Danh sách công việc
            </h2>
            <JobsListAdmin key={refreshKey} onRefresh={handleRefresh} />
          </div>

          {/* Account Info */}
          <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-zinc-900">
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
    <Authenticator formFields={formFields}>
      <AdminContent />
    </Authenticator>
  );
}
