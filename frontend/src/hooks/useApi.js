import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { getApiErrorMessage } from '../services/api.js';

export const useApi = (request, options = {}) => {
  const [data, setData] = useState(options.initialData ?? null);
  const [loading, setLoading] = useState(Boolean(options.immediate ?? true));
  const [error, setError] = useState(null);

  const execute = useCallback(
    async (...args) => {
      setLoading(true);
      setError(null);
      try {
        const result = await request(...args);
        setData(result);
        return result;
      } catch (requestError) {
        setError(requestError);
        if (options.toastErrors !== false) {
          toast.error(getApiErrorMessage(requestError));
        }
        throw requestError;
      } finally {
        setLoading(false);
      }
    },
    [request, options.toastErrors]
  );

  useEffect(() => {
    if (options.immediate ?? true) {
      execute();
    }
  }, [execute, options.immediate]);

  return {
    data,
    setData,
    loading,
    error,
    execute,
  };
};
