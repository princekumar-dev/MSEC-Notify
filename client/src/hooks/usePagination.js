import { useState, useCallback } from 'react';

export const usePagination = (initialPage = 1, initialLimit = 20) => {
  const [page, setPage] = useState(initialPage);
  const [limit] = useState(initialLimit);

  const nextPage = useCallback(() => setPage((p) => p + 1), []);
  const prevPage = useCallback(() => setPage((p) => Math.max(1, p - 1)), []);
  const goToPage = useCallback((p) => setPage(p), []);
  const resetPage = useCallback(() => setPage(1), []);

  return { page, limit, nextPage, prevPage, goToPage, resetPage, setPage };
};
