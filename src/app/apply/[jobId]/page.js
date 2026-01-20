"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { getJobDetail } from "../../../services/jobService";
import ApplyForm from "@/components/ApplyForm";
import { useAsyncStatus } from "@/hooks/useAsyncStatus";

/**
 * Page để apply job với giao diện mới
 */
export default function ApplyJobPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthenticator();
  const jobId = params?.jobId;

  // State
  const [job, setJob] = useState(null);
  const { loading, setLoading, error, setError } = useAsyncStatus(true);

  // Redirect nếu chưa login
  useEffect(() => {
    if (!user) {
      router.push("/login");
    }
  }, [user, router]);

  // Load job detail
  useEffect(() => {
    if (jobId && user) {
      loadJobDetail();
    }
  }, [jobId, user]);

  const loadJobDetail = async () => {
    try {
      setLoading(true);
      const jobData = await getJobDetail(jobId);
      setJob(jobData);
    } catch (err) {
      setError(err.message || "Không thể tải thông tin công việc");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null; // Đang redirect
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-zinc-900 border-r-transparent dark:border-zinc-50"></div>
          <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
            Đang tải thông tin...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 font-sans dark:bg-black">
      {/* Header */}
      <nav className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              {job?.title || "Ứng tuyển"}
            </h1>
            {job?.company && (
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                {job.company} - {job.location}
              </p>
            )}
          </div>
          <button
            onClick={() => router.back()}
            className="text-2xl font-light text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
          >
            ×
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <ApplyForm
          jobId={jobId}
          user={user}
          onSuccess={() =>
            setTimeout(() => {
              router.push("/jobs");
            }, 2000)
          }
        />
      </main>
    </div>
  );
}
