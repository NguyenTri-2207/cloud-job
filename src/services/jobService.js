/**
 * Service để gọi API jobs từ API Gateway
 *
 * Endpoints:
 * - GET /jobs - Lấy danh sách jobs
 * - GET /jobs/:id - Lấy chi tiết job
 *
 * Tự động fallback sang mock data nếu không có API endpoint
 */

import {
  mockGetJobsList,
  mockGetJobDetail,
  mockSubmitApplication,
} from "./mockData";

/**
 * Kiểm tra xem có nên dùng mock data không
 */
function shouldUseMockData() {
  const apiEndpoint = process.env.NEXT_PUBLIC_API_GATEWAY_URL;
  const useMock = process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";

  // Dùng mock nếu:
  // 1. Có flag USE_MOCK_DATA = true
  // 2. Hoặc không có API endpoint
  return useMock || !apiEndpoint;
}

/**
 * Kiểm tra xem error có phải là network error không
 * (Failed to fetch, CORS, timeout, etc.)
 */
function isNetworkError(error) {
  if (!error) return false;

  const errorMessage = error.message?.toLowerCase() || "";
  const errorName = error.name?.toLowerCase() || "";

  // Các loại network errors
  const networkErrorPatterns = [
    "failed to fetch",
    "networkerror",
    "network error",
    "network request failed",
    "fetch failed",
    "cors",
    "timeout",
    "connection",
    "econnrefused",
    "enotfound",
    "eai_again",
  ];

  return (
    networkErrorPatterns.some(
      (pattern) => errorMessage.includes(pattern) || errorName.includes(pattern)
    ) ||
    error instanceof TypeError ||
    error instanceof DOMException
  );
}

/**
 * Lấy danh sách jobs
 * @param {Object} options - Query options
 * @param {number} options.page - Page number (default: 1)
 * @param {number} options.limit - Items per page (default: 10)
 * @param {string} options.authToken - JWT token (optional, nếu cần auth)
 * @returns {Promise<{jobs: Array, total: number, page: number, limit: number}>}
 */
export async function getJobsList(options = {}) {
  const { page = 1, limit = 10, authToken = null } = options;

  // Nếu không có API endpoint, dùng mock data
  if (shouldUseMockData()) {
    console.log("📦 Using mock data for jobs list");
    return await mockGetJobsList(page, limit);
  }

  const apiEndpoint = process.env.NEXT_PUBLIC_API_GATEWAY_URL;

  try {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    const headers = {
      "Content-Type": "application/json",
    };

    // Thêm auth token nếu có
    if (authToken) {
      headers.Authorization = `Bearer ${authToken}`;
    }

    const response = await fetch(`${apiEndpoint}/jobs?${queryParams}`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: "Unknown error" }));
      throw new Error(
        error.message || `HTTP ${response.status}: ${response.statusText}`
      );
    }

    const data = await response.json();

    // Handle different response formats
    // Format 1: { jobs: [], total, page, limit }
    // Format 2: { data: { jobs: [], total, page, limit } }
    // Format 3: Direct array (fallback)
    if (Array.isArray(data)) {
      return {
        jobs: data,
        total: data.length,
        page: 1,
        limit: data.length,
      };
    }

    if (data.data) {
      return data.data;
    }

    return {
      jobs: data.jobs || [],
      total: data.total || 0,
      page: data.page || page,
      limit: data.limit || limit,
    };
  } catch (error) {
    console.error("Error fetching jobs list:", error);

    // Tự động fallback sang mock data nếu là network error
    if (isNetworkError(error)) {
      console.warn(
        "⚠️ Network error detected, falling back to mock data:",
        error.message
      );
      return await mockGetJobsList(page, limit);
    }

    // Với các lỗi khác (400, 401, 500, etc.), vẫn throw để user biết
    throw error;
  }
}

/**
 * Lấy chi tiết job theo ID
 * @param {string} jobId - Job ID
 * @param {string} authToken - JWT token (optional)
 * @returns {Promise<Object>}
 */
export async function getJobDetail(jobId, authToken = null) {
  if (!jobId) {
    throw new Error("Job ID is required");
  }

  // Nếu không có API endpoint, dùng mock data
  if (shouldUseMockData()) {
    console.log("📦 Using mock data for job detail");
    return await mockGetJobDetail(jobId);
  }

  const apiEndpoint = process.env.NEXT_PUBLIC_API_GATEWAY_URL;

  try {
    const headers = {
      "Content-Type": "application/json",
    };

    if (authToken) {
      headers.Authorization = `Bearer ${authToken}`;
    }

    const response = await fetch(`${apiEndpoint}/jobs/${jobId}`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Job không tồn tại");
      }
      const error = await response
        .json()
        .catch(() => ({ message: "Unknown error" }));
      throw new Error(
        error.message || `HTTP ${response.status}: ${response.statusText}`
      );
    }

    const data = await response.json();

    // Handle different response formats
    if (data.data) {
      return data.data;
    }

    return data;
  } catch (error) {
    console.error("Error fetching job detail:", error);

    // Tự động fallback sang mock data nếu là network error
    if (isNetworkError(error)) {
      console.warn(
        "⚠️ Network error detected, falling back to mock data:",
        error.message
      );
      return await mockGetJobDetail(jobId);
    }

    // Với các lỗi khác (404, 401, 500, etc.), vẫn throw để user biết
    throw error;
  }
}

/**
 * Submit application cho job
 * @param {string} jobId - Job ID
 * @param {string} cvFileKey - S3 key của CV file
 * @param {string} authToken - JWT token (required)
 * @returns {Promise<Object>}
 */
export async function submitApplication(jobId, cvFileKey, authToken) {
  if (!authToken) {
    throw new Error("Authentication token is required");
  }

  // Nếu không có API endpoint, dùng mock data
  if (shouldUseMockData()) {
    console.log("📦 Using mock data for submit application");
    return await mockSubmitApplication(jobId, cvFileKey);
  }

  const apiEndpoint = process.env.NEXT_PUBLIC_API_GATEWAY_URL;

  try {
    const response = await fetch(`${apiEndpoint}/jobs/${jobId}/apply`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        cvFileKey,
      }),
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: "Unknown error" }));
      throw new Error(
        error.message || `HTTP ${response.status}: ${response.statusText}`
      );
    }

    const data = await response.json();
    return data.data || data;
  } catch (error) {
    console.error("Error submitting application:", error);

    // Tự động fallback sang mock data nếu là network error
    if (isNetworkError(error)) {
      console.warn(
        "⚠️ Network error detected, falling back to mock data:",
        error.message
      );
      return await mockSubmitApplication(jobId, cvFileKey);
    }

    // Với các lỗi khác (400, 401, 500, etc.), vẫn throw để user biết
    throw error;
  }
}
