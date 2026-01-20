"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { fetchAuthSession } from "aws-amplify/auth";
import { getJobDetail, submitApplication } from "../../../services/jobService";
import {
  uploadFileToS3Amplify,
  validateFile,
} from "../../../services/s3Service";

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
  const [cvOption, setCvOption] = useState("library"); // "library" or "upload"
  const [selectedCvId, setSelectedCvId] = useState(null);
  const [uploadedFileKey, setUploadedFileKey] = useState(null);
  const [coverLetter, setCoverLetter] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [allowSearch, setAllowSearch] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  // Mock CV library (sẽ thay bằng API thật sau)
  const cvLibrary = [
    { id: "1", name: "Cloud / DevOps Engineer (AWS)", type: "online" },
    { id: "2", name: "NGUYEN-NGOC-TRI", type: "online" },
    { id: "3", name: "NGUYEN-NGOC-TRI-2025", type: "online" },
  ];

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
      const session = await fetchAuthSession();
      const idToken = session.tokens?.idToken?.toString();
      const jobData = await getJobDetail(jobId, idToken);
      setJob(jobData);
    } catch (err) {
      setError(err.message || "Không thể tải thông tin công việc");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    // Reset previous upload state
    setUploadedFileKey(null);
    setUploadedFileUrl(null);
    setUploadedFileName(null);
    setShowPreview(false);

    // Validate file
    const validation = validateFile(selectedFile);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    setIsUploading(true);
    setError("");
    setUploadProgress(0);

    try {
      const userId = user?.username || user?.userId || "anonymous";
      const sanitizedFileName = selectedFile.name.replace(
        /[^a-zA-Z0-9._-]/g,
        "_"
      );
      const fileKey = `cvs/${userId}/${jobId}/${Date.now()}_${sanitizedFileName}`;

      const uploadResult = await uploadFileToS3Amplify(
        selectedFile,
        fileKey,
        (progress) => {
          setUploadProgress(progress.percent || 0);
        }
      );

      setUploadedFileKey(uploadResult.fileKey);
      setUploadedFileUrl(uploadResult.fileUrl);
      setUploadedFileName(selectedFile.name);
      setSelectedCvId(null); // Clear library selection
    } catch (err) {
      setError(err.message || "Có lỗi xảy ra khi upload file");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmitApplication = async (e) => {
    e.preventDefault();

    // Validation
    if (cvOption === "library" && !selectedCvId) {
      setError("Vui lòng chọn CV từ thư viện");
      return;
    }

    if (cvOption === "upload" && !uploadedFileKey) {
      setError("Vui lòng upload CV từ máy tính");
      return;
    }

    if (!agreeTerms) {
      setError("Vui lòng đồng ý với điều khoản sử dụng");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const session = await fetchAuthSession();
      const idToken = session.tokens?.idToken?.toString();

      if (!idToken) {
        throw new Error(
          "Không thể lấy authentication token. Vui lòng đăng nhập lại."
        );
      }

      // Determine CV file key
      const cvFileKey =
        cvOption === "library"
          ? `library/${selectedCvId}` // Mock format
          : uploadedFileKey;

      // Submit application
      await submitApplication(jobId, cvFileKey, idToken, {
        coverLetter: coverLetter.trim(),
        allowSearch,
      });

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
        <form onSubmit={handleSubmitApplication} className="space-y-6">
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

          {/* CV Selection Options */}
          <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Chọn CV
            </h2>

            {/* Option 2: Upload CV */}
            <div>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="cvOption"
                  value="upload"
                  checked={cvOption === "upload"}
                  onChange={(e) => {
                    setCvOption(e.target.value);
                    setSelectedCvId(null);
                  }}
                  className="mt-1 h-4 w-4 text-zinc-900 focus:ring-zinc-500"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    Tải lên CV từ máy tính, chọn hoặc kéo thả
                  </span>
                </div>
              </label>

              {cvOption === "upload" && (
                <div className="mt-4 pl-7">
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
                              {uploadedFileName
                                ?.toLowerCase()
                                .endsWith(".pdf") && (
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

          {/* Terms and Settings */}
          <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="space-y-4">
              {/* Agree Terms */}
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500"
                />
                <span className="text-sm text-zinc-700 dark:text-zinc-300">
                  Tôi đã đọc và đồng ý với{" "}
                  <a
                    href="#"
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                  >
                    "Thoả thuận sử dụng dữ liệu cá nhân"
                  </a>{" "}
                  của Nhà tuyển dụng
                </span>
              </label>

              {/* Allow Search */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-700 dark:text-zinc-300">
                  Cho phép NTD tìm kiếm hồ sơ
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowSearch}
                    onChange={(e) => setAllowSearch(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-zinc-300 dark:peer-focus:ring-zinc-800 rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-600 peer-checked:bg-zinc-900 dark:peer-checked:bg-zinc-50"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || isUploading || !agreeTerms}
            className="w-full rounded-md bg-green-600 px-6 py-3 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Đang xử lý..." : "Nộp hồ sơ ứng tuyển"}
          </button>
        </form>
      </main>
    </div>
  );
}
