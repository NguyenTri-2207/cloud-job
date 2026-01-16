"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { fetchAuthSession } from "aws-amplify/auth";
import CVUploadForm from "../../../components/CVUploadForm";
import { submitApplication } from "../../../services/jobService";

/**
 * Page để apply job với upload CV
 *
 * Flow:
 * 1. User chọn file CV
 * 2. Upload lên S3 (qua pre-signed URL)
 * 3. Submit application với S3 key
 */
export default function ApplyJobPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthenticator();
  const jobId = params?.jobId;

  const [uploadedFileKey, setUploadedFileKey] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Redirect nếu chưa login
  useEffect(() => {
    if (!user) {
      router.push("/login");
    }
  }, [user, router]);

  const handleUploadSuccess = (fileKey) => {
    setUploadedFileKey(fileKey);
    setError("");
  };

  const handleUploadError = (errorMessage) => {
    setError(errorMessage);
    setUploadedFileKey(null);
  };

  const handleSubmitApplication = async (e) => {
    e.preventDefault();

    if (!uploadedFileKey) {
      setError("Vui lòng upload CV trước khi nộp đơn");
      return;
    }

    if (!jobId) {
      setError("Job ID không hợp lệ");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      // Lấy auth token
      const session = await fetchAuthSession();
      const idToken = session.tokens?.idToken?.toString();

      if (!idToken) {
        throw new Error(
          "Không thể lấy authentication token. Vui lòng đăng nhập lại."
        );
      }

      // Gọi API để submit application
      await submitApplication(jobId, uploadedFileKey, idToken);

      setSuccess(true);

      // Redirect sau 2 giây
      setTimeout(() => {
        router.push("/jobs");
      }, 2000);
    } catch (err) {
      setError(err.message || "Có lỗi xảy ra khi nộp đơn. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return null; // Đang redirect
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 font-sans dark:bg-black">
      {/* Header */}
      <nav className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Nộp đơn ứng tuyển
          </h1>
          <button
            onClick={() => router.back()}
            className="text-sm font-medium text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-50"
          >
            Quay lại
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="mx-auto w-full max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-6 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            Upload CV của bạn
          </h2>

          {/* Success Message */}
          {success && (
            <div className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-400">
              Nộp đơn thành công! Đang chuyển về trang chủ...
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Upload Form */}
          <CVUploadForm
            onUploadSuccess={handleUploadSuccess}
            onUploadError={handleUploadError}
            jobId={jobId}
          />

          {/* Submit Application Button */}
          {uploadedFileKey && !success && (
            <div className="mt-6 border-t border-zinc-200 pt-6 dark:border-zinc-800">
              <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
                CV đã được upload thành công. Bấm nút bên dưới để hoàn tất nộp
                đơn.
              </p>
              <button
                onClick={handleSubmitApplication}
                disabled={isSubmitting}
                className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-100"
              >
                {isSubmitting ? "Đang xử lý..." : "Nộp đơn ứng tuyển"}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
