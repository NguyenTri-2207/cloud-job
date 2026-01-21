import { uploadData, getUrl } from "aws-amplify/storage";

// Cấu hình Constants
const CLOUDFRONT_DOMAIN = process.env.NEXT_PUBLIC_CLOUDFRONT_DOMAIN; // Ví dụ: https://d123.cloudfront.net
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
];

/**
 * Helper: Tạo CloudFront URL từ File Key
 */
const buildCloudFrontUrl = (fileKey) => {
  if (!CLOUDFRONT_DOMAIN) return null;
  
  // Xử lý dấu '/' để tránh bị double slash (//)
  const baseUrl = CLOUDFRONT_DOMAIN.replace(/\/$/, "");
  const cleanKey = fileKey.replace(/^\//, "");
  
  return `${baseUrl}/${cleanKey}`;
};

/**
 * 1. Validate File
 */
export function validateFile(file) {
  if (!file) return { valid: false, error: "Vui lòng chọn file." };

  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `File quá lớn (Max: ${MAX_FILE_SIZE / 1024 / 1024}MB).` };
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: "Chỉ chấp nhận file PDF hoặc Word (.doc, .docx)." };
  }

  return { valid: true };
}

/**
 * 2. Upload File lên S3 (Dùng Amplify Gen 2)
 * @param {File} file - File từ input
 * @param {Function} onProgress - Callback update thanh tiến trình
 */
export async function uploadCVToS3(file, onProgress) {
  try {
    // Bước 1: Validate lại lần nữa cho chắc
    const validation = validateFile(file);
    if (!validation.valid) throw new Error(validation.error);

    // Bước 2: Tạo đường dẫn file (Key) chuẩn
    // Cấu trúc: public/cvs/{timestamp}_{random}_{filename}
    // Lưu ý: Phải bắt đầu bằng 'public/' để khớp với IAM Policy bạn đã setup
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_"); // Bỏ ký tự đặc biệt
    const fileKey = `public/cvs/${Date.now()}_${sanitizedFileName}`;

    console.log("🚀 Start Uploading:", fileKey);

    // Bước 3: Gọi Amplify SDK để upload
    const result = await uploadData({
      key: fileKey,
      data: file,
      options: {
        contentType: file.type, // Quan trọng để trình duyệt mở được file (thay vì download)
        onProgress: ({ transferredBytes, totalBytes }) => {
          if (onProgress && totalBytes) {
            const percent = Math.round((transferredBytes / totalBytes) * 100);
            onProgress(percent);
          }
        },
      },
    }).result;

    console.log("✅ Upload S3 Success:", result.key);

    // Bước 4: Tạo URL để xem lại (Ưu tiên CloudFront)
    const viewUrl = buildCloudFrontUrl(result.key);

    return {
      success: true,
      fileKey: result.key, // Lưu cái này vào DB (để sau này xóa hoặc xử lý)
      fileUrl: viewUrl,    // Lưu cái này vào DB (để Admin click xem luôn)
    };

  } catch (error) {
    console.error("❌ Upload Error:", error);
    throw new Error(error.message || "Lỗi khi upload file lên hệ thống.");
  }
}

/**
 * 3. Lấy URL xem file (Dùng khi hiển thị danh sách)
 * Hàm này dùng nếu bạn chỉ lưu Key trong DB và muốn generate URL động
 */
export async function getFileViewUrl(fileKey) {
  // Ưu tiên 1: CloudFront (Nhanh, rẻ, Public Read)
  const cfUrl = buildCloudFrontUrl(fileKey);
  if (cfUrl) return cfUrl;

  // Ưu tiên 2: S3 Signed URL (Fallback nếu chưa config CloudFront)
  try {
    const link = await getUrl({
      key: fileKey,
      options: { expiresIn: 3600 }, // Link sống 1 tiếng
    });
    return link.url.toString();
  } catch (err) {
    console.error("Get URL Error:", err);
    return null;
  }
}