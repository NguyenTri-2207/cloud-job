"use client";

import { useState, useEffect } from "react";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { fetchAuthSession } from "aws-amplify/auth";
import { getJobsList, deleteJob } from "../services/jobService";
import EditJobForm from "./EditJobForm";

/**
 * Component hiển thị danh sách jobs trong admin với chức năng edit/delete
 */
export default function JobsListAdmin({ onRefresh }) {
  const { user } = useAuthenticator();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingJob, setEditingJob] = useState(null);
  const [deletingJobId, setDeletingJobId] = useState(null);

  useEffect(() => {
    loadJobs();
  }, [onRefresh]);

  const loadJobs = async () => {
    setLoading(true);
    setError("");

    try {
      let authToken = null;
      if (user) {
        try {
          const session = await fetchAuthSession();
          authToken = session.tokens?.idToken?.toString();
        } catch (authError) {
          console.warn("Could not get auth token:", authError);
        }
      }

      const data = await getJobsList({
        page: 1,
        limit: 100, // Load tất cả jobs cho admin
        authToken,
      });

      setJobs(data.jobs || []);
    } catch (err) {
      setError(err.message || "Có lỗi xảy ra khi tải danh sách jobs");
      console.error("Error loading jobs:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (job) => {
    setEditingJob(job);
  };

  const handleCancelEdit = () => {
    setEditingJob(null);
  };

  const handleUpdateSuccess = () => {
    setEditingJob(null);
    loadJobs(); // Reload danh sách
    if (onRefresh) onRefresh();
  };

  const handleDelete = async (jobId) => {
    if (!confirm("Bạn có chắc chắn muốn xóa công việc này?")) {
      return;
    }

    // Đảm bảo jobId tồn tại
    if (!jobId) {
      alert("Không tìm thấy ID của công việc. Vui lòng thử lại.");
      return;
    }

    setDeletingJobId(jobId);

    try {
      const session = await fetchAuthSession();
      const idToken = session.tokens?.idToken?.toString();

      if (!idToken) {
        throw new Error(
          "Không thể lấy authentication token. Vui lòng đăng nhập lại."
        );
      }

      console.log("🗑️ Deleting job with ID:", jobId);
      await deleteJob(jobId, idToken);

      // Reload danh sách
      loadJobs();
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(err.message || "Có lỗi xảy ra khi xóa job");
      console.error("Error deleting job:", err);
    } finally {
      setDeletingJobId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-zinc-900 border-r-transparent dark:border-zinc-50"></div>
          <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
            Đang tải danh sách...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
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
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
          Chưa có công việc nào
        </p>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Tạo công việc mới ở form bên trên
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {jobs.map((job) => {
        // Frontend dùng id thay vì _id (partition key = id)
        // Ưu tiên job.id, chỉ fallback sang _id nếu không có id
        const jobId = job.id || job._id;
        if (!jobId) {
          console.warn("Job missing ID:", job);
        }
        const isEditing =
          editingJob && (editingJob.id === jobId || editingJob._id === jobId);
        const isDeleting = deletingJobId === jobId;

        return (
          <div
            key={jobId}
            className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
          >
            {isEditing ? (
              <EditJobForm
                job={editingJob}
                onSuccess={handleUpdateSuccess}
                onError={(err) => {
                  alert(err);
                }}
                onCancel={handleCancelEdit}
              />
            ) : (
              <>
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

                <div className="mt-4 flex items-center gap-3">
                  <button
                    onClick={() => handleEdit(job)}
                    className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-100"
                  >
                    Chỉnh sửa
                  </button>
                  <button
                    onClick={() => handleDelete(jobId)}
                    disabled={isDeleting}
                    className="rounded-md border border-red-300 bg-white px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-red-700 dark:bg-zinc-900 dark:text-red-400 dark:hover:bg-red-900/20"
                  >
                    {isDeleting ? "Đang xóa..." : "Xóa"}
                  </button>
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
