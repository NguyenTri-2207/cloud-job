"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { getJobDetail } from "../../../services/jobService";

/**
 * Job detail page
 * - Show full job info
 * - Apply button (only when logged in)
 * - Loading and error states
 */
export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthenticator();
  const jobId = params?.id;

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (jobId) {
      loadJobDetail();
    }
  }, [jobId]);

  const loadJobDetail = async () => {
    setLoading(true);
    setError("");

    try {
      const jobData = await getJobDetail(jobId);
      setJob(jobData);
    } catch (err) {
      setError(err.message || "Unable to load job details");
      console.error("Error loading job detail:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyClick = () => {
    if (!user) {
      router.push("/login");
      return;
    }
    router.push(`/apply/${jobId}`);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="flex min-h-screen flex-col ">
     

      {/* Main Content */}
      <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-zinc-900 border-r-transparent dark:border-zinc-50"></div>
              <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
                Loading job details...
              </p>
            </div>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="rounded-lg border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="text-center">
              <p className="text-lg font-medium text-red-600 dark:text-red-400">
                {error}
              </p>
              <div className="mt-6 flex gap-4 justify-center">
                <button
                  onClick={loadJobDetail}
                  className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-100"
                >
                  Retry
                </button>
                <Link
                  href="/jobs"
                  className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  Back to jobs
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Job Detail */}
        {!loading && !error && job && (
          <div className="space-y-6">
            {/* Job Header */}
            <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                    {job.title || "Untitled"}
                  </h1>
                  <p className="mt-2 text-lg text-zinc-600 dark:text-zinc-400">
                    {job.company || "Company not provided"}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-4 text-sm text-zinc-600 dark:text-zinc-400">
                    {job.location && (
                      <span className="flex items-center gap-1">
                        📍 {job.location}
                      </span>
                    )}
                    {job.type && (
                      <span className="flex items-center gap-1">
                        💼 {job.type}
                      </span>
                    )}
                    {job.createdAt && (
                      <span className="flex items-center gap-1">
                        📅 {formatDate(job.createdAt)}
                      </span>
                    )}
                  </div>
                </div>
                {job.salary && (
                  <div className="ml-6 text-right">
                    <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                      {job.salary}
                    </p>
                  </div>
                )}
              </div>

              {/* Apply Button */}
              <div className="mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-800">
                {user ? (
                  <button
                    onClick={handleApplyClick}
                    className="w-full rounded-md bg-zinc-900 px-6 py-3 text-base font-medium text-white hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-100"
                  >
                    Apply now
                  </button>
                ) : (
                  <div className="text-center">
                    <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-400">
                      Please sign in to apply
                    </p>
                    <Link
                      href="/login"
                      className="inline-block w-full rounded-md bg-zinc-900 px-6 py-3 text-base font-medium text-white hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-100"
                    >
                      Sign in to apply
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Job Description */}
            {job.description && (
              <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
                <h2 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                  Job Description
                </h2>
                <div
                  className="prose prose-zinc max-w-none dark:prose-invert"
                  dangerouslySetInnerHTML={{
                    __html: job.description.replace(/\n/g, "<br />"),
                  }}
                />
              </div>
            )}

            {/* Job Requirements */}
            {job.requirements && (
              <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
                <h2 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                  Requirements
                </h2>
                <div
                  className="prose prose-zinc max-w-none dark:prose-invert"
                  dangerouslySetInnerHTML={{
                    __html: job.requirements.replace(/\n/g, "<br />"),
                  }}
                />
              </div>
            )}

            {/* Additional Info */}
            <div className="flex gap-4">
              <Link
                href="/jobs"
                className="flex-1 rounded-md border border-zinc-300 bg-white px-6 py-3 text-center text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                ← Back to jobs
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

