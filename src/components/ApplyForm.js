"use client";

import { useState } from "react";
import { fetchAuthSession } from "aws-amplify/auth";
import { submitApplication } from "@/services/jobService";
import { uploadCVToS3 } from "@/services/s3Service"; // 👈 Sửa tên hàm import cho đúng
import { useAsyncStatus } from "@/hooks/useAsyncStatus";

/**
 * Form ứng tuyển: upload CV + nhập cover letter
 */
export default function ApplyForm({ jobId, jobTitle, user, onSuccess }) {
  const {
    error,
    setError,
    success,
    setSuccess,
    resetStatus,
  } = useAsyncStatus(false);

  const [coverLetter, setCoverLetter] = useState("");
  const [uploadedFileKey, setUploadedFileKey] = useState(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState(null); // Link CloudFront
  const [uploadedFileName, setUploadedFileName] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    // Reset trạng thái cũ
    resetStatus();
    setUploadedFileKey(null);
    setUploadedFileUrl(null);
    setUploadedFileName(null);
    setShowPreview(false);

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // 👇 GỌI HÀM UPLOAD MỚI (Gọn hơn nhiều)
      // Không cần tự tạo key public/cvs/... ở đây nữa, service lo hết
      const result = await uploadCVToS3(selectedFile, (percent) => {
        setUploadProgress(percent);
      });

      setUploadedFileKey(result.fileKey);
      setUploadedFileUrl(result.fileUrl); // Link xem ngay (CloudFront)
      setUploadedFileName(selectedFile.name);
      
      showToast("Upload CV thành công!", "success");

    } catch (err) {
      console.error("Upload failed:", err);
      setError(err.message || "Lỗi khi upload file. Vui lòng thử lại.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    resetStatus();

    if (!uploadedFileKey) {
      setError("Vui lòng upload CV trước khi nộp.");
      showToast("Chưa có CV!", "error");
      return;
    }

    setIsSubmitting(true);

    try {
      // Lấy Token xác thực
      const session = await fetchAuthSession();
      const idToken = session.tokens?.idToken?.toString();

      if (!idToken) {
        throw new Error("Phiên đăng nhập hết hạn. Vui lòng login lại.");
      }

      // Gửi đơn ứng tuyển
      await submitApplication(jobId, uploadedFileKey, idToken, {
        coverLetter: coverLetter.trim(),
        // Có thể gửi thêm fileUrl để lưu vào DB cho tiện admin xem
        cvUrl: uploadedFileUrl 
      });

      setSuccess(true);
      showToast("Nộp đơn thành công!", "success");
      
      if (onSuccess) {
        setTimeout(onSuccess, 1500); // Delay chút cho user đọc thông báo
      }
    } catch (err) {
      console.error("Submit failed:", err);
      setError(err.message || "Nộp đơn thất bại. Vui lòng thử lại.");
      showToast("Lỗi nộp đơn!", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 animate-fade-in rounded-lg px-6 py-3 shadow-xl text-sm font-medium transition-all ${
            toast.type === "success"
              ? "bg-green-600 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="rounded-md bg-green-50 p-4 text-green-800 border border-green-200">
          <p className="font-bold">🎉 Nộp đơn thành công!</p>
          <p className="text-sm mt-1">Hệ thống đã gửi email xác nhận cho bạn.</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="rounded-md bg-red-50 p-4 text-red-800 border border-red-200 text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* Upload Area */}
      <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          CV / Resume
        </h2>
        
        <div className="rounded-lg border-2 border-dashed border-zinc-300 p-8 text-center transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800/50">
          {!uploadedFileKey ? (
            // Trạng thái chưa upload
            <>
              <svg className="mx-auto h-12 w-12 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <div className="mt-4">
                <label className="cursor-pointer">
                  <span className="rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 transition-all">
                    Chọn file PDF
                  </span>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileChange}
                    disabled={isUploading}
                    className="hidden"
                  />
                </label>
                <p className="mt-3 text-xs text-zinc-500">PDF, Word (Max 5MB)</p>
              </div>
            </>
          ) : (
            // Trạng thái đã upload xong
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-3 bg-green-50 px-4 py-3 rounded-lg border border-green-100 mb-4">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-left">
                  <p className="text-sm font-medium text-green-900">{uploadedFileName}</p>
                  <p className="text-xs text-green-600">Đã sẵn sàng nộp</p>
                </div>
                {/* Nút X để xóa/chọn lại */}
                <button 
                  type="button"
                  onClick={() => { setUploadedFileKey(null); setUploadedFileUrl(null); }}
                  className="ml-2 text-zinc-400 hover:text-red-500"
                >
                  ✕
                </button>
              </div>

              {/* Preview Button */}
              {uploadedFileUrl && (
                <div className="flex gap-3">
                  <a
                    href={uploadedFileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-medium text-blue-600 hover:underline"
                  >
                    Mở tab mới ↗
                  </a>
                  {uploadedFileName?.toLowerCase().endsWith(".pdf") && (
                    <button
                      type="button"
                      onClick={() => setShowPreview(!showPreview)}
                      className="text-sm font-medium text-zinc-600 hover:text-black hover:underline"
                    >
                      {showPreview ? "Đóng xem trước" : "Xem trước tại đây"}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Progress Bar */}
          {isUploading && (
            <div className="mt-6 w-full max-w-xs mx-auto">
              <div className="flex justify-between text-xs text-zinc-500 mb-1">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600 transition-all duration-300 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* PDF Preview Frame */}
        {showPreview && uploadedFileUrl && (
          <div className="mt-4 border rounded-lg overflow-hidden bg-zinc-100 h-[500px]">
            <iframe
              src={uploadedFileUrl}
              className="w-full h-full"
              title="CV Preview"
            />
          </div>
        )}
      </div>

      {/* Cover Letter */}
      <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <label htmlFor="coverLetter" className="block text-sm font-semibold text-zinc-900 mb-2">
          Thư giới thiệu (Cover Letter)
        </label>
        <textarea
          id="coverLetter"
          rows={5}
          value={coverLetter}
          onChange={(e) => setCoverLetter(e.target.value)}
          placeholder="Hãy viết vài dòng ngắn gọn giới thiệu về bản thân và lý do bạn phù hợp với vị trí này..."
          className="w-full rounded-md border-zinc-300 shadow-sm focus:border-black focus:ring-black sm:text-sm p-3 dark:bg-zinc-800 dark:border-zinc-700"
        />
      </div>

      {/* Submit Actions */}
      <button
        type="submit"
        disabled={isSubmitting || isUploading || !uploadedFileKey}
        className="w-full rounded-lg bg-black px-6 py-4 text-base font-bold text-white shadow hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        {isSubmitting ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Đang gửi hồ sơ...
          </span>
        ) : (
          "Nộp Hồ Sơ Ngay"
        )}
      </button>
    </form>
  );
}