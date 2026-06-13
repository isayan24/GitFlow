import { useAuth } from '@clerk/tanstack-react-start'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

export function useRepoCommits(repoId: string | null, dateStr: string | null, enabled: boolean = true) {
  const { getToken, isSignedIn } = useAuth();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  return useQuery({
    queryKey: ['repo-commits', repoId, dateStr],
    queryFn: async () => {
      if (!repoId || !dateStr) return [];
      const token = await getToken();
      const url = repoId === "all"
        ? `${API_URL}/api/dashboard/commits`
        : `${API_URL}/api/repositories/${repoId}/commits`;

      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          date: dateStr,
        },
      });
      return response.data.commits || [];
    },
    enabled: isSignedIn && !!repoId && !!dateStr && enabled,
  });
}
