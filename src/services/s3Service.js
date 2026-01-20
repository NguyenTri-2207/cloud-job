/**
 * Service để xử lý upload file lên S3
 *
 * Có 2 cách:
 * 1. Pre-signed URL (cũ): Frontend gọi API Gateway → lấy pre-signed URL → upload
 * 2. Amplify Storage API (mới): Dùng Amplify Storage trực tiếp
 */
import { uploadData, getUrl } from "aws-amplify/storage";

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

/**
 * Upload file lên S3 sử dụng Amplify Storage API (v6)
 *
 * @param {File} file - File object từ input
 * @param {string} fileKey - S3 key (path) để lưu file (e.g., "cvs/user123/job456/cv.pdf")
 * @param {Function} onProgress - Callback để track progress: (progress) => void
 * @returns {Promise<{success: boolean, fileKey: string, path: string}>}
 */
export async function uploadFileToS3Amplify(file, fileKey, onProgress = null) {
  try {
    // Validate file trước
    const validation = validateFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Generate file key nếu chưa có
    // Format: cvs/{timestamp}_{random}_{filename}
    const finalFileKey =
      fileKey ||
      `cvs/${Date.now()}_${Math.random().toString(36).substring(2, 9)}_${
        file.name
      }`;

    console.log("📤 Uploading file to S3 via Amplify Storage:", finalFileKey);

    // Upload using Amplify Storage API
    const result = await uploadData({
      key: finalFileKey,
      data: file,
      options: {
        contentType: file.type,
        onProgress: (progress) => {
          if (onProgress) {
            const percent = progress.transferredBytes
              ? Math.round(
                  (progress.transferredBytes / progress.totalBytes) * 100
                )
              : 0;
            onProgress({
              transferredBytes: progress.transferredBytes,
              totalBytes: progress.totalBytes,
              percent,
            });
          }
        },
      },
    }).result;

    console.log("✅ Upload successful:", result);

    // Get S3 URL for viewing
    let fileUrl = null;
    try {
      const urlResult = await getUrl({
        key: finalFileKey,
        options: {
          expiresIn: 3600, // URL valid for 1 hour
        },
      });
      fileUrl = urlResult.url.toString();
    } catch (urlError) {
      console.warn("Could not get file URL:", urlError);
      // Continue without URL
    }

    return {
      success: true,
      fileKey: finalFileKey,
      path: result.path || finalFileKey,
      fileUrl, // S3 URL để xem file
    };
  } catch (error) {
    console.error("❌ Error uploading file to S3 via Amplify:", error);
    throw new Error(
      error.message || "Có lỗi xảy ra khi upload file. Vui lòng thử lại."
    );
  }
}

/**
 * Lấy S3 URL từ fileKey để xem file
 * @param {string} fileKey - S3 key của file
 * @param {number} expiresIn - Thời gian URL hợp lệ (seconds), default 3600 (1 hour)
 * @returns {Promise<string>} S3 URL
 */
export async function getS3FileUrl(fileKey, expiresIn = 3600) {
  try {
    const urlResult = await getUrl({
      key: fileKey,
      options: {
        expiresIn,
      },
    });
    return urlResult.url.toString();
  } catch (error) {
    console.error("Error getting S3 file URL:", error);
    throw new Error("Không thể lấy link xem file. Vui lòng thử lại.");
  }
}
