/**
 * Service để xử lý upload file lên S3 thông qua Pre-signed URL
 *
 * Flow:
 * 1. Frontend gọi API Gateway để lấy pre-signed URL
 * 2. Frontend upload file trực tiếp lên S3 bằng pre-signed URL
 * 3. Trả về S3 key/URL để lưu vào database
 */

/**
 * Lấy pre-signed URL từ API Gateway
 * @param {string} fileName - Tên file (sẽ được sanitize ở backend)
 * @param {string} fileType - MIME type của file (e.g., 'application/pdf')
 * @param {string} authToken - JWT token từ Cognito
 * @returns {Promise<{uploadUrl: string, fileKey: string}>}
 */
export async function getPresignedUrl(fileName, fileType, authToken) {
  const apiEndpoint = process.env.NEXT_PUBLIC_API_GATEWAY_URL;

  if (!apiEndpoint) {
    throw new Error(
      "API Gateway URL chưa được cấu hình. Vui lòng thêm NEXT_PUBLIC_API_GATEWAY_URL vào .env"
    );
  }

  try {
    const response = await fetch(`${apiEndpoint}/upload/presigned-url`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        fileName,
        fileType,
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
    return {
      uploadUrl: data.uploadUrl,
      fileKey: data.fileKey, // S3 key để lưu vào database
    };
  } catch (error) {
    console.error("Error getting pre-signed URL:", error);
    throw error;
  }
}

/**
 * Upload file lên S3 bằng pre-signed URL
 * @param {File} file - File object từ input
 * @param {string} uploadUrl - Pre-signed URL từ API
 * @returns {Promise<{success: boolean, fileKey?: string}>}
 */
export async function uploadFileToS3(file, uploadUrl) {
  try {
    const response = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": file.type,
      },
      body: file,
    });

    if (!response.ok) {
      throw new Error(
        `Upload failed: ${response.status} ${response.statusText}`
      );
    }

    // Extract file key từ URL (hoặc trả về từ API)
    // Pre-signed URL thường có format: https://bucket.s3.region.amazonaws.com/path/to/file?signature
    const urlObj = new URL(uploadUrl);
    const fileKey = urlObj.pathname.substring(1); // Remove leading slash

    return {
      success: true,
      fileKey,
    };
  } catch (error) {
    console.error("Error uploading file to S3:", error);
    throw error;
  }
}

/**
 * Validate file trước khi upload
 * @param {File} file - File object
 * @param {Object} options - Validation options
 * @returns {{valid: boolean, error?: string}}
 */
export function validateFile(file, options = {}) {
  const {
    maxSize = 5 * 1024 * 1024, // 5MB default
    allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
  } = options;

  if (!file) {
    return { valid: false, error: "Vui lòng chọn file" };
  }

  if (file.size > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File quá lớn. Kích thước tối đa: ${maxSizeMB}MB`,
    };
  }

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: "Chỉ chấp nhận file PDF hoặc Word (.pdf, .doc, .docx)",
    };
  }

  return { valid: true };
}
