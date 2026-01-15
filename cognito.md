- User Pool chính là cái DB chứa user. Bạn không cần lo maintenance, scale hay bảo mật password.

- JWT Tokens -Cognito là Stateless. Server (Lambda) không cần lưu session, chỉ cần verify cái Token là biết user là ai.

- Identity Pool & IAM Roles. Phân quyền (Role)

Muốn Login vào Web -> Cần User Pool.

Muốn Upload file lên S3 trực tiếp từ React -> Cần thêm Identity Pool.
