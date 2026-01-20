import { useCallback, useState } from "react";

/**
 * Hook quản lý trạng thái async: loading / error / success.
 * Dùng chung cho các page/form để tránh lặp code.
 */
export function useAsyncStatus(initialLoading = false) {
  const [loading, setLoading] = useState(initialLoading);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const resetStatus = useCallback(() => {
    setLoading(false);
    setError("");
    setSuccess(false);
  }, []);

  return {
    loading,
    setLoading,
    error,
    setError,
    success,
    setSuccess,
    resetStatus,
  };
}

