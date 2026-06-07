import { useAuth } from '@clerk/tanstack-react-start'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

export function useProjectDetails(repoId: string | null) {
  const { getToken, isSignedIn } = useAuth();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  return useQuery({
    queryKey: ['project-details', repoId],
    queryFn: async () => {
      if (!repoId) return null;
      const token = await getToken();
      const response = await axios.get(`${API_URL}/api/repositories/${repoId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data.repository;
    },
    enabled: isSignedIn && !!repoId,
  });
}
