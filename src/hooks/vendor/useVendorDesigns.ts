import { useQuery } from '@tanstack/react-query';
import { queryKeys, cacheTimes } from '../../lib/react-query/queryClient';

const DESIGNS_API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:3004'}/vendor/designs`;

async function fetchVendorDesigns(page: number = 1) {
  const offset = (page - 1) * 20;
  const params = new URLSearchParams({ offset: String(offset), limit: '20' });
  const token = localStorage.getItem('token');

  const response = await fetch(`${DESIGNS_API_URL}?${params}`, {
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  const result = await response.json();
  if (!result.success) throw new Error(result.message || 'Erreur API');
  return result;
}

export function useVendorDesigns(page: number = 1) {
  return useQuery({
    queryKey: [...queryKeys.vendorDesigns, page],
    queryFn: () => fetchVendorDesigns(page),
    staleTime: cacheTimes.stats,
    gcTime: cacheTimes.stats * 2,
    retry: 2,
  });
}
