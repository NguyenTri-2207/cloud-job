"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { getJobDetail } from "../../../services/jobService";
import ApplyForm from "@/components/ApplyForm";
import { useAsyncStatus } from "@/hooks/useAsyncStatus";

/**
 * Apply page
 */
export default function ApplyJobPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthenticator();
  const jobId = params?.jobId;

  // State
  const [job, setJob] = useState(null);
  const { loading, setLoading, error, setError } = useAsyncStatus(true);

  // Redirect if not logged in
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
      setError(err.message || "Unable to load job info");
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
            Loading...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 font-sans dark:bg-black">
     

      {/* Main Content */}
      <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <ApplyForm
          jobId={jobId}
          jobTitle={job?.title}
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
