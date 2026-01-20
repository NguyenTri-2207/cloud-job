/**
 * Service để gọi API jobs từ API Gateway
 *
 * Endpoints:
 * - GET /jobs - Lấy danh sách jobs
 * - GET /jobs/:id - Lấy chi tiết job
 *
 */

/**
 * Normalize API endpoint (remove trailing slash)
 * @param {string} endpoint - API endpoint URL
 * @returns {string} - Normalized endpoint
 */
function normalizeEndpoint(endpoint) {
  if (!endpoint) return "";
  return endpoint.endsWith("/") ? endpoint.slice(0, -1) : endpoint;
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

    // API endpoint: https://core-jobs.theblogreviews.com/jobs
    const baseUrl = normalizeEndpoint(apiEndpoint);
    const jobsEndpoint = `${baseUrl}/jobs?${queryParams}`;

    const response = await fetch(jobsEndpoint, {
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

    // Handle different response formats từ API thật
    // Format 1: Direct array [{...}, {...}]
    // Format 2: { jobs: [] } - nested jobs array
    // Format 3: { data: { jobs: [] } } - nested data
    // Format 4: { jobs: [], total, page, limit } - với pagination

    // Nếu là array trực tiếp
    if (Array.isArray(data)) {
      // Filter out các object không phải job (như metadata)
      // CHỈ lấy items có id (bắt buộc) và có title (để đảm bảo là job)
      const jobs = data.filter((item) => item.id && item.title);
      return {
        jobs,
        total: jobs.length,
        page: 1,
        limit: jobs.length,
      };
    }

    // Nếu có nested data
    if (data.data) {
      const jobsData = data.data;
      if (Array.isArray(jobsData)) {
        // Filter chỉ lấy jobs có id
        const filteredJobs = jobsData.filter((item) => item.id && item.title);
        return {
          jobs: filteredJobs,
          total: filteredJobs.length,
          page: data.page || page,
          limit: data.limit || limit,
        };
      }
      // Nếu data.data có jobs array
      if (jobsData.jobs && Array.isArray(jobsData.jobs)) {
        // Filter chỉ lấy jobs có id
        const filteredJobs = jobsData.jobs.filter(
          (item) => item.id && item.title
        );
        return {
          jobs: filteredJobs,
          total: filteredJobs.length,
          page: jobsData.page || page,
          limit: jobsData.limit || limit,
        };
      }
    }

    // Nếu có jobs array trực tiếp
    if (data.jobs && Array.isArray(data.jobs)) {
      // Filter chỉ lấy jobs có id
      const filteredJobs = data.jobs.filter((item) => item.id && item.title);
      return {
        jobs: filteredJobs,
        total: filteredJobs.length,
        page: data.page || page,
        limit: data.limit || limit,
      };
    }

    // Fallback: trả về empty array
    return {
      jobs: [],
      total: 0,
      page,
      limit,
    };
  } catch (error) {
    console.error("Error fetching jobs list:", error);

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

  const apiEndpoint = process.env.NEXT_PUBLIC_API_GATEWAY_URL;

  try {
    const headers = {
      "Content-Type": "application/json",
    };

    if (authToken) {
      headers.Authorization = `Bearer ${authToken}`;
    }

    // API endpoint: https://core-jobs.theblogreviews.com/jobs?id=...
    // CHỈ dùng id để query (partition key = id)
    const baseUrl = normalizeEndpoint(apiEndpoint);
    const jobDetailEndpoint = `${baseUrl}/jobs?id=${encodeURIComponent(jobId)}`;

    const response = await fetch(jobDetailEndpoint, {
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

    // Với các lỗi khác (404, 401, 500, etc.), vẫn throw để user biết
    throw error;
  }
}

/**
 * Submit application cho job
 * @param {string} jobId - Job ID
 * @param {string} cvFileKey - S3 key của CV file
 * @param {string} authToken - JWT token (required)
 * @param {Object} options - Additional options (coverLetter, allowSearch)
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

  const apiEndpoint = process.env.NEXT_PUBLIC_API_GATEWAY_URL;

  try {
    // API endpoint: https://core-jobs.theblogreviews.com/jobs/{jobId}/apply
    const baseUrl = normalizeEndpoint(apiEndpoint);
    const applyEndpoint = `${baseUrl}/jobs/${jobId}/apply`;

    const response = await fetch(applyEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        cvFileKey,
        coverLetter: options.coverLetter || "",
        allowSearch: options.allowSearch || false,
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

    // Với các lỗi khác (400, 401, 500, etc.), vẫn throw để user biết
    throw error;
  }
}

/**
 * Generate unique ID cho job
 * Format: timestamp + random string
 */
function generateJobId() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return `${timestamp}_${random}`;
}

/**
 * Tạo job mới (POST)
 * @param {Object} jobData - Job data theo format mockData.js
 * @param {string} authToken - JWT token (required)
 * @returns {Promise<Object>}
 */
export async function createJob(jobData, authToken) {
  if (!authToken) {
    throw new Error("Authentication token is required");
  }

  const apiEndpoint = process.env.NEXT_PUBLIC_API_GATEWAY_URL;

  try {
    // API endpoint: https://core-jobs.theblogreviews.com/jobs (POST)
    const baseUrl = normalizeEndpoint(apiEndpoint);
    const createJobEndpoint = `${baseUrl}/jobs`;

    // Backend yêu cầu có 'id' trong request body
    // CHỈ dùng id (partition key = id)
    // Generate ID nếu chưa có
    const generatedId = jobData.id || generateJobId();

    const jobDataWithId = {
      ...jobData,
      // CHỈ set id (partition key = id)
      id: generatedId,
    };

    const response = await fetch(createJobEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(jobDataWithId),
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
    if (data.data) {
      return data.data;
    }

    return data;
  } catch (error) {
    console.error("Error creating job:", error);

    throw error;
  }
}

/**
 * Update job (PUT)
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

  const apiEndpoint = process.env.NEXT_PUBLIC_API_GATEWAY_URL;

  try {
    const baseUrl = normalizeEndpoint(apiEndpoint);
    // Dùng query parameter ?id=... thay vì path parameter
    const updateJobEndpoint = `${baseUrl}/jobs?id=${encodeURIComponent(jobId)}`;

    const response = await fetch(updateJobEndpoint, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(jobData),
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: "Unknown error" }));
      throw new Error(
        error.message ||
          error.error ||
          `HTTP ${response.status}: ${response.statusText}`
      );
    }

    const data = await response.json();

    // Handle different response formats
    if (data.data) {
      return data.data;
    }

    return data;
  } catch (error) {
    console.error("Error updating job:", error);

    throw error;
  }
}

/**
 * Delete job (DELETE)
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

  const apiEndpoint = process.env.NEXT_PUBLIC_API_GATEWAY_URL;

  try {
    const baseUrl = normalizeEndpoint(apiEndpoint);
    // Dùng query parameter ?id=... (format: /jobs?id=1768553124319_y1e1utd)
    const deleteJobEndpoint = `${baseUrl}/jobs?id=${encodeURIComponent(jobId)}`;

    console.log("🗑️ DELETE request to:", deleteJobEndpoint);

    const response = await fetch(deleteJobEndpoint, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: "Unknown error" }));
      throw new Error(
        error.message ||
          error.error ||
          `HTTP ${response.status}: ${response.statusText}`
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error deleting job:", error);

    throw error;
  }
}
