/**
 * Service để gọi API jobs từ API Gateway
 * Sử dụng axios để xử lý HTTP requests
 */

import axios from "axios";

// ============================================
// AXIOS INSTANCE CONFIGURATION
// ============================================

const APPLY_PATH = process.env.NEXT_PUBLIC_APPLY_PATH || "/applys";

const getBaseURL = () => {
  const endpoint = process.env.NEXT_PUBLIC_API_GATEWAY_URL;
  if (!endpoint) return "";
  return endpoint.endsWith("/") ? endpoint.slice(0, -1) : endpoint;
};

const apiClient = axios.create({
  baseURL: getBaseURL(),
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000, // 30 seconds
});

// Request interceptor để thêm auth token
apiClient.interceptors.request.use(
  (config) => {
    // Auth token sẽ được thêm vào headers trong từng request
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor để xử lý errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with error status
      const message =
        error.response.data?.message ||
        error.response.data?.error ||
        error.message ||
        `HTTP ${error.response.status}: ${error.response.statusText}`;
      return Promise.reject(new Error(message));
    } else if (error.request) {
      // Request was made but no response received
      return Promise.reject(new Error("Network error. Please check your connection."));
    } else {
      // Something else happened
      return Promise.reject(error);
    }
  }
);

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Extract data from response (handle nested formats)
 */
const extractResponseData = (data) => {
  if (data?.data) return data.data;
  return data;
};

/**
 * Filter valid jobs (must have id and title)
 */
const filterValidJobs = (items) => {
  if (!Array.isArray(items)) return [];
  return items.filter((item) => item?.id && item?.title);
};

/**
 * Normalize jobs list response
 */
const normalizeJobsResponse = (data, page = 1, limit = 10) => {
  // Format 1: Direct array
  if (Array.isArray(data)) {
    const jobs = filterValidJobs(data);
    return {
      jobs,
      total: jobs.length,
      page: 1,
      limit: jobs.length,
    };
  }

  // Format 2: { jobs: [] }
  if (data?.jobs && Array.isArray(data.jobs)) {
    const jobs = filterValidJobs(data.jobs);
    return {
      jobs,
      total: data.total ?? jobs.length,
      page: data.page ?? page,
      limit: data.limit ?? limit,
    };
  }

  // Format 3: { data: { jobs: [] } } or { data: [] }
  if (data?.data) {
    if (Array.isArray(data.data)) {
      const jobs = filterValidJobs(data.data);
      return {
        jobs,
        total: jobs.length,
        page: data.page ?? page,
        limit: data.limit ?? limit,
      };
    }
    if (data.data?.jobs && Array.isArray(data.data.jobs)) {
      const jobs = filterValidJobs(data.data.jobs);
      return {
        jobs,
        total: data.data.total ?? jobs.length,
        page: data.data.page ?? page,
        limit: data.data.limit ?? limit,
      };
    }
  }

  // Fallback: empty response
  return {
    jobs: [],
    total: 0,
    page,
    limit,
  };
};

/**
 * Generate unique job ID
 */
const generateJobId = () => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return `${timestamp}_${random}`;
};

// ============================================
// API FUNCTIONS
// ============================================

/**
 * Lấy danh sách jobs (Public API - không cần auth)
 * @param {Object} options - Query options
 * @param {number} options.page - Page number (default: 1)
 * @param {number} options.limit - Items per page (default: 10)
 * @returns {Promise<{jobs: Array, total: number, page: number, limit: number}>}
 */
export async function getJobsList(options = {}) {
  const { page = 1, limit = 10 } = options;

  try {
    const response = await apiClient.get("/jobs", {
      params: { page, limit },
    });

    return normalizeJobsResponse(response.data, page, limit);
  } catch (error) {
    console.error("Error fetching jobs list:", error);
    throw error;
  }
}

/**
 * Lấy chi tiết job theo ID (Public API - không cần auth)
 * @param {string} jobId - Job ID
 * @returns {Promise<Object>}
 */
export async function getJobDetail(jobId) {
  if (!jobId) {
    throw new Error("Job ID is required");
  }

  try {
    const response = await apiClient.get("/jobs", {
      params: { id: jobId },
    });

    const data = extractResponseData(response.data);

    if (!data || !data.id) {
      throw new Error("Job không tồn tại");
    }

    return data;
  } catch (error) {
    if (error.response?.status === 404) {
      throw new Error("Job không tồn tại");
    }
    console.error("Error fetching job detail:", error);
    throw error;
  }
}

/**
 * Submit application cho job (Requires auth)
 * @param {string} jobId - Job ID
 * @param {string} cvFileKey - S3 key của CV file
 * @param {string} authToken - JWT token (required)
 * @param {Object} options - Additional options
 * @param {string} options.coverLetter - Cover letter text
 * @param {boolean} options.allowSearch - Allow search flag
 * @returns {Promise<Object>}
 */
export async function submitApplication(
  jobId,
  cvFileKey,
  authToken,
  options = {}
) {
  if (!authToken) {
    throw new Error("Authentication token is required");
  }
  if (!jobId) {
    throw new Error("Job ID is required");
  }
  if (!cvFileKey) {
    throw new Error("CV file key is required");
  }

  try {
    if (process.env.NODE_ENV !== "production") {
      console.log("[submitApplication]", {
        baseURL: apiClient.defaults.baseURL,
        path: APPLY_PATH,
        jobId,
        cvFileKey,
      });
    }

    const response = await apiClient.post(
      APPLY_PATH,
      {
        jobId,
        cvFileKey,
        coverLetter: options.coverLetter || "",
      },
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    return extractResponseData(response.data);
  } catch (error) {
    console.error("Error submitting application:", error);
    throw error;
  }
}

/**
 * Tạo job mới (Requires auth)
 * @param {Object} jobData - Job data
 * @param {string} authToken - JWT token (required)
 * @returns {Promise<Object>}
 */
export async function createJob(jobData, authToken) {
  if (!authToken) {
    throw new Error("Authentication token is required");
  }

  try {
    // Generate ID nếu chưa có
    const jobDataWithId = {
      ...jobData,
      id: jobData.id || generateJobId(),
    };

    const response = await apiClient.post(
      "/jobs",
      jobDataWithId,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    return extractResponseData(response.data);
  } catch (error) {
    console.error("Error creating job:", error);
    throw error;
  }
}

/**
 * Update job (Requires auth)
 * @param {string} jobId - Job ID
 * @param {Object} jobData - Job data để update
 * @param {string} authToken - JWT token (required)
 * @returns {Promise<Object>}
 */
export async function updateJob(jobId, jobData, authToken) {
  if (!authToken) {
    throw new Error("Authentication token is required");
  }
  if (!jobId) {
    throw new Error("Job ID is required");
  }

  try {
    const response = await apiClient.put(
      "/jobs",
      jobData,
      {
        params: { id: jobId },
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    return extractResponseData(response.data);
  } catch (error) {
    console.error("Error updating job:", error);
    throw error;
  }
}

/**
 * Delete job (Requires auth)
 * @param {string} jobId - Job ID
 * @param {string} authToken - JWT token (required)
 * @returns {Promise<Object>}
 */
export async function deleteJob(jobId, authToken) {
  if (!authToken) {
    throw new Error("Authentication token is required");
  }
  if (!jobId) {
    throw new Error("Job ID is required");
  }

  try {
    const response = await apiClient.delete("/jobs", {
      params: { id: jobId },
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    return response.data;
  } catch (error) {
    console.error("Error deleting job:", error);
    throw error;
  }
}
