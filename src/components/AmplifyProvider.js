"use client";

import { Amplify } from "aws-amplify";
import { Authenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css"; // Nhớ import CSS nếu chưa có

// 1. Định nghĩa Config
const amplifyConfig = {
  Auth: {
    Cognito: {
      // Dùng toán tử ?? để an toàn hơn ||
      userPoolId: process.env.NEXT_PUBLIC_AWS_USER_POOL_ID ?? "",
      userPoolClientId: process.env.NEXT_PUBLIC_AWS_USER_POOL_CLIENT_ID ?? "",
      // Identity Pool ID - Bắt buộc để dùng Storage S3
      identityPoolId: process.env.NEXT_PUBLIC_AWS_IDENTITY_POOL_ID ?? "",
      // Lưu ý: Region phải khớp với User Pool của bạn (Singapore là ap-southeast-1)
      // Đừng để mặc định us-east-1 nếu bạn tạo ở Singapore
      loginWith: {
        email: true,
      },
      signUpVerificationMethod: "code",
      userAttributes: {
        email: {
          required: true,
        },
      },
    },
  },
  // Storage S3 Configuration
  Storage: {
    S3: {
      bucket:
        process.env.NEXT_PUBLIC_AWS_S3_BUCKET ?? "cloudhire-storage-upload",
      region: process.env.NEXT_PUBLIC_AWS_REGION ?? "ap-southeast-1",
    },
  },
};

// 2. QUAN TRỌNG: Gọi configure NGAY LẬP TỨC ở ngoài component
// Nó sẽ chạy 1 lần duy nhất khi app khởi động
Amplify.configure(amplifyConfig, { ssr: true }); // Thêm ssr: true nếu dùng Next.js

export default function AmplifyProvider({ children }) {
  // Component này giờ chỉ đóng vai trò bọc Context thôi
  return <Authenticator.Provider>{children}</Authenticator.Provider>;
}
