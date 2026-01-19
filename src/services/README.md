# API Services - Mock Data Mode

## Cách sử dụng Mock Data

### Tự động (Recommended)
Mock data sẽ tự động được sử dụng khi:
- Không có `NEXT_PUBLIC_API_GATEWAY_URL` trong `.env`
- Hoặc set `NEXT_PUBLIC_USE_MOCK_DATA=true`
- **Hoặc khi có network error (Failed to fetch, CORS, timeout, etc.)** ⭐

### Environment Variables

```bash
# Option 1: Không set API URL → tự động dùng mock
# (không cần set gì cả)

# Option 2: Force dùng mock (ngay cả khi có API URL)
NEXT_PUBLIC_USE_MOCK_DATA=true

# Option 3: Dùng API thật (tự động fallback sang mock nếu network error)
NEXT_PUBLIC_API_GATEWAY_URL=https://your-api.execute-api.region.amazonaws.com/prod
```

## Auto Fallback Behavior

Khi có `NEXT_PUBLIC_API_GATEWAY_URL` nhưng gặp **network errors** (Failed to fetch, CORS, connection timeout, etc.), hệ thống sẽ **tự động fallback** sang mock data.

**Network errors được detect:**
- Failed to fetch
- NetworkError
- CORS errors
- Connection timeout
- DNS errors
- TypeErrors từ fetch

**Các lỗi khác (400, 401, 404, 500, etc.)** sẽ vẫn throw error để user biết (không fallback).

## Mock Data Format

Backend có thể tham khảo format trong `mockData.js`:

### GET /jobs
```json
{
  "jobs": [...],
  "total": 10,
  "page": 1,
  "limit": 10
}
```

### GET /jobs/:id
```json
{
  "id": "1",
  "title": "...",
  "company": "...",
  "location": "...",
  "type": "...",
  "salary": "...",
  "description": "...",
  "requirements": "...",
  "createdAt": "2024-01-15T10:00:00Z"
}
```

### POST /jobs/:id/apply
```json
{
  "success": true,
  "applicationId": "app_1234567890",
  "jobId": "1",
  "cvFileKey": "s3-key-path",
  "submittedAt": "2024-01-15T10:00:00Z"
}
```

