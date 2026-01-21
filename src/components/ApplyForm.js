"use client";

import { useState } from "react";
import { fetchAuthSession } from "aws-amplify/auth";
import { submitApplication } from "@/services/jobService";
import { uploadFileToS3Amplify, validateFile } from "@/services/s3Service";
import { useAsyncStatus } from "@/hooks/useAsyncStatus";

/**
 * Form ứng tuyển: upload CV + nhập cover letter
 * Tách riêng để page job detail/ apply page gọn hơn.
 */
export default function ApplyForm({ jobId, user, onSuccess }) {
  const {
    error,
    setError,
    success,
    setSuccess,
    resetStatus,
  } = useAsyncStatus(false);

  const [coverLetter, setCoverLetter] = useState("");
  const [uploadedFileKey, setUploadedFileKey] = useState(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState(null);
  const [uploadedFileName, setUploadedFileName] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState(null); // { message, type: 'success' | 'error' }

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    resetStatus();
    setUploadedFileKey(null);
    setUploadedFileUrl(null);
    setUploadedFileName(null);
    setShowPreview(false);

    const validation = validateFile(selectedFile);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const userId = user?.username || user?.userId || "anonymous";
      const sanitizedFileName = selectedFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const fileKey = `cvs/${userId}/${jobId}/${Date.now()}_${sanitizedFileName}`;

      const uploadResult = await uploadFileToS3Amplify(selectedFile, fileKey, (progress) => {
        setUploadProgress(progress.percent || 0);
      });

      setUploadedFileKey(uploadResult.fileKey);
      setUploadedFileUrl(uploadResult.fileUrl);
      setUploadedFileName(selectedFile.name);
    } catch (err) {
      setError(err.message || "Có lỗi xảy ra khi upload file");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    resetStatus();

    if (!uploadedFileKey) {
      setError("Vui lòng upload CV từ máy tính");
      showToast("Vui lòng upload CV từ máy tính", "error");
      return;
    }

    setIsSubmitting(true);

    try {
      const session = await fetchAuthSession();
      const idToken = session.tokens?.idToken?.toString();

      if (!idToken) {
        throw new Error("Không thể lấy authentication token. Vui lòng đăng nhập lại.");
      }

      await submitApplication(jobId, uploadedFileKey, idToken, {
        coverLetter: coverLetter.trim(),
      });

      setSuccess(true);
      showToast("Nộp đơn thành công!", "success");
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError(err.message || "Có lỗi xảy ra khi nộp đơn. Vui lòng thử lại.");
      showToast(err.message || "Nộp đơn thất bại", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Success Message */}
      {success && (
        <div className="rounded-md bg-green-50 p-4 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-400">
          <p className="font-medium">Nộp đơn thành công!</p>
          <p className="mt-1">Đang chuyển về trang danh sách việc làm...</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {/* CV Upload */}
      <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Tải lên CV
        </h2>
        <div className="rounded-lg border-2 border-dashed border-zinc-300 p-8 text-center dark:border-zinc-700">
          <svg
            className="mx-auto h-12 w-12 text-zinc-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div className="mt-4">
            <label className="cursor-pointer">
              <span className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-100">
                Chọn CV
              </span>
              <input
                type="file"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={handleFileChange}
                disabled={isUploading}
                className="hidden"
              />
            </label>
            <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
              Hỗ trợ định dạng .doc, .docx, pdf có kích thước dưới 5MB
            </p>
          </div>
          {isUploading && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm text-zinc-600 dark:text-zinc-400">
                <span>Đang upload...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                <div
                  className="h-full bg-zinc-900 transition-all duration-300 dark:bg-zinc-50"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
          {uploadedFileKey && !isUploading && (
            <div className="mt-4 space-y-3 rounded-md bg-green-50 p-4 dark:bg-green-900/20">
              <div className="flex items-center gap-2">
                <svg
                  className="h-5 w-5 text-green-600 dark:text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-sm font-medium text-green-800 dark:text-green-400">
                  Upload thành công: {uploadedFileName}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {uploadedFileUrl && (
                  <>
                    <a
                      href={uploadedFileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800 underline dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      Xem CV trên S3
                    </a>
                    {uploadedFileName?.toLowerCase().endsWith(".pdf") && (
                      <button
                        type="button"
                        onClick={() => setShowPreview(!showPreview)}
                        className="text-sm text-blue-600 hover:text-blue-800 underline dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        {showPreview ? "Ẩn preview" : "Xem nhanh"}
                      </button>
                    )}
                  </>
                )}
              </div>
              {showPreview &&
                uploadedFileUrl &&
                uploadedFileName?.toLowerCase().endsWith(".pdf") && (
                  <div className="mt-3 rounded border border-zinc-200 dark:border-zinc-700">
                    <iframe
                      src={uploadedFileUrl}
                      className="h-96 w-full"
                      title="CV Preview"
                    />
                  </div>
                )}
            </div>
          )}
        </div>
      </div>

      {/* Cover Letter */}
      <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <label
          htmlFor="coverLetter"
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
        >
          Thư giới thiệu:
        </label>
        <textarea
          id="coverLetter"
          rows={6}
          value={coverLetter}
          onChange={(e) => setCoverLetter(e.target.value)}
          placeholder="Một thư giới thiệu ngắn gọn, chỉn chu sẽ giúp bạn trở nên chuyên nghiệp và gây ấn tượng với nhà tuyển dụng..."
          className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder-zinc-500"
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting || isUploading}
        className="w-full rounded-md bg-green-600 px-6 py-3 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? "Đang xử lý..." : "Nộp hồ sơ ứng tuyển"}
      </button>

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-4 right-4 z-50 rounded-lg px-4 py-3 shadow-lg text-sm ${
            toast.type === "success"
              ? "bg-green-600 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          {toast.message}
        </div>
      )}
    </form>
  );
}

