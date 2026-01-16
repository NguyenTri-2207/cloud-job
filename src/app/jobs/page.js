"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { fetchAuthSession } from "aws-amplify/auth";
import { getJobsList } from "../../services/jobService";

/**
 * Page danh sách jobs
 *
 * Features:
 * - Hiển thị danh sách jobs với pagination
 * - Click vào job để xem chi tiết
 * - Loading và error states
 */
export default function JobsListPage() {
  const router = useRouter();
  const { user } = useAuthenticator();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const limit = 10;

  useEffect(() => {
    loadJobs();
  }, [page]);

  const loadJobs = async () => {
    setLoading(true);
    setError("");

    try {
      // Lấy auth token nếu user đã login (optional cho public jobs)
      let authToken = null;
      if (user) {
        try {
          const session = await fetchAuthSession();
          authToken = session.tokens?.idToken?.toString();
        } catch (authError) {
          // Ignore auth error, vẫn load jobs public
          console.warn("Could not get auth token:", authError);
        }
      }

      const data = await getJobsList({
        page,
        limit,
        authToken,
      });

      setJobs(data.jobs || []);
      setTotal(data.total || 0);
      setTotalPages(Math.ceil((data.total || 0) / limit));
    } catch (err) {
      setError(err.message || "Có lỗi xảy ra khi tải danh sách jobs");
      console.error("Error loading jobs:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleJobClick = (jobId) => {
    router.push(`/jobs/${jobId}`);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 font-sans dark:bg-black">
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
            {user ? (
              <>
                <Link
                  href="/admin"
                  className="text-sm font-medium text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-50"
                >
                  Admin
                </Link>
                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                  {user.signInDetails?.loginId || user.username}
                </span>
              </>
            ) : (
              <Link
                href="/login"
                className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-100"
              >
                Đăng nhập
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            Danh sách việc làm
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Tìm kiếm cơ hội nghề nghiệp phù hợp với bạn
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-zinc-900 border-r-transparent dark:border-zinc-50"></div>
              <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
                Đang tải danh sách...
              </p>
            </div>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="rounded-md bg-red-50 p-4 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400">
            <p className="font-medium">Lỗi</p>
            <p className="mt-1">{error}</p>
            <button
              onClick={loadJobs}
              className="mt-3 rounded-md bg-red-100 px-3 py-1.5 text-sm font-medium text-red-800 hover:bg-red-200 dark:bg-red-900/40 dark:text-red-300"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* Jobs List */}
        {!loading && !error && (
          <>
            {jobs.length === 0 ? (
              <div className="rounded-lg border border-zinc-200 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
                <p className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
                  Chưa có việc làm nào
                </p>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                  Vui lòng quay lại sau
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {jobs.map((job) => {
                  // Frontend dùng id thay vì _id (partition key = id)
                  const jobId = job.id || job._id;
                  return (
                    <div
                      key={jobId}
                      onClick={() => handleJobClick(jobId)}
                      className="cursor-pointer rounded-lg border border-zinc-200 bg-white p-6 transition-all hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                            {job.title || "Chưa có tiêu đề"}
                          </h3>
                          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                            {job.company || "Công ty chưa được cập nhật"}
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
                          <span>Đăng ngày: {formatDate(job.createdAt)}</span>
                        )}
                        {job.type && <span>• {job.type}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  Trước
                </button>
                <span className="px-4 py-2 text-sm text-zinc-600 dark:text-zinc-400">
                  Trang {page} / {totalPages} ({total} việc làm)
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  Sau
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
