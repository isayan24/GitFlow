import { useAuth } from '@clerk/tanstack-react-start'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

export function useUserGithubRepos(enabled: boolean = true) {
  const { getToken, isSignedIn } = useAuth();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  return useQuery({
    queryKey: ['github-repos'],
    queryFn: async () => {
      const token = await getToken();
      const response = await axios.get(`${API_URL}/api/github/repos`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data.repositories || [];
    },
    enabled: isSignedIn && enabled,
  });
}
