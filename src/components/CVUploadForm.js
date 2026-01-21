"use client";

import { useState } from "react";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { uploadFileToS3Amplify, validateFile } from "../services/s3Service";

/**
 * Component form upload CV
 *
 * Props:
 * - onUploadSuccess: (fileKey: string) => void - Callback khi upload thành công
 * - onUploadError: (error: string) => void - Callback khi upload thất bại
 * - jobId?: string - ID của job đang apply (optional)
 */
export default function CVUploadForm({
  onUploadSuccess,
  onUploadError,
  jobId,
}) {
  const { user } = useAuthenticator();
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];

    // Reset state
    setError("");
    setUploadProgress(0);

    // Validate file
    const validation = validateFile(selectedFile);
    if (!validation.valid) {
      setError(validation.error);
      setFile(null);
      setFileName("");
      return;
    }

    setFile(selectedFile);
    setFileName(selectedFile.name);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log(file);

    if (!file) {
      setError("Vui lòng chọn file CV");
      return;
    }

    console.log(user);

    if (!user) {
      setError("Bạn cần đăng nhập để upload CV");
      return;
    }

    setIsUploading(true);
    setError("");
    setUploadProgress(0);

    try {
      // Generate file key với format: cvs/{userId}/{jobId}/{timestamp}_{filename}
      // user object từ Amplify có thể có username hoặc userId
      const userId = user?.username || user?.userId || "anonymous";
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const fileKey = jobId
        ? `public/cvs/${userId}/${jobId}/${Date.now()}_${sanitizedFileName}`
        : `public/cvs/${userId}/${Date.now()}_${sanitizedFileName}`;

      // Upload file lên S3 sử dụng Amplify Storage API
      const uploadResult = await uploadFileToS3Amplify(
        file,
        fileKey,
        (progress) => {
          // Update progress
          setUploadProgress(progress.percent || 0);
        }
      );

      // Callback success
      if (onUploadSuccess) {
        onUploadSuccess(uploadResult.fileKey);
      }

      // Reset form
      setFile(null);
      setFileName("");

      // Reset file input
      const fileInput = document.getElementById("cv-file-input");
      if (fileInput) {
        fileInput.value = "";
      }
    } catch (err) {
      const errorMessage =
        err.message || "Có lỗi xảy ra khi upload file. Vui lòng thử lại.";
      setError(errorMessage);

      if (onUploadError) {
        onUploadError(errorMessage);
      }
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* File Input */}
      <div>
        <label
          htmlFor="cv-file-input"
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
        >
          Chọn file CV (PDF, DOC, DOCX)
        </label>
        <div className="flex items-center gap-4">
          <input
            id="cv-file-input"
            type="file"
            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={handleFileChange}
            disabled={isUploading}
            className="block w-full text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-zinc-50 file:text-zinc-700 hover:file:bg-zinc-100 dark:file:bg-zinc-800 dark:file:text-zinc-300 dark:hover:file:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
        {fileName && (
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Đã chọn: <span className="font-medium">{fileName}</span>
          </p>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Upload Progress */}
      {isUploading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-zinc-600 dark:text-zinc-400">
            <span>Đang upload...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
            <div
              className="h-full bg-zinc-900 transition-all duration-300 dark:bg-zinc-50"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={!file || isUploading}
        className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-100"
      >
        {isUploading ? "Đang upload..." : "Upload CV"}
      </button>

      {/* Info */}
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Kích thước tối đa: 5MB. Định dạng: PDF, DOC, DOCX
      </p>
    </form>
  );
}
