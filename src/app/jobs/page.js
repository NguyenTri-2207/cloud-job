"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { getJobsList } from "../../services/jobService";

// ============================================
// CONSTANTS
// ============================================
const ITEMS_PER_PAGE = 10;

// ============================================
// UTILITY FUNCTIONS
// ============================================
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  try {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateString;
  }
};

// ============================================
// UI COMPONENTS
// ============================================
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-zinc-900 border-r-transparent dark:border-zinc-50"></div>
        <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
          Loading jobs...
        </p>
      </div>
    </div>
  );
}

function ErrorMessage({ error, onRetry }) {
  return (
    <div className="rounded-md bg-red-50 p-4 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400">
      <p className="font-medium">Error</p>
      <p className="mt-1">{error}</p>
      <button
        onClick={onRetry}
        className="mt-3 rounded-md bg-red-100 px-3 py-1.5 text-sm font-medium text-red-800 hover:bg-red-200 dark:bg-red-900/40 dark:text-red-300"
      >
        Retry
      </button>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
        No jobs available
      </p>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Please check back later
      </p>
    </div>
  );
}

function JobCard({ job, onClick }) {
  return (
    <div
      onClick={() => onClick(job.id)}
      className="cursor-pointer rounded-lg border border-zinc-200 bg-white p-6 transition-all hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            {job.title || "Untitled"}
          </h3>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {job.company || "Company not provided"}
          </p>
          {job.location && (
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-500">
              📍 {job.location}
            </p>
          )}
        </div>
        {job.salary && (
          <div className="ml-4 text-right">
            <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              {job.salary}
            </p>
          </div>
        )}
      </div>

      {job.description && (
        <p className="mt-3 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
          {job.description}
        </p>
      )}

      <div className="mt-4 flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-500">
        {job.createdAt && (
          <span>Posted: {formatDate(job.createdAt)}</span>
        )}
        {job.type && <span>• {job.type}</span>}
      </div>
    </div>
  );
}

function Pagination({ page, totalPages, total, onPageChange }) {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-8 flex items-center justify-center gap-2">
      <button
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page === 1}
        className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
      >
        Prev
      </button>
      <span className="px-4 py-2 text-sm text-zinc-600 dark:text-zinc-400">
        Page {page} / {totalPages} ({total} jobs)
      </span>
      <button
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
      >
        Next
      </button>
    </div>
  );
}


// ============================================
// MAIN COMPONENT
// ============================================
/**
 * Jobs listing page
 * - Show jobs with pagination
 * - Click to view details
 * - Loading and error states
 */
export default function JobsListPage() {
  const router = useRouter();
  
  const [page, setPage] = useState(1);
  const [state, setState] = useState({
    jobs: [],
    loading: true,
    error: "",
    total: 0,
  });

  const totalPages = useMemo(
    () => Math.ceil(state.total / ITEMS_PER_PAGE),
    [state.total]
  );

  const loadJobs = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: "" }));

    try {
      const data = await getJobsList({
        page,
        limit: ITEMS_PER_PAGE,
      });


      setState((prev) => ({
        ...prev,
        jobs: data.jobs || [],
        total: data.total || 0,
        loading: false,
      }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: err.message || "Có lỗi xảy ra khi tải danh sách jobs",
        loading: false,
      }));
      console.error("Error loading jobs:", err);
    }
  }, [page]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const handleJobClick = useCallback(
    (jobId) => {
      router.push(`/jobs/${jobId}`);
    },
    [router]
  );

  const handlePageChange = useCallback((newPage) => {
    setPage(newPage);
  }, []);

  const handleRetry = useCallback(() => {
    loadJobs();
  }, [loadJobs]);

  return (
    <div className="flex min-h-screen flex-col font-sans ">
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            Jobs
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Find the right opportunity for you
          </p>
        </div>

        {state.loading && <LoadingSpinner />}
        {!state.loading && state.error && (
          <ErrorMessage error={state.error} onRetry={handleRetry} />
        )}
        {!state.loading && !state.error && (
          <>
            {state.jobs.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="space-y-4">
                {state.jobs.map((job) => (
                  <JobCard key={job.id} job={job} onClick={handleJobClick} />
                ))}
              </div>
            )}
            <Pagination
              page={page}
              totalPages={totalPages}
              total={state.total}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </main>
    </div>
  );
}
