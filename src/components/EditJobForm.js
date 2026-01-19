"use client";

import { useState, useEffect } from "react";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { fetchAuthSession } from "aws-amplify/auth";
import { updateJob } from "../services/jobService";

/**
 * Component form edit job
 *
 * Props:
 * - job: Object - Job data để edit
 * - onSuccess: () => void - Callback khi update thành công
 * - onError: (error: string) => void - Callback khi có lỗi
 * - onCancel: () => void - Callback khi cancel
 */
export default function EditJobForm({ job, onSuccess, onError, onCancel }) {
  const { user } = useAuthenticator();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Form fields - initialize với job data
  const [formData, setFormData] = useState({
    title: "",
    company: "",
    location: "",
    type: "Full-time",
    salary: "",
    description: "",
    requirements: "",
  });

  // Load job data vào form khi job thay đổi
  useEffect(() => {
    if (job) {
      setFormData({
        title: job.title || "",
        company: job.company || "",
        location: job.location || "",
        type: job.type || "Full-time",
        salary: job.salary || "",
        description: job.description || "",
        requirements: job.requirements || "",
      });
    }
  }, [job]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error khi user nhập
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const jobId = job?.id;
    if (!job || !jobId) {
      setError("Job ID không hợp lệ");
      return;
    }

    // Validation
    if (!formData.title.trim()) {
      setError("Vui lòng nhập tiêu đề công việc");
      return;
    }
    if (!formData.company.trim()) {
      setError("Vui lòng nhập tên công ty");
      return;
    }
    if (!formData.description.trim()) {
      setError("Vui lòng nhập mô tả công việc");
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

      const jobData = {
        title: formData.title.trim(),
        company: formData.company.trim(),
        location: formData.location.trim() || "Remote",
        type: formData.type,
        salary: formData.salary.trim() || "Thỏa thuận",
        description: formData.description.trim(),
        requirements: formData.requirements.trim() || "Đang cập nhật",
      };

      const result = await updateJob(jobId, jobData, idToken);

      // Callback success
      if (onSuccess) {
        onSuccess(result);
      }
    } catch (err) {
      const errorMessage =
        err.message || "Có lỗi xảy ra khi cập nhật job. Vui lòng thử lại.";
      setError(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!job) {
    return null;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title */}
      <div>
        <label
          htmlFor="edit-title"
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
        >
          Tiêu đề công việc <span className="text-red-500">*</span>
        </label>
        <input
          id="edit-title"
          name="title"
          type="text"
          required
          value={formData.title}
          onChange={handleChange}
          className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder-zinc-500"
          placeholder="VD: Senior Full Stack Developer"
        />
      </div>

      {/* Company & Location */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="edit-company"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
          >
            Công ty <span className="text-red-500">*</span>
          </label>
          <input
            id="edit-company"
            name="company"
            type="text"
            required
            value={formData.company}
            onChange={handleChange}
            className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder-zinc-500"
            placeholder="VD: TechCorp Vietnam"
          />
        </div>
        <div>
          <label
            htmlFor="edit-location"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
          >
            Địa điểm
          </label>
          <input
            id="edit-location"
            name="location"
            type="text"
            value={formData.location}
            onChange={handleChange}
            className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder-zinc-500"
            placeholder="VD: Ho Chi Minh City"
          />
        </div>
      </div>

      {/* Type & Salary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="edit-type"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
          >
            Loại công việc
          </label>
          <select
            id="edit-type"
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
          >
            <option value="Full-time">Full-time</option>
            <option value="Part-time">Part-time</option>
            <option value="Contract">Contract</option>
            <option value="Remote">Remote</option>
          </select>
        </div>
        <div>
          <label
            htmlFor="edit-salary"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
          >
            Mức lương
          </label>
          <input
            id="edit-salary"
            name="salary"
            type="text"
            value={formData.salary}
            onChange={handleChange}
            className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder-zinc-500"
            placeholder="VD: 30,000,000 - 50,000,000 VND"
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label
          htmlFor="edit-description"
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
        >
          Mô tả công việc <span className="text-red-500">*</span>
        </label>
        <textarea
          id="edit-description"
          name="description"
          rows={5}
          required
          value={formData.description}
          onChange={handleChange}
          className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder-zinc-500"
          placeholder="Mô tả chi tiết về công việc..."
        />
      </div>

      {/* Requirements */}
      <div>
        <label
          htmlFor="edit-requirements"
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
        >
          Yêu cầu
        </label>
        <textarea
          id="edit-requirements"
          name="requirements"
          rows={5}
          value={formData.requirements}
          onChange={handleChange}
          className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder-zinc-500"
          placeholder="• Yêu cầu 1&#10;• Yêu cầu 2&#10;• Yêu cầu 3"
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-100"
        >
          {isSubmitting ? "Đang cập nhật..." : "Cập nhật"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Hủy
          </button>
        )}
      </div>
    </form>
  );
}
